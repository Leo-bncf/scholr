import React from 'react';
import PublicShell from '@/components/public/PublicShell';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TermsOfService() {
  return (
    <PublicShell>
      <section className="legal-prose py-14 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to={createPageUrl('Landing')} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          {/* Header */}
          <div className="mb-10 pb-8 border-b border-slate-200">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">Terms of Service</h1>
            <p className="text-sm text-slate-500">Mobile &amp; Web Application — Version 1.0 — 17 March 2026</p>
            <p className="text-sm text-slate-500 mt-1">Governed by French Law — Applicable to All Users of the Scholr Platform</p>
            <p className="mt-4 text-sm text-slate-600 italic">Please read these Terms carefully before using the Scholr application.</p>
          </div>

          <div className="space-y-10 text-slate-600 text-sm leading-relaxed">

            {/* Section 1 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">1. Company Information</h2>
              <p className="mb-3">The Scholr application is published and operated by:</p>
              <div className="bg-slate-50 rounded-lg p-5 space-y-2">
                <p><span className="font-medium text-slate-800">Company name:</span> Scholr SAS</p>
                <p><span className="font-medium text-slate-800">Legal form:</span> Société par Actions Simplifiée (French simplified joint-stock company)</p>
                <p><span className="font-medium text-slate-800">Registered office:</span> To be completed — France</p>
                <p><span className="font-medium text-slate-800">SIREN:</span> To be completed</p>
                <p><span className="font-medium text-slate-800">VAT number:</span> To be completed</p>
                <p><span className="font-medium text-slate-800">Contact email:</span> <a href="mailto:support@scholr.pro" className="text-blue-600 hover:underline">support@scholr.pro</a></p>
                <p><span className="font-medium text-slate-800">Support email:</span> <a href="mailto:support@scholr.pro" className="text-blue-600 hover:underline">support@scholr.pro</a></p>
                <p><span className="font-medium text-slate-800">Website:</span> <a href="https://scholr.pro" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">scholr.pro</a></p>
              </div>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">2. Purpose and Acceptance of Terms</h2>
              <p className="mb-3">These Terms of Service (hereinafter "Terms") govern access to and use of the Scholr application and platform (hereinafter "the Service") by any person or entity (hereinafter "User") who accesses or uses the Service.</p>
              <p className="mb-3">By creating an account, accessing, or using the Service, the User unconditionally accepts these Terms in their entirety. If you do not agree with any of these Terms, you must immediately cease using the Service.</p>
              <p className="mb-3">These Terms apply to all categories of Users, including:</p>
              <ul className="list-disc list-inside space-y-1.5 ml-2 mb-3">
                <li>School administrators and management staff</li>
                <li>Teachers and educational staff</li>
                <li>Students (including minors under parental supervision)</li>
                <li>Parents and legal guardians</li>
              </ul>
              <p>For institutional clients (schools and educational establishments), a separate Master Services Agreement (MSA) may be entered into between the institution and Scholr SAS. In the event of conflict between these Terms and the MSA, the MSA shall take precedence for the matters it governs.</p>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">3. Description of the Service</h2>
              <p className="mb-3">Scholr is a cloud-based educational management platform designed to support schools, teachers, students, and families. The Service includes, but is not limited to:</p>
              <ul className="list-disc list-inside space-y-1.5 ml-2 mb-4">
                <li>Student information system (SIS): management of student profiles, enrolment, and academic records</li>
                <li>Gradebook and assessment management</li>
                <li>Attendance and behaviour tracking</li>
                <li>Curriculum planning and lesson management</li>
                <li>International Baccalaureate (IB) programme management and other curriculum frameworks</li>
                <li>Parent and student portals</li>
                <li>Secure internal messaging and announcements</li>
                <li>Report card generation</li>
                <li>Analytics, dashboards, and reporting tools</li>
                <li>Document management and file sharing within the school community</li>
              </ul>
              <p>Scholr reserves the right to modify, suspend, or discontinue any feature or aspect of the Service at any time, with reasonable prior notice where possible. Scholr shall not be liable to any User for any modification, suspension, or discontinuation of the Service.</p>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">4. Account Creation and Access</h2>

              <h3 className="font-semibold text-slate-800 mb-2">4.1 Institutional accounts</h3>
              <p className="mb-4">Access to the Service is granted to educational institutions through a subscription agreement with Scholr SAS. School administrators are responsible for creating and managing individual accounts for staff, teachers, students, and parents within their institution.</p>

              <h3 className="font-semibold text-slate-800 mb-2">4.2 Individual accounts</h3>
              <p className="mb-2">Each User must have an individual account. Users are responsible for:</p>
              <ul className="list-disc list-inside space-y-1.5 ml-2 mb-3">
                <li>Providing accurate, complete, and up-to-date information when creating their account</li>
                <li>Maintaining the confidentiality of their login credentials (username and password)</li>
                <li>All activities that occur under their account</li>
                <li>Notifying Scholr or the school administrator immediately in the event of unauthorised access or suspected security breach</li>
              </ul>
              <p className="mb-4">Users must not share their login credentials with any other person. Scholr shall not be liable for any loss or damage arising from a User's failure to comply with these obligations.</p>

              <h3 className="font-semibold text-slate-800 mb-2">4.3 Accounts for minors</h3>
              <p className="mb-4">Student accounts for minors are created and administered exclusively by the school. The school, as data controller, ensures that appropriate parental consent is obtained in accordance with applicable law. Parents may access their child's information through the dedicated parent portal.</p>

              <h3 className="font-semibold text-slate-800 mb-2">4.4 Account suspension and termination</h3>
              <p>Scholr or the school administrator reserves the right to suspend or terminate a User's account at any time if the User violates these Terms, engages in conduct harmful to the platform or its community, or at the request of the school institution.</p>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">5. Acceptable Use Policy</h2>

              <h3 className="font-semibold text-slate-800 mb-2">5.1 Permitted use</h3>
              <p className="mb-4">The Service is provided exclusively for legitimate educational and administrative purposes within the context of the User's role (administrator, teacher, student, or parent). Users agree to use the Service in compliance with all applicable laws and regulations.</p>

              <h3 className="font-semibold text-slate-800 mb-2">5.2 Prohibited conduct</h3>
              <p className="mb-2">Users must not, under any circumstances:</p>
              <ul className="list-disc list-inside space-y-1.5 ml-2 mb-3">
                <li>Use the Service for any unlawful, fraudulent, or harmful purpose</li>
                <li>Impersonate any other person or entity, or misrepresent their affiliation</li>
                <li>Share, upload, or transmit content that is offensive, defamatory, discriminatory, harassing, or violates the rights of others</li>
                <li>Attempt to gain unauthorised access to any part of the Service, other user accounts, or Scholr's systems</li>
                <li>Introduce malware, viruses, or any other harmful code into the Service</li>
                <li>Scrape, harvest, or collect data from the Service using automated means</li>
                <li>Reverse engineer, decompile, or attempt to extract the source code of the application</li>
                <li>Use the Service to send unsolicited communications (spam)</li>
                <li>Interfere with or disrupt the integrity or performance of the Service</li>
                <li>Use the Service in any manner that could damage the reputation of Scholr or the school institution</li>
              </ul>
              <p>Any breach of this Acceptable Use Policy may result in immediate suspension or termination of the User's account, without prejudice to any legal action Scholr or the school may take.</p>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">6. Intellectual Property</h2>

              <h3 className="font-semibold text-slate-800 mb-2">6.1 Scholr's intellectual property</h3>
              <p className="mb-4">The Scholr application, including its source code, design, user interface, graphics, logos, trademarks, and all related content developed by Scholr SAS, are the exclusive property of Scholr SAS and are protected by French and international intellectual property law. No licence, right, or title in or to Scholr's intellectual property is granted to Users beyond the limited right to use the Service as described in these Terms.</p>

              <h3 className="font-semibold text-slate-800 mb-2">6.2 User-generated content</h3>
              <p className="mb-4">Users retain ownership of content they create and upload to the Service (lesson plans, assessments, documents, etc.). By uploading content to the Service, Users grant Scholr a limited, non-exclusive, royalty-free licence to host, store, and display such content solely for the purpose of providing the Service. Users represent and warrant that any content they upload does not infringe the intellectual property rights or any other rights of any third party.</p>

              <h3 className="font-semibold text-slate-800 mb-2">6.3 Feedback</h3>
              <p>If a User provides Scholr with suggestions, feedback, or ideas regarding the Service, Scholr may freely use such feedback without any obligation or compensation to the User.</p>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">7. Subscription and Payment</h2>

              <h3 className="font-semibold text-slate-800 mb-2">7.1 Subscription plans</h3>
              <p className="mb-4">Access to the Service is provided on a subscription basis to educational institutions. Subscription plans, pricing, and payment terms are set out in the relevant order form or MSA entered into between the school and Scholr SAS. Individual Users (teachers, students, parents) do not pay directly for access; access is granted through the school's subscription.</p>

              <h3 className="font-semibold text-slate-800 mb-2">7.2 Billing</h3>
              <p className="mb-4">Schools are invoiced in accordance with the terms agreed in their subscription agreement. All fees are exclusive of applicable taxes (including French VAT) unless otherwise stated. Invoices are due and payable within the period specified on the invoice.</p>

              <h3 className="font-semibold text-slate-800 mb-2">7.3 Late payment</h3>
              <p className="mb-4">In the event of late payment, Scholr reserves the right to charge late payment interest at the rate of three times the French legal interest rate, as well as a fixed recovery indemnity of €40 per invoice, in accordance with Article L. 441-10 of the French Commercial Code.</p>

              <h3 className="font-semibold text-slate-800 mb-2">7.4 Refunds</h3>
              <p>Fees paid in advance are non-refundable except as expressly provided in the MSA or as required by applicable law.</p>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">8. Data Protection and Privacy</h2>
              <p className="mb-3">The collection and processing of personal data by Scholr in connection with the Service is governed by the Scholr Privacy Policy, which forms an integral part of these Terms and is available at <a href="https://scholr.pro/PrivacyPolicy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">scholr.pro/PrivacyPolicy</a>.</p>
              <p className="mb-3">Scholr processes personal data as a data processor on behalf of schools, which act as data controllers, in accordance with Article 28 of the GDPR. The data processing agreement applicable to institutional clients is incorporated into the MSA.</p>
              <p>Users acknowledge that by using the Service, certain personal data will be collected and processed as described in the Privacy Policy. Users are encouraged to read the Privacy Policy carefully.</p>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">9. Service Availability and Maintenance</h2>

              <h3 className="font-semibold text-slate-800 mb-2">9.1 Availability</h3>
              <p className="mb-4">Scholr endeavours to make the Service available 24 hours a day, 7 days a week. However, Scholr does not guarantee uninterrupted or error-free availability of the Service. Access to the Service may be temporarily suspended or restricted for maintenance, upgrades, or due to circumstances beyond Scholr's control.</p>

              <h3 className="font-semibold text-slate-800 mb-2">9.2 Planned maintenance</h3>
              <p className="mb-4">Where possible, Scholr will provide advance notice of planned maintenance windows that may affect Service availability. Scholr will use reasonable endeavours to schedule planned maintenance during periods of low usage.</p>

              <h3 className="font-semibold text-slate-800 mb-2">9.3 Service levels</h3>
              <p>Specific service level commitments (uptime guarantees, support response times, etc.) may be set out in the MSA between Scholr and the school institution.</p>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">10. Limitation of Liability</h2>
              <p className="mb-3">To the fullest extent permitted by applicable French law:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Scholr provides the Service on an 'as is' and 'as available' basis, without warranties of any kind, express or implied, including warranties of merchantability, fitness for a particular purpose, or non-infringement.</li>
                <li>Scholr shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to the use of or inability to use the Service.</li>
                <li>Scholr's total aggregate liability to any User or institution in connection with the Service shall not exceed the total fees paid by the relevant institution to Scholr in the twelve (12) months preceding the event giving rise to the claim.</li>
                <li>Scholr shall not be liable for any loss of data, business interruption, or loss of revenue arising from the use of or inability to use the Service.</li>
              </ul>
              <p className="mt-3">Nothing in these Terms limits Scholr's liability for death or personal injury caused by its negligence, fraud or fraudulent misrepresentation, or any other liability that cannot be excluded or limited under French law.</p>
            </section>

            {/* Section 11 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">11. Indemnification</h2>
              <p className="mb-3">Users agree to indemnify, defend, and hold harmless Scholr SAS, its directors, employees, and agents from and against any claims, damages, losses, liabilities, costs, and expenses (including reasonable legal fees) arising out of or related to:</p>
              <ul className="list-disc list-inside space-y-1.5 ml-2">
                <li>The User's use of the Service in violation of these Terms</li>
                <li>Content uploaded or transmitted by the User through the Service</li>
                <li>The User's violation of any applicable law or regulation</li>
                <li>The User's infringement of the rights of any third party</li>
              </ul>
            </section>

            {/* Section 12 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">12. Third-Party Services and Integrations</h2>
              <p className="mb-3">The Service may integrate with or link to third-party applications, tools, or services (for example, video conferencing tools, learning management systems, or payment processors). These third-party services are subject to their own terms and privacy policies, and Scholr is not responsible for their content, availability, or practices.</p>
              <p>Users access third-party services at their own risk. Scholr does not endorse and makes no representations or warranties regarding any third-party service.</p>
            </section>

            {/* Section 13 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">13. Term and Termination</h2>

              <h3 className="font-semibold text-slate-800 mb-2">13.1 Term</h3>
              <p className="mb-4">These Terms remain in effect for as long as the User has an active account on the Service or as long as the school's subscription with Scholr SAS remains in force.</p>

              <h3 className="font-semibold text-slate-800 mb-2">13.2 Termination by the school</h3>
              <p className="mb-4">Schools may terminate their subscription in accordance with the terms of their MSA. Upon termination, all associated user accounts (staff, teachers, students, parents) will be deactivated.</p>

              <h3 className="font-semibold text-slate-800 mb-2">13.3 Termination by Scholr</h3>
              <p className="mb-4">Scholr reserves the right to terminate or suspend access to the Service immediately, with or without notice, in the event of a material breach of these Terms, non-payment of subscription fees, or if Scholr is required to do so by law.</p>

              <h3 className="font-semibold text-slate-800 mb-2">13.4 Effect of termination</h3>
              <p>Upon termination, the User's right to access the Service ceases immediately. Scholr will retain and delete data in accordance with the data retention periods set out in the Privacy Policy and the applicable MSA. Schools may request an export of their data prior to termination.</p>
            </section>

            {/* Section 14 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">14. Governing Law and Dispute Resolution</h2>

              <h3 className="font-semibold text-slate-800 mb-2">14.1 Governing law</h3>
              <p className="mb-4">These Terms are governed by and construed in accordance with French law, to the exclusion of any conflict of law principles.</p>

              <h3 className="font-semibold text-slate-800 mb-2">14.2 Amicable resolution</h3>
              <p className="mb-4">In the event of a dispute arising out of or in connection with these Terms, the parties agree to first attempt to resolve the dispute amicably by contacting Scholr at <a href="mailto:support@scholr.pro" className="text-blue-600 hover:underline">support@scholr.pro</a>. The parties shall endeavour to reach an amicable resolution within thirty (30) days of the dispute being raised.</p>

              <h3 className="font-semibold text-slate-800 mb-2">14.3 Mediation</h3>
              <p className="mb-4">If an amicable resolution cannot be reached, and for Users who qualify as consumers under French law, the User may have recourse to an approved consumer mediator in accordance with Articles L. 611-1 et seq. of the French Consumer Code. Details of the applicable mediator are available on request from <a href="mailto:support@scholr.pro" className="text-blue-600 hover:underline">support@scholr.pro</a>.</p>

              <h3 className="font-semibold text-slate-800 mb-2">14.4 Jurisdiction</h3>
              <p>In the absence of an amicable resolution or successful mediation, any dispute relating to these Terms shall be subject to the exclusive jurisdiction of the competent courts of France. For disputes involving professional clients (schools), the courts of the jurisdiction of Scholr's registered office shall have exclusive jurisdiction.</p>
            </section>

            {/* Section 15 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">15. Changes to These Terms</h2>
              <p className="mb-3">Scholr reserves the right to update or modify these Terms at any time. In the event of a material change, Users will be notified by email or by an in-app notification at least thirty (30) days before the new version takes effect.</p>
              <p className="mb-3">Continued use of the Service after the effective date of the revised Terms constitutes acceptance of the new Terms. If a User does not agree with the revised Terms, they must stop using the Service and contact their school administrator.</p>
              <p>The current version of these Terms is always accessible from the Scholr application and website. The version number and date of last update are indicated at the top of this document.</p>
            </section>

            {/* Section 16 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">16. General Provisions</h2>
              <ul className="space-y-3">
                <li><span className="font-medium text-slate-800">Severability:</span> If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.</li>
                <li><span className="font-medium text-slate-800">Waiver:</span> Scholr's failure to enforce any right or provision of these Terms shall not constitute a waiver of that right or provision.</li>
                <li><span className="font-medium text-slate-800">Entire agreement:</span> These Terms, together with the Privacy Policy and any applicable MSA, constitute the entire agreement between the parties with respect to the Service and supersede all prior agreements or understandings.</li>
                <li><span className="font-medium text-slate-800">Assignment:</span> Users may not assign or transfer their rights or obligations under these Terms without the prior written consent of Scholr. Scholr may assign these Terms without restriction.</li>
                <li><span className="font-medium text-slate-800">Force majeure:</span> Scholr shall not be liable for any failure or delay in the performance of the Service due to circumstances beyond its reasonable control, including natural disasters, strikes, government actions, power outages, or Internet failures.</li>
                <li><span className="font-medium text-slate-800">Language:</span> These Terms are drafted in English. In the event of any inconsistency between an English version and any translation, the English version shall prevail, except where French law requires the French version to take precedence.</li>
              </ul>
            </section>

            {/* Section 17 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">17. Contact Information</h2>
              <p className="mb-3">For any questions, complaints, or requests relating to these Terms of Service, please contact us:</p>
              <div className="bg-slate-50 rounded-lg p-5 space-y-2">
                <p><span className="font-medium text-slate-800">General enquiries:</span> <a href="mailto:support@scholr.pro" className="text-blue-600 hover:underline">support@scholr.pro</a></p>
                <p><span className="font-medium text-slate-800">Technical support:</span> <a href="mailto:support@scholr.pro" className="text-blue-600 hover:underline">support@scholr.pro</a></p>
                <p><span className="font-medium text-slate-800">Legal &amp; compliance:</span> <a href="mailto:support@scholr.pro" className="text-blue-600 hover:underline">support@scholr.pro</a></p>
                <p><span className="font-medium text-slate-800">By post:</span> Scholr SAS — Legal Department, [Registered office address], France</p>
                <p><span className="font-medium text-slate-800">Website:</span> <a href="https://scholr.pro/TermsOfService" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">scholr.pro/TermsOfService</a></p>
              </div>
            </section>

            {/* Footer note */}
            <div className="pt-8 border-t border-slate-200 text-slate-400 text-xs">
              <p>Scholr SAS — Terms of Service v1.0</p>
              <p className="mt-1">Document established on 17 March 2026 — Governed by French Law</p>
            </div>

          </div>
        </div>
      </section>

    </PublicShell>
  );
}