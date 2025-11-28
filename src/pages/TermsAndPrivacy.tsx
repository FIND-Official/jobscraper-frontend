import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Separator } from "@/components/ui/separator";

const TermsAndPrivacy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-foreground">Terms of Service & Privacy Policy</h1>
        
        <div className="space-y-12">
          {/* Terms of Service Section */}
          <section>
            <h2 className="text-3xl font-semibold mb-6 text-foreground">Terms of Service</h2>
            
            <div className="space-y-6 text-muted-foreground">
              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">1. Acceptance of Terms</h3>
                <p>
                  By accessing and using this job search platform, you accept and agree to be bound by the terms and provision of this agreement. 
                  If you do not agree to abide by the above, please do not use this service.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">2. Use License</h3>
                <p className="mb-2">
                  Permission is granted to temporarily access and use the materials on this platform for personal, non-commercial transitory viewing only. 
                  This is the grant of a license, not a transfer of title, and under this license you may not:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Modify or copy the materials</li>
                  <li>Use the materials for any commercial purpose or public display</li>
                  <li>Attempt to reverse engineer any software contained on the platform</li>
                  <li>Remove any copyright or proprietary notations from the materials</li>
                  <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">3. User Account</h3>
                <p>
                  To access certain features of the platform, you may be required to create an account. You are responsible for maintaining the 
                  confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately 
                  of any unauthorized use of your account.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">4. Subscription and Payments</h3>
                <p className="mb-2">
                  Our platform offers both free and premium subscription tiers. Premium features include:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Unlimited job searches and saves</li>
                  <li>CSV export functionality for saved jobs</li>
                  <li>Priority access to new features</li>
                  <li>Ad-free experience</li>
                </ul>
                <p className="mt-2">
                  Subscription fees are charged on a recurring basis. You may cancel your subscription at any time, but refunds are not provided 
                  for partial subscription periods.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">5. Job Listings Disclaimer</h3>
                <p>
                  Job listings on this platform are aggregated from various third-party sources. We do not guarantee the accuracy, completeness, 
                  or availability of any job listing. We are not responsible for the content of external job postings or the hiring practices of 
                  third-party employers. Users should verify all job details directly with the employer before applying.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">6. User Conduct</h3>
                <p className="mb-2">You agree not to:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Use the platform for any unlawful purpose</li>
                  <li>Attempt to gain unauthorized access to any portion of the platform</li>
                  <li>Interfere with or disrupt the platform or servers</li>
                  <li>Scrape, spider, or harvest information from the platform using automated means</li>
                  <li>Impersonate any person or entity</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">7. Limitation of Liability</h3>
                <p>
                  In no event shall we be liable for any damages (including, without limitation, damages for loss of data or profit, or due to 
                  business interruption) arising out of the use or inability to use the materials on this platform, even if we have been notified 
                  of the possibility of such damage.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">8. Modifications to Terms</h3>
                <p>
                  We reserve the right to revise these terms of service at any time without notice. By using this platform, you agree to be bound 
                  by the current version of these terms of service.
                </p>
              </div>
            </div>
          </section>

          <Separator className="my-12" />

          {/* Privacy Policy Section */}
          <section>
            <h2 className="text-3xl font-semibold mb-6 text-foreground">Privacy Policy</h2>
            
            <div className="space-y-6 text-muted-foreground">
              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">1. Information We Collect</h3>
                <p className="mb-2">We collect several types of information from and about users of our platform:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Personal Information:</strong> Name, email address, and payment information when you create an account or subscribe to premium features</li>
                  <li><strong>Usage Data:</strong> Information about how you interact with our platform, including search queries, saved jobs, and feature usage</li>
                  <li><strong>Device Information:</strong> Browser type, IP address, operating system, and device identifiers</li>
                  <li><strong>Cookies:</strong> We use cookies and similar tracking technologies to track activity and store certain information</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">2. How We Use Your Information</h3>
                <p className="mb-2">We use the collected information for various purposes:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>To provide and maintain our platform</li>
                  <li>To notify you about changes to our platform</li>
                  <li>To provide customer support</li>
                  <li>To gather analysis or valuable information to improve our platform</li>
                  <li>To monitor the usage of our platform</li>
                  <li>To detect, prevent and address technical issues</li>
                  <li>To process your subscription payments</li>
                  <li>To send you marketing communications (you can opt-out at any time)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">3. Data Storage and Security</h3>
                <p>
                  Your data is stored securely using industry-standard encryption methods. We use Supabase for our database infrastructure, 
                  which provides enterprise-grade security. Payment information is processed through Stripe and is never stored on our servers. 
                  However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">4. Third-Party Services</h3>
                <p className="mb-2">We use the following third-party services that may collect information:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Stripe:</strong> For payment processing</li>
                  <li><strong>Supabase:</strong> For database and authentication services</li>
                  <li><strong>Job Board APIs:</strong> We aggregate job listings from RemoteOK, We Work Remotely, and other sources</li>
                </ul>
                <p className="mt-2">
                  These third parties have their own privacy policies addressing how they use such information.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">5. Data Sharing</h3>
                <p className="mb-2">We do not sell your personal information. We may share your information in the following circumstances:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>With your consent:</strong> We may share information when you give us explicit permission</li>
                  <li><strong>For legal reasons:</strong> If required by law or in response to legal process</li>
                  <li><strong>Service providers:</strong> With third-party vendors who help us operate our platform (they are bound by confidentiality agreements)</li>
                  <li><strong>Business transfers:</strong> In connection with any merger, sale of company assets, or acquisition</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">6. Your Data Rights</h3>
                <p className="mb-2">You have the following rights regarding your personal data:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Access:</strong> You can request a copy of your personal data</li>
                  <li><strong>Correction:</strong> You can update or correct your information through your account settings</li>
                  <li><strong>Deletion:</strong> You can request deletion of your account and associated data</li>
                  <li><strong>Portability:</strong> You can export your saved jobs data in CSV format (Pro feature)</li>
                  <li><strong>Opt-out:</strong> You can unsubscribe from marketing emails at any time</li>
                </ul>
                <p className="mt-2">To exercise these rights, please contact us through the contact form on our platform.</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">7. Cookies Policy</h3>
                <p>
                  We use cookies to enhance your experience. Cookies are small data files stored on your device. You can instruct your browser 
                  to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able 
                  to use some portions of our platform.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">8. Children's Privacy</h3>
                <p>
                  Our platform is not intended for children under the age of 16. We do not knowingly collect personal information from children 
                  under 16. If you are a parent or guardian and believe your child has provided us with personal information, please contact us 
                  so we can delete such information.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">9. International Data Transfers</h3>
                <p>
                  Your information may be transferred to and maintained on computers located outside of your state, province, country, or other 
                  governmental jurisdiction where the data protection laws may differ. By using our platform, you consent to such transfers.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">10. Changes to Privacy Policy</h3>
                <p>
                  We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on 
                  this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">11. Contact Us</h3>
                <p>
                  If you have any questions about these Terms of Service or Privacy Policy, please contact us using the contact form on our platform.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-border">
                <p className="text-sm">
                  <strong>Last Updated:</strong> November 27, 2025
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsAndPrivacy;