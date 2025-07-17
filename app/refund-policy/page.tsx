import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy - Cyber Safe Girl",
  description: "Our refund policy and conditions explained.",
};

export default function RefundPolicyPage() {
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
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 dark:text-white">Refund Policy</h1>
          <p className="mb-6 text-justify text-gray-800 dark:text-gray-200">Effective Date: 1 June 2025</p>
                 
          <section className="space-y-6 leading-relaxed text-justify text-gray-800 dark:text-gray-200">
            <div>
              <p>
                Thank you for choosing Cyber Safe Girl for your educational needs. Please read our refund policy carefully before making a purchase of any certificates.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">No Refunds</h2>
              <p>
                All sales of certificates are final. We do not offer refunds or exchanges for certificates purchased at the end of the course.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">Certificate Purchase Policy</h2>
              <p>
                Certificates are issued upon successful completion of the course and the purchase is non-refundable. Please ensure that you have completed the course and are satisfied with your progress before purchasing the certificate.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">Exceptions</h2>
              <p>
                In exceptional circumstances, we may consider refund requests on a case-by-case basis and at our sole discretion. If you believe you have a valid reason for a refund request, please contact our support team with the details of your concern.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">Contact Us</h2>
              <p>If you have any questions about our refund policy or need further assistance, please contact us at:</p>
              <p className="mt-2"><strong>Cyber Safe Girl</strong></p>
              <p>Email: support@cybersafegirl.com</p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}