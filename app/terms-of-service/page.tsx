import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - Cyber Safe Girl",
  description: "Read the terms and conditions of our platform.",
};

export default function TermsPage() {
  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed relative"
      style={{
        backgroundImage: "url('/loginbg.png')"
      }}
    >
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-black/50"></div>
      
      <main className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 dark:text-white">Terms of Service</h1>
          <p className="mb-6 text-gray-800 dark:text-gray-200">Effective Date: 1 June 2025</p>

          <section className="space-y-6 leading-relaxed text-justify text-gray-800 dark:text-gray-200">
            <div>
              <h2 className="text-xl font-semibold mb-2">1. Acceptance of Terms</h2>
              <p>
                By accessing and using the Cyber Safe Girl Website, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these terms, you should not use this Site.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">2. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. You should check this page regularly to take notice of any changes we may have made to the Terms of Service.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">3. Access and Use of the Website</h2>
              <p>
                We grant you a limited, non-exclusive, non-transferable, and revocable license to use the Website for your personal, non-commercial use, subject to these Terms of Service.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">4. User Conduct</h2>
              <p>As a condition of your use of the Website, you agree not to:</p>
              <ul className="list-disc ml-6 mt-2 text-justify">
                <li>Use the Website for any purpose that is unlawful or prohibited by these Terms of Service.</li>
                <li>Attempt to gain unauthorized access to any portion or feature of the Website, or any other systems or networks connected to the Website.</li>
                <li>Interfere with or disrupt the Website or the servers or networks providing the Website.</li>
                <li>Use any device, software, or routine to interfere with the proper working of the Website.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">5. Intellectual Property</h2>
              <p>
                All content, features, and functionality on the Website, including but not limited to text, graphics, logos, images, and software, are the exclusive property of Cyber Safe Girl or its licensors and are protected by intellectual property laws. You agree not to reproduce, distribute, or create derivative works of any content from the Website without our prior written permission.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">6. Disclaimers and Limitation of Liability</h2>
              <p>
                The Website is provided on an "as-is" and "as-available" basis. We make no representations or warranties of any kind, express or implied, regarding the operation of the Website or the information, content, or materials included on the Website.
              </p>
              <p className="mt-2">
                To the fullest extent permitted by applicable law, Cyber Safe Girl disclaims all warranties, express or implied, including but not limited to implied warranties of merchantability and fitness for a particular purpose. We do not warrant that the Website will be uninterrupted, error-free, or free of viruses or other harmful components.
              </p>
              <p className="mt-2">
                In no event shall Cyber Safe Girl be liable for any damages of any kind arising from the use of the Website or from any information, content, or materials included on the Website, including but not limited to direct, indirect, incidental, punitive, and consequential damages.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">7. Governing Law</h2>
              <p>
                These Terms of Service and any separate agreements whereby we provide you services shall be governed by and construed in accordance with the laws of Karnataka, India, without regard to its conflict of law provisions.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">8. Contact Us</h2>
              <p>If you have any questions about these Terms of Service, please contact us at:</p>
              <p className="mt-2"><strong>Cyber Safe Girl</strong></p>
              <p>Email: support@cybersafegirl.com</p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}