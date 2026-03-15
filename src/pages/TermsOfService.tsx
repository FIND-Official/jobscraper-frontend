import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const TermsOfService = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-foreground">Terms of Service</h1>

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
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose</li>
              <li>Attempt to reverse engineer any software contained on the platform</li>
              <li>Remove copyright or proprietary notations</li>
              <li>Transfer materials to another person</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">3. User Account</h3>
            <p>
              To access certain features of the platform, you may be required to create an account. 
              You are responsible for maintaining the confidentiality of your account credentials.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">4. Subscription and Payments</h3>
            <p className="mb-2">Premium features include:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Unlimited job searches</li>
              <li>CSV export functionality</li>
              <li>Priority access to new features</li>
              <li>Ad-free experience</li>
            </ul>
            <p className="mt-2">
              Subscription fees are charged on a recurring basis. You may cancel your subscription anytime.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">5. Job Listings Disclaimer</h3>
            <p>
              Job listings are aggregated from third-party sources. We do not guarantee accuracy or availability 
              of listings. Users should verify job details directly with the employer.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">6. User Conduct</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Do not use the platform for unlawful purposes</li>
              <li>Do not attempt unauthorized access</li>
              <li>Do not disrupt servers or platform functionality</li>
              <li>Do not scrape or harvest data</li>
              <li>Do not impersonate others</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">7. Limitation of Liability</h3>
            <p>
              We are not liable for damages arising from use or inability to use the platform.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">8. Modifications</h3>
            <p>
              We may revise these terms at any time. Continued use of the platform means you accept the updated terms.
            </p>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfService;