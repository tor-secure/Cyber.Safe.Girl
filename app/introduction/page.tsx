import React from "react";

const Introduction: React.FC = () => {
  

  return (
    <div className="p-4 bg-card text-card-foreground space-y-4">
      {/* YouTube Video */}
      <div className="aspect-w-16 aspect-h-9">
        <iframe
          className="w-full h-[70vh] flex justify-center items-center rounded-lg"
          src="https://www.youtube.com/embed/4DIxH3lF_w8"
          title="Cyber Safe Girl Introduction"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>

      {/* Header Section */}
      

      {/* Introduction Content */}
     { <div className="text-sm leading-6 text-justify text-card-foreground">
        <p>
          Welcome to Cyber Safe Girl Version 5 Beta Release of the Online
          Learning Program. I am Dr. Ananth Prabhu G, the curator of this
          program. I am happy to see you here. This shows your keen interest in
          responsible browsing and supporting my mission of{" "}
          <strong>#CyberSafeIndia</strong>.
        </p>
        <br/>
        <p>
          This is a free course. It is relevant for anyone 13 years and above.
          The prerequisites for this program are understanding the English
          language and basics of computer or mobile device operation. Yes, you
          do not need to know rocket science.
        </p>        <br/>

        <p>
          The main objective of this program is to help the participants
          understand the various cyber crimes, Information Technology Act and
          various relevant acts, tips to browse the internet safely, and other
          important information.
        </p>        <br/>

        <p>
          We will be discussing about 60 common cyber crimes that are committed
          all over the world. I believe awareness is the key, and if you can
          learn from others' mistakes, you can avoid committing the same.
        </p>
        <p>
          In this course, there are 60 modules. Each module comprises 5 parts:
          an introduction of the topic, my video lecture, the infotoon from the
          Cyber Safe Girl v5.0, another video to give you more insights,
          precautionary measures to be taken, and finally, the module test.
        </p>        <br/>

        <p>
          Each module test comprises 10 questions. You will have to score a
          minimum of 5 marks to march forward to the next module. If you are
          unable to secure pass marks in that particular module, I recommend you
          to go through all the 5 parts once again and give the test.
        </p>        <br/>

        <p>
          Upon completion of 60 modules, you can also enroll for the
          certification program. The registration fee is Rs 499/- and you can
          take the grand finale test which comprises 100 questions. The duration
          of the exam is 60 minutes. Upon successfully clearing the exam, by
          scoring 60 marks and above, you will receive an{" "}
          <strong>I am Cyber Safe</strong> eCertificate which is valid for 2
          years. In case you do not clear the exam, you can apply for the
          supplementary exam, using the same voucher code.
        </p>
        <p>
          The outcome of the program is to help you inculcate the best practices
          of cyber security with your digital lifestyle.
        </p>
        <p>
          Well, I hope you enjoy the journey of Cyber Safe Girl Online Learning
          Program. Pay attention and complete the course. If you have any
          doubts, you are free to contact me. Drop a message to me on Facebook.
          My URL is{" "}
          <a
            href="https://www.facebook.com/educatorananth"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline"
          >
            www.facebook.com/educatorananth
          </a>
          . Do not forget to like my page for regular updates.
        </p>
        <p>
          I also appeal to all of you to feel free to share the version 5 PDF of
          Cyber Safe Girl on your WhatsApp, Facebook, and other social media
          platforms so that you can avoid your near and dear ones falling prey
          to cyber crimes. I would appreciate it if you can enroll 5 of your
          friends to enroll for this free course and help me with my mission of{" "}
          <strong>#CyberSafeIndia</strong>. Jai Hind.
        </p>
      </div>}

    </div>
  );
};

export default Introduction;