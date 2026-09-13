import React from 'react';
import PublicShell from '@/components/public/PublicShell';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function PrivacyPolicy() {
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
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">Privacy Policy</h1>
            <p className="text-sm text-slate-500">Mobile &amp; Web Application — Version 1.0 — 17 March 2026</p>
            <p className="text-sm text-slate-500 mt-1">GDPR Compliant — French Data Protection Law (Loi Informatique et Libertés)</p>
            <p className="text-sm text-slate-500 mt-1">Supervisory Authority: Commission Nationale de l'Informatique et des Libertés (CNIL)</p>
          </div>

          <div className="space-y-10 text-slate-600 text-sm leading-relaxed">

            {/* Section 1 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">1. Identity of the Data Controller</h2>
              <p className="mb-3">This Privacy Policy is established by:</p>
              <div className="bg-slate-50 rounded-lg p-5 space-y-2">
                <p><span className="font-medium text-slate-800">Company name:</span> Scholr SAS</p>
                <p><span className="font-medium text-slate-800">Legal form:</span> Société par Actions Simplifiée (French simplified joint-stock company)</p>
                <p><span className="font-medium text-slate-800">Registered office:</span> To be completed — France</p>
                <p><span className="font-medium text-slate-800">SIREN:</span> To be completed</p>
                <p><span className="font-medium text-slate-800">Data Controller:</span> The Chief Executive Officer of Scholr SAS</p>
                <p><span className="font-medium text-slate-800">Data Protection Officer (DPO):</span> <a href="mailto:contact@scholr.pro" className="text-blue-600 hover:underline">contact@scholr.pro</a></p>
                <p><span className="font-medium text-slate-800">General privacy contact:</span> <a href="mailto:contact@scholr.pro" className="text-blue-600 hover:underline">contact@scholr.pro</a></p>
                <p><span className="font-medium text-slate-800">Website:</span> <a href="https://scholr.pro" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">scholr.pro</a></p>
              </div>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">2. About the Scholr Application</h2>
              <p className="mb-3">Scholr is an online educational management platform designed for schools, teachers, students, and their families. It provides the following core features:</p>
              <ul className="list-disc list-inside space-y-1.5 ml-2">
                <li>Academic records and report card management</li>
                <li>Attendance, lateness, and behaviour tracking</li>
                <li>Communication between the school, teachers, and parents</li>
                <li>Lesson planning, homework, and assessment tracking</li>
                <li>International Baccalaureate (IB) programme management and other curriculum frameworks</li>
                <li>Secure internal messaging</li>
                <li>Parent portal and student workspace</li>
                <li>Analytics reports and dashboards for educational staff</li>
              </ul>
              <p className="mt-3">Scholr is intended exclusively for professional and educational use. The application processes personal data of minors, which triggers enhanced obligations under the GDPR.</p>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">3. Personal Data Collected</h2>

              <h3 className="font-semibold text-slate-800 mb-2">3.1 Student data</h3>
              <ul className="list-disc list-inside space-y-1.5 ml-2 mb-5">
                <li>Full name, date of birth, nationality</li>
                <li>Contact details (address, email, phone number)</li>
                <li>Student ID and class assignment</li>
                <li>Academic results, grades, assessments, and teacher comments</li>
                <li>Absences, late arrivals, and disciplinary records</li>
                <li>Login data and platform usage information</li>
                <li>Profile photographs (if provided by the school)</li>
              </ul>

              <h3 className="font-semibold text-slate-800 mb-2">3.2 Parent and legal guardian data</h3>
              <ul className="list-disc list-inside space-y-1.5 ml-2 mb-5">
                <li>Full name and relationship to the student (parent, guardian, etc.)</li>
                <li>Contact details (email address, phone number)</li>
                <li>Communication preferences and language</li>
                <li>Message history via the Scholr messaging system</li>
              </ul>

              <h3 className="font-semibold text-slate-800 mb-2">3.3 Teacher and educational staff data</h3>
              <ul className="list-disc list-inside space-y-1.5 ml-2 mb-5">
                <li>Full name and professional email address</li>
                <li>Subjects taught, classes, and school assignments</li>
                <li>Login data (IP address, timestamps, activity logs)</li>
                <li>Educational content created or shared on the platform</li>
              </ul>

              <h3 className="font-semibold text-slate-800 mb-2">3.4 School administrator data</h3>
              <ul className="list-disc list-inside space-y-1.5 ml-2 mb-5">
                <li>Full name and job title</li>
                <li>Professional contact details</li>
                <li>School configuration and settings</li>
                <li>Audit and access logs</li>
              </ul>

              <h3 className="font-semibold text-slate-800 mb-2">3.5 Technical and navigation data</h3>
              <ul className="list-disc list-inside space-y-1.5 ml-2">
                <li>IP address, browser type, and device information</li>
                <li>Operating system and application version</li>
                <li>Pages visited, features used, and session duration</li>
                <li>Cookies and session data (see Section 9)</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">4. Legal Basis for Processing</h2>
              <p className="mb-3">In accordance with Article 6 of the GDPR, each processing activity carried out by Scholr is based on one of the following legal grounds:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li><span className="font-medium text-slate-800">Performance of a contract:</span> processing necessary to deliver Scholr's services to client schools (Article 6(1)(b) GDPR).</li>
                <li><span className="font-medium text-slate-800">Legitimate interests:</span> processing for IT security, service improvement, and anonymised statistical analysis (Article 6(1)(f) GDPR).</li>
                <li><span className="font-medium text-slate-800">Consent:</span> optional processing, including marketing communications, optional push notifications, and non-essential cookies (Article 6(1)(a) GDPR).</li>
                <li><span className="font-medium text-slate-800">Legal obligation:</span> processing required by applicable French education regulations (Article 6(1)(c) GDPR).</li>
              </ul>
              <p className="mt-3">With respect to data relating to minors, Scholr applies Article 8 of the GDPR and CNIL guidelines. Schools act as data controllers for their students' data; Scholr acts as a data processor within the meaning of Article 28 of the GDPR.</p>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">5. Purposes of Processing</h2>
              <p className="mb-3">Scholr processes your personal data for the following purposes:</p>
              <ul className="list-disc list-inside space-y-1.5 ml-2">
                <li>Providing and operating the school management platform</li>
                <li>User authentication and access management</li>
                <li>Academic, pedagogical, and disciplinary tracking of students</li>
                <li>Communication between the school, teachers, students, and families</li>
                <li>Generating reports and school report cards</li>
                <li>Technical support and user assistance</li>
                <li>Improving and developing platform features</li>
                <li>Compliance with legal and regulatory obligations</li>
                <li>IT security and fraud prevention</li>
                <li>Billing and management of the contractual relationship with schools</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">6. Recipients of Personal Data</h2>

              <h3 className="font-semibold text-slate-800 mb-2">6.1 Internal access</h3>
              <p className="mb-4">Personal data is accessible only to authorised Scholr staff members, strictly within the scope of their duties (technical teams, support, and the DPO).</p>

              <h3 className="font-semibold text-slate-800 mb-2">6.2 Technical sub-processors</h3>
              <p className="mb-4">Scholr uses third-party service providers for hosting, messaging, and other technical services. These providers are bound by data processing agreements compliant with Article 28 of the GDPR and may only use your data for the purposes determined by Scholr. All sub-processors are selected on the basis of their data protection guarantees. The list of our main sub-processors is available upon request from our DPO.</p>

              <h3 className="font-semibold text-slate-800 mb-2">6.3 Schools</h3>
              <p className="mb-4">Administrators and teachers at your school have access to student and family data in the context of their educational mission, in accordance with the access permissions configured by the school.</p>

              <h3 className="font-semibold text-slate-800 mb-2">6.4 Transfers outside the EU</h3>
              <p>Scholr is committed to hosting user data within the European Union. Should a transfer outside the EU be required by a sub-processor, Scholr ensures appropriate safeguards are in place (European Commission Standard Contractual Clauses or an adequacy decision) in accordance with Chapter V of the GDPR.</p>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">7. Data Retention Periods</h2>
              <p className="mb-3">Scholr retains personal data only for as long as is strictly necessary for the purposes for which it was collected:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li><span className="font-medium text-slate-800">Student, teacher, and parent account data:</span> for the duration of the contractual relationship between the school and Scholr, plus a 3-year period to handle any potential disputes.</li>
                <li><span className="font-medium text-slate-800">Academic records and report cards:</span> 5 years after the student leaves the school (in line with CNIL recommendations for educational institutions).</li>
                <li><span className="font-medium text-slate-800">Connection logs and technical logs:</span> 12 months, in accordance with French regulations.</li>
                <li><span className="font-medium text-slate-800">Billing data:</span> 10 years, in accordance with French accounting and tax obligations.</li>
                <li><span className="font-medium text-slate-800">Non-essential cookie data (with consent):</span> a maximum of 13 months.</li>
              </ul>
              <p className="mt-3">At the end of these periods, data is securely deleted or irreversibly anonymised.</p>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">8. Your Data Protection Rights</h2>
              <p className="mb-3">In accordance with the GDPR (Articles 15 to 22) and the French Data Protection Act (Loi Informatique et Libertés), you have the following rights:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li><span className="font-medium text-slate-800">Right of access (Art. 15 GDPR):</span> obtain confirmation that data about you is being processed and receive a copy of it.</li>
                <li><span className="font-medium text-slate-800">Right to rectification (Art. 16 GDPR):</span> have inaccurate data corrected or incomplete data completed.</li>
                <li><span className="font-medium text-slate-800">Right to erasure (Art. 17 GDPR):</span> request deletion of your data, subject to statutory retention obligations.</li>
                <li><span className="font-medium text-slate-800">Right to restriction of processing (Art. 18 GDPR):</span> request a temporary suspension of the processing of your data.</li>
                <li><span className="font-medium text-slate-800">Right to data portability (Art. 20 GDPR):</span> receive your data in a structured, machine-readable format.</li>
                <li><span className="font-medium text-slate-800">Right to object (Art. 21 GDPR):</span> object to certain processing activities based on legitimate interests.</li>
                <li><span className="font-medium text-slate-800">Right not to be subject to automated decision-making (Art. 22 GDPR).</span></li>
                <li><span className="font-medium text-slate-800">Right to withdraw consent:</span> withdraw consent at any time without affecting the lawfulness of processing carried out prior to the withdrawal.</li>
                <li><span className="font-medium text-slate-800">Right to set directives regarding the use of your data after your death</span> (French Loi Informatique et Libertés).</li>
              </ul>
              <p className="mt-4">To exercise these rights, please send your request by email to <a href="mailto:contact@scholr.pro" className="text-blue-600 hover:underline">contact@scholr.pro</a> or by post to the registered office of Scholr SAS, enclosing a copy of your identity document. Scholr will respond within one (1) month, extendable by two months for complex requests.</p>
              <p className="mt-3">If you believe your rights are not being respected, you have the right to lodge a complaint with the CNIL (Commission Nationale de l'Informatique et des Libertés): <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.cnil.fr</a> — 3, Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07, France.</p>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">9. Cookies and Trackers</h2>
              <p className="mb-4">The Scholr application uses cookies and similar technologies. In accordance with CNIL guidelines and Article 82 of the French Data Protection Act, cookies are categorised as follows:</p>

              <h3 className="font-semibold text-slate-800 mb-2">9.1 Strictly necessary cookies</h3>
              <p className="mb-4">These cookies are essential for the application to function correctly (session management, authentication, CSRF security). They do not require your consent.</p>

              <h3 className="font-semibold text-slate-800 mb-2">9.2 Analytical cookies</h3>
              <p className="mb-4">These cookies help us understand how the application is used so that we can improve it (anonymised audience measurement). They are only placed with your consent.</p>

              <h3 className="font-semibold text-slate-800 mb-2">9.3 Preference cookies</h3>
              <p className="mb-4">These cookies remember your display preferences (language, theme). They are only placed with your consent.</p>

              <p>You can manage your cookie preferences at any time via the cookie management panel in your account settings or through the cookie banner displayed on your first visit.</p>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">10. Data Security</h2>
              <p className="mb-3">Scholr implements appropriate technical and organisational measures to ensure a level of security appropriate to the risk, in accordance with Article 32 of the GDPR:</p>
              <ul className="list-disc list-inside space-y-1.5 ml-2">
                <li>Encryption of data in transit (TLS 1.3) and at rest (AES-256)</li>
                <li>Strong authentication (multi-factor authentication available for administrator accounts)</li>
                <li>Role-based access control (RBAC)</li>
                <li>Access logging and monitoring</li>
                <li>Regular penetration testing and security audits</li>
                <li>Incident response and data breach management plan</li>
                <li>Regular staff training on data security best practices</li>
                <li>Hosting with ISO 27001-certified providers within the European Union</li>
              </ul>
              <p className="mt-3">In the event of a data breach likely to result in a risk to your rights and freedoms, Scholr will notify the CNIL within 72 hours in accordance with Article 33 of the GDPR, and will inform you without undue delay if the breach is likely to result in a high risk (Article 34 GDPR).</p>
            </section>

            {/* Section 11 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">11. Protection of Minors' Data</h2>
              <p className="mb-3">Scholr pays particular attention to the protection of data relating to student minors. In this respect:</p>
              <ul className="list-disc list-inside space-y-1.5 ml-2">
                <li>Accounts for minor students are created and managed exclusively by schools, which act as data controllers.</li>
                <li>Features accessible to minor students are limited to those strictly necessary for educational purposes.</li>
                <li>No data relating to minors is used for commercial or advertising purposes.</li>
                <li>Parents and legal guardians have the right to access their minor child's data via the Scholr parent portal.</li>
                <li>Scholr does not collect data from children under the age of 15 without prior authorisation from those holding parental authority, in accordance with Article 8 of the GDPR and applicable French law.</li>
              </ul>
            </section>

            {/* Section 12 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">12. Data Protection Officer (DPO)</h2>
              <p className="mb-3">Scholr has appointed a Data Protection Officer (DPO) in accordance with Article 37 of the GDPR, given the large-scale processing of data relating to minors.</p>
              <p>The DPO can be contacted at: <a href="mailto:contact@scholr.pro" className="text-blue-600 hover:underline">contact@scholr.pro</a></p>
              <p className="mt-2">The DPO is also the primary point of contact with the CNIL for any questions relating to Scholr's data processing activities.</p>
            </section>

            {/* Section 13 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">13. Changes to This Policy</h2>
              <p>Scholr reserves the right to amend this Privacy Policy in order to adapt it to changes in regulations or in its practices. In the event of a material change, users will be notified by email or by an in-app notification at least thirty (30) days before the new version takes effect.</p>
              <p className="mt-3">The current version is always accessible from the Scholr application and website. The date of the last update appears at the top of this document.</p>
            </section>

            {/* Section 14 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">14. Contact Us</h2>
              <p className="mb-3">For any questions regarding this Privacy Policy or the exercise of your rights, please contact us:</p>
              <div className="bg-slate-50 rounded-lg p-5 space-y-2">
                <p><span className="font-medium text-slate-800">By email:</span> <a href="mailto:contact@scholr.pro" className="text-blue-600 hover:underline">contact@scholr.pro</a></p>
                <p><span className="font-medium text-slate-800">DPO:</span> <a href="mailto:contact@scholr.pro" className="text-blue-600 hover:underline">contact@scholr.pro</a></p>
                <p><span className="font-medium text-slate-800">By post:</span> Scholr SAS — Data Protection, [Registered office address], France</p>
                <p><span className="font-medium text-slate-800">Website:</span> <a href="https://scholr.pro/PrivacyPolicy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">scholr.pro/PrivacyPolicy</a></p>
              </div>
            </section>

            {/* Footer note */}
            <div className="pt-8 border-t border-slate-200 text-slate-400 text-xs">
              <p>Scholr SAS — Privacy Policy v1.0</p>
              <p className="mt-1">Document established on 17 March 2026 — GDPR &amp; French Data Protection Law Compliant</p>
            </div>

          </div>
        </div>
      </section>

    </PublicShell>
  );
}