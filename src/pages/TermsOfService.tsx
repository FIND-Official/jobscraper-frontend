import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const TermsOfService = () => {
  return (
    <>
      <Header />
      <main className="flex-1 container mx-auto px-4 pt-28 pb-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-foreground">Terms and Conditions</h1>

        <div className="space-y-8 text-muted-foreground">

          <div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">Introduction</h3>
            <p>
              Welcome to FIND Services. These Terms of Service govern your use of our website and services.
              By accessing or using our Service, you agree to be bound by these Terms and our Privacy Policy.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">Communications</h3>
            <p>
              By using our Service, you agree to receive newsletters, marketing materials, and other
              communications from us. You may opt out of these communications at any time by following
              the unsubscribe link or contacting us.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">Purchases</h3>
            <p className="mb-2">
              If you wish to purchase any product or service through the Service, you may be asked to
              provide payment details including billing information and payment method.
            </p>
            <p>
              You represent that you have the legal right to use any payment method provided and that
              the information you supply is accurate and complete.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">Subscriptions</h3>
            <p>
              Some parts of the Service are billed on a subscription basis. Subscriptions renew
              automatically at the end of each billing cycle unless canceled.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">Free Trial</h3>
            <p>
              We may offer a free trial for a limited time. If you provide payment details when signing
              up, you will not be charged until the free trial period ends.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">Refunds</h3>
            <p>
              Refunds for services or contracts may be issued within the period specified at the time
              of purchase.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">User Conduct</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Do not use the Service for unlawful purposes</li>
              <li>Do not attempt unauthorized access to the platform</li>
              <li>Do not transmit spam or promotional messages</li>
              <li>Do not introduce malicious software</li>
              <li>Do not disrupt the operation of the Service</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">Accounts</h3>
            <p>
              When creating an account, you agree to provide accurate and complete information.
              You are responsible for maintaining the confidentiality of your account credentials.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">Intellectual Property</h3>
            <p>
              The Service and its original content, features, and functionality remain the exclusive
              property of FIND Services and its licensors.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">Disclaimer of Warranty</h3>
            <p>
              The Service is provided on an “AS IS” and “AS AVAILABLE” basis without warranties of any kind.
              Your use of the Service is at your own risk.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">Limitation of Liability</h3>
            <p>
              FIND Services shall not be liable for any indirect, incidental, special, or consequential
              damages arising from the use of the Service.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">Termination</h3>
            <p>
              We may terminate or suspend access to the Service immediately without prior notice if
              you breach these Terms.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">Governing Law</h3>
            <p>
              These Terms are governed by the laws of Nigeria without regard to conflict of law provisions.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">Changes to Terms</h3>
            <p>
              We reserve the right to modify these Terms at any time. Continued use of the Service
              following any changes means you accept the revised Terms.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">Contact Us</h3>
            <p>
              If you have any questions about these Terms, please contact us at:
              <br />
              <strong>info@wefindservices.org</strong>
            </p>
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
};

export default TermsOfService;