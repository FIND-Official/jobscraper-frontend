import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";

const termsHTML = `<style>
  [data-custom-class='body'], [data-custom-class='body'] * {
    background: transparent !important;
  }
  [data-custom-class='title'], [data-custom-class='title'] * {
    font-family: Arial !important;
    font-size: 26px !important;
    color: #ffffff !important;
    text-align: left !important;
  }
  [data-custom-class='subtitle'], [data-custom-class='subtitle'] * {
    font-family: Arial !important;
    color: #ffffff !important;
    font-size: 14px !important;
    text-align: left !important;
  }
  [data-custom-class='heading_1'], [data-custom-class='heading_1'] * {
    font-family: Arial !important;
    font-size: 19px !important;
    color: #ffffff !important;
  }
  [data-custom-class='heading_2'], [data-custom-class='heading_2'] * {
    font-family: Arial !important;
    font-size: 17px !important;
    color: #ffffff !important;
  }
  [data-custom-class='body_text'], [data-custom-class='body_text'] * {
    color: #ffffff !important;
    font-size: 14px !important;
    font-family: Arial !important;
    line-height: 1.6 !important;
  }
  [data-custom-class='link'], [data-custom-class='link'] * {
    color: #38bdf8 !important;
    font-size: 14px !important;
    font-family: Arial !important;
    word-break: break-word !important;
  }
  .terms-container {
    max-width: 800px;
    margin: 0 auto;
    width: 100%;
  }
</style>

<div data-custom-class="body" class="terms-container">
  <div data-custom-class="title"><strong>TERMS AND CONDITIONS</strong></div>
  <div data-custom-class="subtitle">Last updated: 2026-03-16</div>
  <br/>
  
  <div data-custom-class="heading_1"><strong>1. Introduction</strong></div>
  <div data-custom-class="body_text">
    Welcome to <strong>FIND Services</strong> (“Company”, “we”, “our”, “us”)! These Terms of Service (“Terms”, “Terms of Service”) govern your use of our website located at <a data-custom-class="link" href="https://wefindservices.org/" target="_blank">https://wefindservices.org/</a> (together or individually “Service”) operated by <strong>FIND Services</strong>.<br/><br/>
    Our Privacy Policy also governs your use of our Service and explains how we collect, safeguard and disclose information that results from your use of our web pages. Your agreement with us includes these Terms and our Privacy Policy (“Agreements”). You acknowledge that you have read and understood Agreements, and agree to be bound by them. If you do not agree with (or cannot comply with) Agreements, then you may not use the Service, but please let us know by emailing at <a data-custom-class="link" href="mailto:info@wefindservices.org">info@wefindservices.org</a> so we can try to find a solution. These Terms apply to all visitors, users and others who wish to access or use Service.
  </div>
  <br/>

  <div data-custom-class="heading_1"><strong>2. Communications</strong></div>
  <div data-custom-class="body_text">
    By using our Service, you agree to subscribe to newsletters, marketing or promotional materials and other information we may send. However, you may opt out of receiving any, or all, of these communications from us by following the unsubscribe link or by emailing at <a data-custom-class="link" href="mailto:info@wefindservices.org">info@wefindservices.org</a>.
  </div>
  <br/>

  <div data-custom-class="heading_1"><strong>3. Purchases</strong></div>
  <div data-custom-class="body_text">
    If you wish to purchase any product or service made available through Service (“Purchase”), you may be asked to supply certain information relevant to your Purchase including but not limited to, your credit or debit card number, the expiration date of your card, your billing address, and your shipping information. You represent and warrant that: (i) you have the legal right to use any card(s) or other payment method(s) in connection with any Purchase; and that (ii) the information you supply to us is true, correct and complete. We may employ the use of third party services for the purpose of facilitating payment and the completion of Purchases. By submitting your information, you grant us the right to provide the information to these third parties subject to our Privacy Policy. We reserve the right to refuse or cancel your order at any time for reasons including but not limited to: product or service availability, errors in the description or price of the product or service, error in your order or other reasons. We reserve the right to refuse or cancel your order if fraud or an unauthorized or illegal transaction is suspected.
  </div>
  <br/>

  <div data-custom-class="heading_1"><strong>4. Contests, Sweepstakes and Promotions</strong></div>
  <div data-custom-class="body_text">
    Any contests, sweepstakes or other promotions (collectively, “Promotions”) made available through Service may be governed by rules that are separate from these Terms of Service. If you participate in any Promotions, please review the applicable rules as well as our Privacy Policy. If the rules for a Promotion conflict with these Terms of Service, Promotion rules will apply.
  </div>
  <br/>

  <div data-custom-class="heading_1"><strong>5. Subscriptions</strong></div>
  <div data-custom-class="body_text">
    Some parts of Service are billed on a subscription basis ("Subscription(s)"). You will be billed in advance on a recurring and periodic basis ("Billing Cycle"). Billing cycles will be set depending on the type of subscription plan you select when purchasing a Subscription. At the end of each Billing Cycle, your Subscription will automatically renew under the exact same conditions unless you cancel it or FIND Services cancels it. You may cancel your Subscription renewal either through your online account management page or by contacting <a data-custom-class="link" href="mailto:info@wefindservices.org">info@wefindservices.org</a> customer support team. A valid payment method is required to process the payment for your subscription. You shall provide FIND Services with accurate and complete billing information that may include but not limited to full name, address, state, postal or zip code, telephone number, and a valid payment method information. By submitting such payment information, you automatically authorize FIND Services to charge all Subscription fees incurred through your account to any such payment instruments. Should automatic billing fail to occur for any reason, FIND Services reserves the right to terminate your access to the Service with immediate effect.
  </div>
  <br/>

  <div data-custom-class="heading_1"><strong>6. Free Trial</strong></div>
  <div data-custom-class="body_text">
    FIND Services may, at its sole discretion, offer a Subscription with a free trial for a limited period of time ("Free Trial"). You may be required to enter your billing information in order to sign up for Free Trial. If you do enter your billing information when signing up for Free Trial, you will not be charged by FIND Services until Free Trial has expired. On the last day of Free Trial period, unless you cancelled your Subscription, you will be automatically charged the applicable Subscription fees for the type of Subscription you have selected. At any time and without notice, FIND Services reserves the right to (i) modify Terms of Service of Free Trial offer, or (ii) cancel such Free Trial offer.
  </div>
  <br/>

  <div data-custom-class="heading_1"><strong>7. Fee Changes</strong></div>
  <div data-custom-class="body_text">
    FIND Services, in its sole discretion and at any time, may modify Subscription fees for the Subscriptions. Any Subscription fee change will become effective at the end of the then-current Billing Cycle. FIND Services will provide you with a reasonable prior notice of any change in Subscription fees to give you an opportunity to terminate your Subscription before such change becomes effective. Your continued use of Service after Subscription fee change comes into effect constitutes your agreement to pay the modified Subscription fee amount.
  </div>
  <br/>

  <div data-custom-class="heading_1"><strong>8. Refunds</strong></div>
  <div data-custom-class="body_text">
    We issue refunds for Contracts within <strong>0 days</strong> of the original purchase of the Contract.
  </div>
  <br/>

  <div data-custom-class="heading_1"><strong>9. Content</strong></div>
  <div data-custom-class="body_text">
    Content found on or through this Service are the property of FIND Services or used with permission. You may not distribute, modify, transmit, reuse, download, repost, copy, or use said Content, whether in whole or in part, for commercial purposes or for personal gain, without express advance written permission from us.
  </div>
  <br/>

  <div data-custom-class="heading_1"><strong>10. Prohibited Uses</strong></div>
  <div data-custom-class="body_text">
    You may use Service only for lawful purposes and in accordance with Terms. You agree not to use Service: (i) in any way that violates any applicable national or international law or regulation. (ii) for the purpose of exploiting, harming, or attempting to exploit or harm minors in any way by exposing them to inappropriate content or otherwise. (iii) to transmit, or procure the sending of, any advertising or promotional material, including any “junk mail”, “chain letter,” “spam,” or any other similar solicitation. (iv) to impersonate or attempt to impersonate Company, a Company employee, another user, or any other person or entity. (v) in any way that infringes upon the rights of others, or in any way is illegal, threatening, fraudulent, or harmful, or in connection with any unlawful, illegal, fraudulent, or harmful purpose or activity. (vi) to engage in any other conduct that restricts or inhibits anyone’s use or enjoyment of Service, or which, as determined by us, may harm or offend Company or users of Service or expose them to liability.<br/><br/>
    Additionally, you agree not to: (i) use Service in any manner that could disable, overburden, damage, or impair Service or interfere with any other party’s use of Service, including their ability to engage in real time activities through Service. (ii) use any robot, spider, or other automatic device, process, or means to access Service for any purpose, including monitoring or copying any of the material on Service. (iii) use any manual process to monitor or copy any of the material on Service or for any other unauthorized purpose without our prior written consent. (iv) use any device, software, or routine that interferes with the proper working of Service. (v) introduce any viruses, trojan horses, worms, logic bombs, or other material which is malicious or technologically harmful. (vi) attempt to gain unauthorized access to, interfere with, damage, or disrupt any parts of Service, the server on which Service is stored, or any server, computer, or database connected to Service. (vii) attack Service via a denial-of-service attack or a distributed denial-of-service attack. (viii) take any action that may damage or falsify Company rating. (ix) otherwise attempt to interfere with the proper working of Service.
  </div>
  <br/>

  <div data-custom-class="heading_1"><strong>11. Analytics</strong></div>
  <div data-custom-class="body_text">
    We may use third-party Service Providers to monitor and analyze the use of our Service.
  </div>
  <br/>

  <div data-custom-class="heading_1"><strong>12. No Use By Minors</strong></div>
  <div data-custom-class="body_text">
    Service is intended only for access and use by individuals at least eighteen (18) years old. By accessing or using Service, you warrant and represent that you are at least eighteen (18) years of age and with the full authority, right, and capacity to enter into this agreement and abide by all of the terms and conditions of Terms. If you are not at least eighteen (18) years old, you are prohibited from both the access and usage of Service.
  </div>
  <br/>

  <div data-custom-class="heading_1"><strong>13. Accounts</strong></div>
  <div data-custom-class="body_text">
    When you create an account with us, you guarantee that you are above the age of 18, and that the information you provide us is accurate, complete, and current at all times. Inaccurate, incomplete, or obsolete information may result in the immediate termination of your account on Service. You are responsible for maintaining the confidentiality of your account and password, including but not limited to the restriction of access to your computer and/or account. You agree to accept responsibility for any and all activities or actions that occur under your account and/or password, whether your password is with our Service or a third-party service. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account. You may not use as a username the name of another person or entity or that is not lawfully available for use, a name or trademark that is subject to any rights of another person or entity other than you, without appropriate authorization. You may not use as a username any name that is offensive, vulgar or obscene. We reserve the right to refuse service, terminate accounts, remove or edit content, or cancel orders in our sole discretion.
  </div>
  <br/>

  <div data-custom-class="heading_1"><strong>14. Intellectual Property</strong></div>
  <div data-custom-class="body_text">
    Service and its original content (excluding Content provided by users), features and functionality are and will remain the exclusive property of FIND Services and its licensors. Service is protected by copyright, trademark, and other laws of and foreign countries. Our trademarks may not be used in connection with any product or service without the prior written consent of FIND Services.
  </div>
  <br/>

  <div data-custom-class="heading_1"><strong>15. Copyright Policy</strong></div>
  <div data-custom-class="body_text">
    We respect the intellectual property rights of others. It is our policy to respond to any claim that Content posted on Service infringes on the copyright or other intellectual property rights (“Infringement”) of any person or entity. If you are a copyright owner, or authorized on behalf of one, and you believe that the copyrighted work has been copied in a way that constitutes copyright infringement, please submit your claim via email to <a data-custom-class="link" href="mailto:info@wefindservices.org">info@wefindservices.org</a>, with the subject line: “Copyright Infringement” and include in your claim a detailed description of the alleged Infringement as detailed below, under “DMCA Notice and Procedure for Copyright Infringement Claims”. You may be held accountable for damages (including costs and attorneys’ fees) for misrepresentation or bad-faith claims on the infringement of any Content found on and/or through Service on your copyright.
  </div>
  <br/>

  <div data-custom-class="heading_1"><strong>16. DMCA Notice and Procedure for Copyright Infringement Claims</strong></div>
  <div data-custom-class="body_text">
    You may submit a notification pursuant to the Digital Millennium Copyright Act (DMCA) by providing our Copyright Agent with the following information in writing (see 17 U.S.C 512(c)(3) for further detail): (i) an electronic or physical signature of the person authorized to act on behalf of the owner of the copyright’s interest; (ii) a description of the copyrighted work that you claim has been infringed, including the URL (i.e., web page address) of the location where the copyrighted work exists or a copy of the copyrighted work; (iii) identification of the URL or other specific location on Service where the material that you claim is infringing is located; (iv) your address, telephone number, and email address; (v) a statement by you that you have a good faith belief that the disputed use is not authorized by the copyright owner, its agent, or the law; (vi) a statement by you, made under penalty of perjury, that the above information in your notice is accurate and that you are the copyright owner or authorized to act on the copyright owner’s behalf. You can contact our Copyright Agent via email at <a data-custom-class="link" href="mailto:info@wefindservices.org">info@wefindservices.org</a>.
  </div>
  <br/>

  <div data-custom-class="heading_1"><strong>17. Error Reporting and Feedback</strong></div>
  <div data-custom-class="body_text">
    You may provide us either directly at <a data-custom-class="link" href="mailto:info@wefindservices.org">info@wefindservices.org</a> or via third party sites and tools with information and feedback concerning errors, suggestions for improvements, ideas, problems, complaints, and other matters related to our Service (“Feedback”). You acknowledge and agree that: (i) you shall not retain, acquire or assert any intellectual property right or other right, title or interest in or to the Feedback; (ii) Company may have development ideas similar to the Feedback; (iii) Feedback does not contain confidential information or proprietary information from you or any third party; and (iv) Company is not under any obligation of confidentiality with respect to the Feedback. In the event the transfer of the ownership to the Feedback is not possible due to applicable mandatory laws, you grant Company and its affiliates an exclusive, transferable, irrevocable, free-of-charge, sub-licensable, unlimited and perpetual right to use (including copy, modify, create derivative works, publish, distribute and commercialize) Feedback in any manner and for any purpose.
  </div>
  <br/>

  <div data-custom-class="heading_1"><strong>18. Links To Other Web Sites</strong></div>
  <div data-custom-class="body_text">
    Our Service may contain links to third party web sites or services that are not owned or controlled by FIND Services. FIND Services has no control over, and assumes no responsibility for the content, privacy policies, or practices of any third party web sites or services. We do not warrant the offerings of any of these entities/individuals or their websites. You acknowledge and agree that Company shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with use of or reliance on any such content, goods or services available on or through any such third party web sites or services. We strongly advise you to read the terms of service and privacy policies of any third party web sites or services that you visit.
  </div>
  <br/>

  <div data-custom-class="heading_1"><strong>19. Disclaimer of Warranty</strong></div>
  <div data-custom-class="body_text">
    These services are provided by Company on an “as is” and “as available” basis. Company makes no representations or warranties of any kind, express or implied, as to the operation of their services, or the information, content or materials included therein. You expressly agree that your use of these services, their content, and any services or items obtained from us is at your sole risk. Neither Company nor any person associated with Company makes any warranty or representation with respect to the completeness, security, reliability, quality, accuracy, or availability of the services. Without limiting the foregoing, neither Company nor anyone associated with Company represents or warrants that the services, their content, or any services or items obtained through the services will be accurate, reliable, error-free, or uninterrupted, that defects will be corrected, that the services or the server that makes it available are free of viruses or other harmful components or that the services or any services or items obtained through the services will otherwise meet your needs or expectations. Company hereby disclaims all warranties of any kind, whether express or implied, statutory, or otherwise, including but not limited to any warranties of merchantability, non-infringement, and fitness for particular purpose. The foregoing does not affect any warranties which cannot be excluded or limited under applicable law.
  </div>
  <br/>

  <div data-custom-class="heading_1"><strong>20. Limitation of Liability</strong></div>
  <div data-custom-class="body_text">
    Except as prohibited by law, you will hold us and our officers, directors, employees, and agents harmless for any indirect, punitive, special, incidental, or consequential damage, however it arises (including attorneys’ fees and all related costs and expenses of litigation and arbitration, or at trial or on appeal, if any, whether or not litigation or arbitration is instituted), whether in an action of contract, negligence, or other tortious action, or arising out of or in connection with this agreement, including without limitation any claim for personal injury or property damage, arising from this agreement and any violation by you of any federal, state, or local laws, statutes, rules, or regulations, even if Company has been previously advised of the possibility of such damage. Except as prohibited by law, if there is liability found on the part of Company, it will be limited to the amount paid for the products and/or services, and under no circumstances will there be consequential or punitive damages. Some states do not allow the exclusion or limitation of punitive, incidental or consequential damages, so the prior limitation or exclusion may not apply to you.
  </div>
  <br/>

  <div data-custom-class="heading_1"><strong>21. Termination</strong></div>
  <div data-custom-class="body_text">
    We may terminate or suspend your account and bar access to Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of Terms. If you wish to terminate your account, you may simply discontinue using Service. All provisions of Terms which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity and limitations of liability.
  </div>
  <br/>

  <div data-custom-class="heading_1"><strong>22. Governing Law</strong></div>
  <div data-custom-class="body_text">
    These Terms shall be governed and construed in accordance with the laws of Nigeria, which governing law applies to agreement without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect. These Terms constitute the entire agreement between us regarding our Service and supersede and replace any prior agreements we might have had between us regarding Service.
  </div>
  <br/>

  <div data-custom-class="heading_1"><strong>23. Changes To Service</strong></div>
  <div data-custom-class="body_text">
    We reserve the right to withdraw or amend our Service, and any service or material we provide via Service, in our sole discretion without notice. We will not be liable if for any reason all or any part of Service is unavailable at any time or for any period. From time to time, we may restrict access to some parts of Service, or the entire Service, to users, including registered users.
  </div>
  <br/>

  <div data-custom-class="heading_1"><strong>24. Amendments To Terms</strong></div>
  <div data-custom-class="body_text">
    We may amend Terms at any time by posting the amended terms on this site. It is your responsibility to review these Terms periodically. Your continued use of the Platform following the posting of revised Terms means that you accept and agree to the changes. You are expected to check this page frequently so you are aware of any changes, as they are binding on you. By continuing to access or use our Service after any revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, you are no longer authorized to use Service.
  </div>
  <br/>

  <div data-custom-class="heading_1"><strong>25. Waiver And Severability</strong></div>
  <div data-custom-class="body_text">
    No waiver by Company of any term or condition set forth in Terms shall be deemed a further or continuing waiver of such term or condition or a waiver of any other term or condition, and any failure of Company to assert a right or provision under Terms shall not constitute a waiver of such right or provision. If any provision of Terms is held by a court or other tribunal of competent jurisdiction to be invalid, illegal or unenforceable for any reason, such provision shall be eliminated or limited to the minimum extent such that the remaining provisions of Terms will continue in full force and effect.
  </div>
  <br/>

  <div data-custom-class="heading_1"><strong>26. Acknowledgement</strong></div>
  <div data-custom-class="body_text">
    By using Service or other services provided by us, you acknowledge that you have read these Terms of Service and agree to be bound by them.
  </div>
  <br/>

  <div data-custom-class="heading_1"><strong>27. Contact Us</strong></div>
  <div data-custom-class="body_text">
    Please send your feedback, comments, requests for technical support by email: <a data-custom-class="link" href="mailto:info@wefindservices.org">info@wefindservices.org</a>.
  </div>
</div>
`;

const TermsOfService = () => {
  return (
    <>
      <Header />
      <main className="flex-1 bg-black text-white min-h-screen w-full px-4 pt-28 pb-12">
        <div dangerouslySetInnerHTML={{ __html: termsHTML }} />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
};

export default TermsOfService;