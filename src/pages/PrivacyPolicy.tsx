import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-foreground">Privacy Policy</h1>

        <div className="space-y-6 text-muted-foreground">

          <div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">1. Information We Collect</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Personal Information: name and email</li>
              <li>Usage Data: searches and saved jobs</li>
              <li>Device Information: browser, IP address</li>
              <li>Cookies for platform functionality</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">2. How We Use Your Information</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Provide and maintain the platform</li>
              <li>Improve features</li>
              <li>Customer support</li>
              <li>Process subscription payments</li>
              <li>Send updates or marketing (optional)</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">3. Data Storage and Security</h3>
            <p>
              Data is stored securely using encrypted infrastructure. 
              Authentication and database services are provided by Supabase.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">4. Third-Party Services</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Stripe – payment processing</li>
              <li>Supabase – authentication and database</li>
              <li>External job APIs</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">5. Data Sharing</h3>
            <p>
              We do not sell personal information. Data may be shared only for legal compliance or with trusted service providers.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">6. User Rights</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Access your data</li>
              <li>Correct your data</li>
              <li>Delete your account</li>
              <li>Export job data</li>
              <li>Opt-out of marketing emails</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">7. Cookies</h3>
            <p>
              Cookies help improve user experience. You can disable cookies in browser settings.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">8. Children's Privacy</h3>
            <p>
              Our platform is not intended for children under 16.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">9. International Transfers</h3>
            <p>
              Data may be processed in other countries depending on infrastructure providers.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">10. Changes to Privacy Policy</h3>
            <p>
              We may update this policy occasionally. Please review it periodically.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm">
              <strong>Last Updated:</strong> November 27, 2025
            </p>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;