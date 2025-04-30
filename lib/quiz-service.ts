// Define types for our quiz data
export interface QuizQuestion {
    id: string
    question: string
    options: Record<string, string>
    chapter?: string
    originalId?: string
  }
  
  export type AnswerKey = Record<string, string>
  
  // Function to fetch quiz questions for a specific chapter
  export async function fetchQuizQuestions(chapterId: string): Promise<QuizQuestion[]> {
    try {
      const response = await fetch(`/api/quiz/${chapterId}`)
  
      if (!response.ok) {
        throw new Error(`Failed to fetch quiz questions: ${response.statusText}`)
      }
  
      const data = await response.json()
      return data.questions || []
    } catch (error) {
      console.error("Error fetching quiz questions:", error)
  
      // Return fallback data for development/testing
      return getFallbackQuestions(chapterId)
    }
  }
  
  // We no longer need to fetch the answer key from the client side
  // as the validation is now done on the server side
  
  // Fallback data for development/testing
  function getFallbackQuestions(chapterId: string): QuizQuestion[] {
    // Generate some dummy questions based on chapter ID
    const baseQuestions = [
      {
        id: "Q01",
        question: "What is to the chapter?",
        options: {
          A: "Personal information exploitation",
          B: "Financial fraud",
          C: "Cellphone number misuse",
          D: "Software installation",
        },
      },
      {
        id: "Q02",
        question: "Which IPC section is mentioned in the chapter for voyeurism?",
        options: {
          A: "IPC Section 354A/BNS 75",
          B: "IPC Section 354C/BNS 77",
          C: "IPC Section 503/BNS 351",
          D: "IPC Section 499/BNS 347",
        },
      },
      {
        id: "Q03",
        question: "Which section of the IT Act deals with identity theft?",
        options: {
          A: "Section 65",
          B: "Section 66C",
          C: "Section 67",
          D: "Section 70",
        },
      },
      {
        id: "Q04",
        question: "What should you do if you suspect your information has been compromised?",
        options: {
          A: "Ignore it as nothing will happen",
          B: "Report to the authorities immediately",
          C: "Wait and see if there's any suspicious activity",
          D: "Change all your passwords but don't report",
        },
      },
      {
        id: "Q05",
        question: "Which of the following is NOT a good cybersecurity practice?",
        options: {
          A: "Using different passwords for different accounts",
          B: "Sharing your OTP with trusted friends",
          C: "Enabling two-factor authentication",
          D: "Regularly updating your devices",
        },
      },
    ]
  
    // Add more questions to make at least 10
    const additionalQuestions = [
      {
        id: "Q06",
        question: "What is phishing?",
        options: {
          A: "A technique to steal personal information by pretending to be a trustworthy entity",
          B: "A method to strengthen passwords",
          C: "A type of firewall",
          D: "A secure way to share files",
        },
      },
      {
        id: "Q07",
        question: "What is two-factor authentication?",
        options: {
          A: "Using two different passwords",
          B: "Logging in from two different devices",
          C: "Using something you know and something you have for authentication",
          D: "Changing your password twice a month",
        },
      },
      {
        id: "Q08",
        question: "Which of these is a secure password?",
        options: {
          A: "P@ssw0rd!2023",
          B: "password123",
          C: "12345678",
          D: "qwerty",
        },
      },
      {
        id: "Q09",
        question: "What is malware?",
        options: {
          A: "A hardware component",
          B: "A type of computer memory",
          C: "Malicious software designed to harm or exploit devices",
          D: "A secure messaging app",
        },
      },
      {
        id: "Q10",
        question: "What should you do before clicking on links in emails?",
        options: {
          A: "Always click immediately",
          B: "Forward the email to friends",
          C: "Delete the email without reading",
          D: "Verify the sender and hover over the link to see the destination",
        },
      },
    ]
  
    return [...baseQuestions, ...additionalQuestions].map((q) => ({
      ...q,
      chapter: chapterId,
    }))
  }
  
  // We no longer need the fallback answer key since validation is done on the server
  