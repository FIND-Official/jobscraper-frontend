import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { MongoClient, ObjectId } from "npm:mongodb@6.12.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

// Generic email domain blacklist
const GENERIC_EMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.uk", "yahoo.ca",
  "outlook.com", "hotmail.com", "live.com", "msn.com", "icloud.com",
  "aol.com", "proton.me", "protonmail.com", "zoho.com", "mail.com",
  "yandex.com", "gmx.com", "fastmail.com", "hey.com", "tempmail.com"
]);

function validateCompanyEmail(email: string): { isValid: boolean; error?: string } {
  const trimmed = (email || "").trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!trimmed || !emailRegex.test(trimmed)) {
    return { isValid: false, error: "Please enter a valid email address." };
  }
  const parts = trimmed.split("@");
  if (parts.length !== 2) {
    return { isValid: false, error: "Please enter a valid email address." };
  }
  const domain = parts[1];
  if (GENERIC_EMAIL_DOMAINS.has(domain)) {
    return {
      isValid: false,
      error: `Please use your official work email. Generic domains (@${domain}) are not accepted for company accounts.`,
    };
  }
  return { isValid: true };
}

// Password hashing helper (Web Crypto API available in Deno runtime)
async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password + salt),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: enc.encode(salt),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  return Array.from(new Uint8Array(derivedBits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generateToken(payload: { id: string; email: string }): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + 30 * 24 * 60 * 60 * 1000 }));
  const signature = btoa(`sig_${payload.id}_${payload.email}`);
  return `${header}.${body}.${signature}`;
}

function verifyToken(token: string): { id: string; email: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const body = JSON.parse(atob(parts[1]));
    if (body.exp && Date.now() > body.exp) return null;
    return { id: body.id, email: body.email };
  } catch {
    return null;
  }
}

// MongoDB Client Connection caching
let cachedMongoClient: MongoClient | null = null;

async function getMongoDatabase() {
  const uri = Deno.env.get("MONGODB_URI") || Deno.env.get("MONGO_URI");
  const dbName = Deno.env.get("MONGODB_DB_NAME") || "find_partner_employers";

  if (!uri) {
    console.warn("[COMPANY-API] MONGODB_URI is not set. Operating in memory-fallback mode.");
    return null;
  }

  if (!cachedMongoClient) {
    const client = new MongoClient(uri);
    await client.connect();
    cachedMongoClient = client;
    console.log("[COMPANY-API] Connected to MongoDB database:", dbName);
  }

  return cachedMongoClient.db(dbName);
}

// In-memory fallback if MONGODB_URI is pending team environment setup
const fallbackCompanies = new Map<string, any>();
const fallbackJobs: any[] = [];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const tokenFromHeader = authHeader ? authHeader.replace("Bearer ", "") : null;

    let body: any = {};
    if (req.method === "POST" || req.method === "PUT") {
      try {
        body = await req.json();
      } catch (_) {
        body = {};
      }
    }

    const action = body.action || new URL(req.url).searchParams.get("action") || "";
    const token = body.token || tokenFromHeader;

    const db = await getMongoDatabase();
    const companiesColl = db ? db.collection("companies") : null;
    const jobsColl = db ? db.collection("company_jobs") : null;

    // 1. ACTION: SIGN UP
    if (action === "signup") {
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");

      const emailValidation = validateCompanyEmail(email);
      if (!emailValidation.isValid) {
        return new Response(
          JSON.stringify({ error: emailValidation.error }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (password.length < 6) {
        return new Response(
          JSON.stringify({ error: "Password must be at least 6 characters long." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check existing in MongoDB
      let existingCompany = null;
      if (companiesColl) {
        existingCompany = await companiesColl.findOne({ email });
      } else {
        existingCompany = fallbackCompanies.get(email);
      }

      if (existingCompany) {
        return new Response(
          JSON.stringify({ error: "An account with this work email already exists. Please sign in." }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const salt = generateSalt();
      const passwordHash = await hashPassword(password, salt);
      const companyDoc: any = {
        email,
        passwordHash,
        salt,
        onboardingCompleted: false,
        profile: {
          companyName: "",
          city: "",
          country: "",
          businessType: "",
          websiteUrl: "",
          companySize: "",
          firstName: "",
          lastName: "",
          workEmail: email,
          jobTitle: "",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
      };

      let id = "";
      if (companiesColl) {
        const result = await companiesColl.insertOne(companyDoc);
        id = result.insertedId.toString();
        companyDoc._id = result.insertedId;
      } else {
        id = `comp_${Date.now()}`;
        companyDoc._id = id;
        fallbackCompanies.set(email, companyDoc);
      }

      const authToken = generateToken({ id, email });
      return new Response(
        JSON.stringify({
          success: true,
          token: authToken,
          company: {
            id,
            email,
            onboardingCompleted: false,
            profile: companyDoc.profile,
          },
        }),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. ACTION: SIGN IN
    if (action === "signin") {
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");

      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: "Email and password are required." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let companyDoc: any = null;
      if (companiesColl) {
        companyDoc = await companiesColl.findOne({ email });
      } else {
        companyDoc = fallbackCompanies.get(email);
      }

      if (!companyDoc) {
        return new Response(
          JSON.stringify({ error: "Invalid credentials. No company account found with this email." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const calculatedHash = await hashPassword(password, companyDoc.salt);
      if (calculatedHash !== companyDoc.passwordHash) {
        return new Response(
          JSON.stringify({ error: "Invalid email or password." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update lastLoginAt in MongoDB
      if (companiesColl) {
        await companiesColl.updateOne({ _id: companyDoc._id }, { $set: { lastLoginAt: new Date() } });
      } else {
        companyDoc.lastLoginAt = new Date();
      }

      const id = companyDoc._id.toString();
      const authToken = generateToken({ id, email: companyDoc.email });

      return new Response(
        JSON.stringify({
          success: true,
          token: authToken,
          company: {
            id,
            email: companyDoc.email,
            onboardingCompleted: Boolean(companyDoc.onboardingCompleted),
            profile: companyDoc.profile || {},
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // AUTH CHECK FOR SUBSEQUENT ACTIONS
    const verified = token ? verifyToken(token) : null;
    if (!verified) {
      return new Response(
        JSON.stringify({ error: "Unauthorized. Missing or invalid company token." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. ACTION: GET PROFILE / ME
    if (action === "get-profile" || action === "me") {
      let companyDoc: any = null;
      if (companiesColl) {
        try {
          companyDoc = await companiesColl.findOne({ _id: new ObjectId(verified.id) });
        } catch (_) {
          companyDoc = await companiesColl.findOne({ email: verified.email });
        }
      } else {
        companyDoc = fallbackCompanies.get(verified.email);
      }

      if (!companyDoc) {
        return new Response(
          JSON.stringify({ error: "Company profile not found." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          company: {
            id: companyDoc._id.toString(),
            email: companyDoc.email,
            onboardingCompleted: Boolean(companyDoc.onboardingCompleted),
            profile: companyDoc.profile || {},
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. ACTION: COMPLETE ONBOARDING
    if (action === "complete-onboarding") {
      const profile = body.profile || {};
      const companyName = String(profile.companyName || "").trim();
      const city = String(profile.city || "").trim();
      const country = String(profile.country || "").trim();
      const businessType = String(profile.businessType || "").trim();
      const websiteUrl = String(profile.websiteUrl || "").trim();
      const companySize = String(profile.companySize || "").trim();
      const firstName = String(profile.firstName || "").trim();
      const lastName = String(profile.lastName || "").trim();
      const jobTitle = String(profile.jobTitle || "").trim();

      if (!companyName || !city || !country || !businessType || !websiteUrl || !companySize || !firstName || !lastName) {
        return new Response(
          JSON.stringify({ error: "All required company profile fields must be provided." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const updatedProfile = {
        companyName,
        city,
        country,
        businessType,
        websiteUrl: websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`,
        companySize,
        firstName,
        lastName,
        workEmail: verified.email,
        jobTitle,
        onboardingCompleted: true,
      };

      if (companiesColl) {
        try {
          await companiesColl.updateOne(
            { _id: new ObjectId(verified.id) },
            {
              $set: {
                profile: updatedProfile,
                onboardingCompleted: true,
                updatedAt: new Date(),
              },
            }
          );
        } catch (_) {
          await companiesColl.updateOne(
            { email: verified.email },
            {
              $set: {
                profile: updatedProfile,
                onboardingCompleted: true,
                updatedAt: new Date(),
              },
            }
          );
        }
      } else {
        const c = fallbackCompanies.get(verified.email);
        if (c) {
          c.profile = updatedProfile;
          c.onboardingCompleted = true;
          c.updatedAt = new Date();
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          company: {
            id: verified.id,
            email: verified.email,
            onboardingCompleted: true,
            profile: updatedProfile,
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. ACTION: UPDATE PROFILE
    if (action === "update-profile") {
      const profile = body.profile || {};
      const companyName = String(profile.companyName || "").trim();
      if (!companyName) {
        return new Response(
          JSON.stringify({ error: "Company name is required." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const updatedProfile = {
        companyName,
        city: String(profile.city || "").trim(),
        country: String(profile.country || "").trim(),
        businessType: String(profile.businessType || "").trim(),
        websiteUrl: String(profile.websiteUrl || "").trim(),
        companySize: String(profile.companySize || "").trim(),
        firstName: String(profile.firstName || "").trim(),
        lastName: String(profile.lastName || "").trim(),
        workEmail: verified.email,
        jobTitle: String(profile.jobTitle || "").trim(),
        onboardingCompleted: true,
      };

      if (companiesColl) {
        try {
          await companiesColl.updateOne(
            { _id: new ObjectId(verified.id) },
            { $set: { profile: updatedProfile, updatedAt: new Date() } }
          );
        } catch (_) {
          await companiesColl.updateOne(
            { email: verified.email },
            { $set: { profile: updatedProfile, updatedAt: new Date() } }
          );
        }
      } else {
        const c = fallbackCompanies.get(verified.email);
        if (c) {
          c.profile = updatedProfile;
          c.updatedAt = new Date();
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          company: {
            id: verified.id,
            email: verified.email,
            onboardingCompleted: true,
            profile: updatedProfile,
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. ACTION: GET JOBS
    if (action === "get-jobs") {
      let jobs: any[] = [];
      if (jobsColl) {
        jobs = await jobsColl
          .find({ $or: [{ companyId: verified.id }, { companyEmail: verified.email }] })
          .sort({ createdAt: -1 })
          .toArray();
        jobs = jobs.map((j) => ({
          id: j._id.toString(),
          title: j.title,
          type: j.type,
          location: j.location,
          salary: j.salary,
          applyUrl: j.applyUrl,
          description: j.description,
          postedDate: j.postedDate || "Recently",
          syndicatedBoards: j.syndicatedBoards || [],
          status: j.status || "active",
          applicantsCount: j.applicantsCount || 0,
          createdAt: j.createdAt,
        }));
      } else {
        jobs = fallbackJobs.filter(
          (j) => j.companyId === verified.id || j.companyEmail === verified.email
        );
      }

      return new Response(
        JSON.stringify({ success: true, jobs }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. ACTION: CREATE JOB
    if (action === "create-job") {
      const title = String(body.title || "").trim();
      const type = String(body.type || "Full-time").trim();
      const location = String(body.location || "Remote").trim();
      const salary = String(body.salary || "").trim();
      const applyUrl = String(body.applyUrl || "").trim();
      const description = String(body.description || "").trim();
      const syndicatedBoards = Array.isArray(body.syndicatedBoards) ? body.syndicatedBoards : [];

      if (!title) {
        return new Response(
          JSON.stringify({ error: "Job title is required." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const jobDoc: any = {
        companyId: verified.id,
        companyEmail: verified.email,
        title,
        type,
        location,
        salary,
        applyUrl,
        description,
        syndicatedBoards,
        status: "active",
        applicantsCount: 0,
        postedDate: "Just now",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      let jobId = "";
      if (jobsColl) {
        const result = await jobsColl.insertOne(jobDoc);
        jobId = result.insertedId.toString();
        jobDoc.id = jobId;
      } else {
        jobId = `job_${Date.now()}`;
        jobDoc.id = jobId;
        fallbackJobs.unshift(jobDoc);
      }

      return new Response(
        JSON.stringify({ success: true, job: jobDoc }),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Unknown action: "${action}"` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[COMPANY-API] Internal Error:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Internal server error." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
