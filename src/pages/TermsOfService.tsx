import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";


// updated terms page
const TermsOfService = () => {
  const termsHTML = `
<style>
body {
  background: transparent;
  color: #e5e7eb;
  line-height: 1.9;
  font-size: 20px;
}

h1, h2, h3, strong {
  color: #ffffff;
}

a {
  color: #38bdf8;
  text-decoration: underline;
}

</style>

<div>

<h1>TERMS AND CONDITIONS</h1>
<p><strong>Last updated: 2026-03-16</strong></p>

<p><strong>1. Introduction</strong></p>

<p>Welcome to <strong>FIND Services</strong> (“Company”, “we”, “our”, “us”)!</p>

<p>These Terms of Service (“Terms”, “Terms of Service”) govern your use of our website located at https://wefindservices.org/ (together or individually “Service”) operated by <strong>FIND Services</strong>.</p>

<p>Our Privacy Policy also governs your use of our Service and explains how we collect, safeguard and disclose information that results from your use of our web pages.</p>

<p>Your agreement with us includes these Terms and our Privacy Policy (“Agreements”). You acknowledge that you have read and understood Agreements, and agree to be bound of them.</p>

<p>If you do not agree with (or cannot comply with) Agreements, then you may not use the Service, but please let us know by emailing at info@wefindservices.org so we can try to find a solution. These Terms apply to all visitors, users and others who wish to access or use Service.</p>

<p><strong>2. Communications</strong></p>
<p>By using our Service, you agree to subscribe to newsletters, marketing or promotional materials and other information we may send...</p>

<p><strong>3. Purchases</strong></p>
<p>If you wish to purchase any product or service made available through Service (“Purchase”), you may be asked to supply certain information...</p>

<p><strong>4. Contests, Sweepstakes and Promotions</strong></p>
<p>Any contests, sweepstakes or other promotions...</p>

<p><strong>5. Subscriptions</strong></p>
<p>Some parts of Service are billed on a subscription basis...</p>

<p><strong>6. Free Trial</strong></p>
<p>FIND Services may, at its sole discretion...</p>

<p><strong>7. Fee Changes</strong></p>
<p>FIND Services, in its sole discretion...</p>

<p><strong>8. Refunds</strong></p>
<p>We issue refunds for Contracts within 0 days...</p>

<p><strong>9. Content</strong></p>
<p>Content found on or through this Service are the property of FIND Services...</p>

<p><strong>10. Prohibited Uses</strong></p>
<p>You may use Service only for lawful purposes...</p>

<p><strong>11. Analytics</strong></p>
<p>We may use third-party Service Providers...</p>

<p><strong>12. No Use By Minors</strong></p>
<p>Service is intended only for access and use by individuals at least eighteen (18) years old...</p>

<p><strong>13. Accounts</strong></p>
<p>When you create an account with us...</p>

<p><strong>14. Intellectual Property</strong></p>
<p>Service and its original content...</p>

<p><strong>15. Copyright Policy</strong></p>
<p>We respect the intellectual property rights of others...</p>

<p><strong>16. DMCA Notice</strong></p>
<p>You may submit a notification pursuant to the DMCA...</p>

<p><strong>17. Error Reporting and Feedback</strong></p>
<p>You may provide us feedback...</p>

<p><strong>18. Links To Other Web Sites</strong></p>
<p>Our Service may contain links to third party websites...</p>

<p><strong>19. Disclaimer Of Warranty</strong></p>
<p>THESE SERVICES ARE PROVIDED “AS IS”...</p>

<p><strong>20. Limitation Of Liability</strong></p>
<p>EXCEPT AS PROHIBITED BY LAW...</p>

<p><strong>21. Termination</strong></p>
<p>We may terminate or suspend your account...</p>

<p><strong>22. Governing Law</strong></p>
<p>These Terms shall be governed...</p>

<p><strong>23. Changes To Service</strong></p>
<p>We reserve the right to withdraw...</p>

<p><strong>24. Amendments To Terms</strong></p>
<p>We may amend Terms at any time...</p>

<p><strong>25. Waiver And Severability</strong></p>
<p>No waiver by Company...</p>

<p><strong>26. Acknowledgement</strong></p>
<p>BY USING SERVICE...</p>

<p><strong>27. Contact Us</strong></p>
<p>Please send your feedback to info@wefindservices.org</p>

</div>
`;

  return (
    <>
      <Header />
      <main className="flex-1 bg-black text-white min-h-screen w-full px-4 pt-28 pb-12">
        <div
          dangerouslySetInnerHTML={{ __html: termsHTML }}
        />
      </main>
      <Footer />
    </>
  );
};

export default TermsOfService;