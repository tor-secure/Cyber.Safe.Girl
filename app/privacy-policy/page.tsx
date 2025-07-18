import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Cyber Safe Girl",
  description: "Read about how we handle your data and privacy.",
};

export default function PrivacyPolicyPage() {
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
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 dark:text-white">
            Privacy Policy for Cyber Safe Girl
          </h1>

          <section className="space-y-6 leading-relaxed text-justify text-gray-800 dark:text-gray-200">
            <div>
              <p>
                At Cyber Safe Girl, accessible from www.cybersafegirl.com, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Cyber Safe Girl and how we use it.
              </p>
              <p className="mt-4">
                If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us.
              </p>
              <p className="mt-4">
                This Privacy Policy applies only to our online activities and is valid for visitors to our website with regards to the information that they shared and/or collect in Cyber Safe Girl. This policy is not applicable to any information collected offline or via channels other than this website.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">Consent</h2>
              <p>
                By using our website, you hereby consent to our Privacy Policy and agree to its terms.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">Information we collect</h2>
              <p>
                The personal information that you are asked to provide, and the reasons why you are asked to provide it, will be made clear to you at the point we ask you to provide your personal information.
              </p>
              <p className="mt-4">
                If you contact us directly, we may receive additional information about you such as your name, email address, phone number, the contents of the message and/or attachments you may send us, and any other information you may choose to provide.
              </p>
              <p className="mt-4">
                When you register for an Account, we may ask for your contact information, including items such as name, company name, address, email address, and telephone number.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">How we use your information</h2>
              <p>
                We use the information we collect in various ways, including to:
              </p>
              <ul className="list-disc ml-6 mt-2 text-justify">
                <li>Provide, operate, and maintain our website</li>
                <li>Improve, personalize, and expand our website</li>
                <li>Understand and analyze how you use our website</li>
                <li>Develop new products, services, features, and functionality</li>
                <li>Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the website, and for marketing and promotional purposes</li>
                <li>Send you emails</li>
                <li>Find and prevent fraud</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">Log Files</h2>
              <p>
                Cyber Safe Girl follows a standard procedure of using log files. These files log visitors when they visit websites. All hosting companies do this and a part of hosting services' analytics. The information collected by log files include internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable. The purpose of the information is for analyzing trends, administering the site, tracking users' movement on the website, and gathering demographic information.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">Cookies and Web Beacons</h2>
              <p>
                Like any other website, Cyber Safe Girl uses 'cookies'. These cookies are used to store information including visitors' preferences, and the pages on the website that the visitor accessed or visited. The information is used to optimize the users' experience by customizing our web page content based on visitors' browser type and/or other information.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">Google DoubleClick DART Cookie</h2>
              <p>
                Google is one of a third-party vendor on our site. It also uses cookies, known as DART cookies, to serve ads to our site visitors based upon their visit to www.website.com and other sites on the internet. However, visitors may choose to decline the use of DART cookies by visiting the Google ad and content network Privacy Policy at the following URL – <a href="https://policies.google.com/technologies/ads" className="text-blue-400 hover:underline">https://policies.google.com/technologies/ads</a>
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">Advertising Partners Privacy Policies</h2>
              <p>
                You may consult this list to find the Privacy Policy for each of the advertising partners of Cyber Safe Girl.
              </p>
              <p className="mt-4">
                Third-party ad servers or ad networks uses technologies like cookies, JavaScript, or Web Beacons that are used in their respective advertisements and links that appear on Cyber Safe Girl, which are sent directly to users' browser. They automatically receive your IP address when this occurs. These technologies are used to measure the effectiveness of their advertising campaigns and/or to personalize the advertising content that you see on websites that you visit.
              </p>
              <p className="mt-4">
                Note that Cyber Safe Girl has no access to or control over these cookies that are used by third-party advertisers.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">Third Party Privacy Policies</h2>
              <p>
                Cyber Safe Girl's Privacy Policy does not apply to other advertisers or websites. Thus, we are advising you to consult the respective Privacy Policies of these third-party ad servers for more detailed information. It may include their practices and instructions about how to opt-out of certain options.
              </p>
              <p className="mt-4">
                You can choose to disable cookies through your individual browser options. To know more detailed information about cookie management with specific web browsers, it can be found at the browsers' respective websites.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">CCPA Privacy Rights (Do Not Sell My Personal Information)</h2>
              <p>
                Under the CCPA, among other rights, California consumers have the right to:
              </p>
              <p className="mt-4">
                Request that a business that collects a consumer's personal data disclose the categories and specific pieces of personal data that a business has collected about consumers.
              </p>
              <p className="mt-4">
                Request that a business delete any personal data about the consumer that a business has collected.
              </p>
              <p className="mt-4">
                Request that a business that sells a consumer's personal data, not sell the consumer's personal data.
              </p>
              <p className="mt-4">
                If you make a request, we have one month to respond to you. If you would like to exercise any of these rights, please contact us.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">GDPR Data Protection Rights</h2>
              <p>
                We would like to make sure you are fully aware of all of your data protection rights. Every user is entitled to the following:
              </p>
              <p className="mt-4">
                The right to access – You have the right to request copies of your personal data. We may charge you a small fee for this service.
              </p>
              <p className="mt-4">
                The right to rectification – You have the right to request that we correct any information you believe is inaccurate. You also have the right to request that we complete the information you believe is incomplete.
              </p>
              <p className="mt-4">
                The right to erasure – You have the right to request that we erase your personal data, under certain conditions.
              </p>
              <p className="mt-4">
                The right to restrict processing – You have the right to request that we restrict the processing of your personal data, under certain conditions.
              </p>
              <p className="mt-4">
                The right to object to processing – You have the right to object to our processing of your personal data, under certain conditions.
              </p>
              <p className="mt-4">
                The right to data portability – You have the right to request that we transfer the data that we have collected to another organization, or directly to you, under certain conditions.
              </p>
              <p className="mt-4">
                If you make a request, we have one month to respond to you. If you would like to exercise any of these rights, please contact us.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">Children's Information</h2>
              <p>
                Another part of our priority is adding protection for children while using the internet. We encourage parents and guardians to observe, participate in, and/or monitor and guide their online activity.
              </p>
              <p className="mt-4">
                Cyber Safe Girl does not knowingly collect any Personal Identifiable Information from children under the age of 13. If you think that your child provided this kind of information on our website, we strongly encourage you to contact us immediately and we will do our best efforts to promptly remove such information from our records.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}