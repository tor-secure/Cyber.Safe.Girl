"use client"

import type React from "react"
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Shield, Code, FileText, Github, ChevronRight, ChevronDown, ArrowUp, Phone, Mail, MapPin } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"

const devs = [
  {
    name: "Ashwin",
    image: "https://media.licdn.com/dms/image/v2/D5616AQGgW4EcuhOy3w/profile-displaybackgroundimage-shrink_200_800/B56ZUKy8dXGQAU-/0/1739642883003?e=2147483647&v=beta&t=z0EIRd_0aHp8DMGpnZOmQl6ijFKXWo48PZj8bw6m-8A",
    url: "https://www.linkedin.com/in/ashwinbekal",
  },
  {
    name: "Shashank",
    image: "https://media.licdn.com/dms/image/v2/C5603AQGZaRCT3H7DLg/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1645344727571?e=2147483647&v=beta&t=G5N2gn49GJuVe73WBywDdHjWku92zT6Acycc6wy4CC4",
    url: "https://www.linkedin.com/in/shashank-kamath-p",
  },
  {
    name: "Shreyas H S",
    image: "data:image/jpeg;base64,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",
    url: "https://www.linkedin.com/in/shreyashs98",
  },
  {
    name: "Sanjan",
    image: "https://media.licdn.com/dms/image/v2/D5603AQF-72k6BCBtmA/profile-displayphoto-shrink_400_400/B56ZTf.w5UHQAg-/0/1738924563624?e=1750291200&v=beta&t=xdg-BP41taZR9V61UmlAVB-LOQVU3ggp0T1rFDqW0zI",
    url: "https://www.linkedin.com/in/sanjan-a-p-7bb043236",
  },
];

// Reusable Carousel settings
const getSliderSettings = (slidesToShow = 4) => ({
  dots: true,
  infinite: true,
  speed: 500,
  slidesToShow,
  slidesToScroll: slidesToShow,
  responsive: [
    {
      breakpoint: 1024,
      settings: {
        slidesToShow: slidesToShow > 3 ? 3 : slidesToShow,
        slidesToScroll: slidesToShow > 3 ? 3 : slidesToShow,
        infinite: true,
        dots: true
      }
    },
    {
      breakpoint: 600,
      settings: {
        slidesToShow: slidesToShow > 2 ? 2 : slidesToShow,
        slidesToScroll: slidesToShow > 2 ? 2 : slidesToShow,
        initialSlide: 2
      }
    },
    {
      breakpoint: 480,
      settings: {
        slidesToShow: 1,
        slidesToScroll: 1
      }
    }
  ]
});

// Modules Carousel Component
const ModuleCarousel = ({ imagesPerSlide = 4 }) => {
  const totalModuleImages = 60;
  const modules = Array.from({ length: totalModuleImages }, (_, index) => index + 1);

  return (
    <section id="modules" className="py-20 bg-gray-100 dark:bg-gray-800">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold">Modules</h2>
          <div className="mt-4 h-1 w-24 bg-rose-600 mx-auto rounded-full"></div>
        </motion.div>

        <Slider {...getSliderSettings(imagesPerSlide)}>
          {modules.map((num) => (
            <motion.div
              key={num}
              whileHover={{ scale: 1.05 }}
              className="p-2"
            >
              <div className="bg-white dark:bg-gray-700 rounded-lg overflow-hidden shadow-lg">
                <Image
                  src={`https://www.cybersafegirl.com/youtubethumbnails1/${num}.png?height=200&width=300&text=Module`}
                  width={300}
                  height={200}
                  alt={`Module ${num}`}
                  className="w-full"
                />
              </div>
            </motion.div>
          ))}
        </Slider>
      </div>
    </section>
  );
};

// Posters Carousel Component
const PosterCarousel = ({ imagesPerSlide = 4 }) => {
  const totalPosterImages = 40;
  const posters = Array.from({ length: totalPosterImages }, (_, index) => index + 1);

  return (
    <section id="posters" className="py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold">Posters</h2>
          <div className="mt-4 h-1 w-24 bg-rose-600 mx-auto rounded-full"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Click on each poster to view or download
          </p>
        </motion.div>

        <Slider {...getSliderSettings(imagesPerSlide)}>
          {posters.map((num) => (
            <motion.div
              key={num}
              whileHover={{ scale: 1.05 }}
              className="p-2"
            >
              <div className="bg-white dark:bg-gray-700 rounded-lg overflow-hidden shadow-lg">
                <a 
                  href={`https://www.cybersafegirl.com/posters/post${num}.pdf`}
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Image
                    src={`https://www.cybersafegirl.com/posterThumnail/post${num}.png?height=300&width=200&text=Poster`}
                    width={200}
                    height={300}
                    alt={`Poster ${num}`}
                    className="w-full"
                  />
                </a>
              </div>
            </motion.div>
          ))}
        </Slider>
      </div>
    </section>
  );
};

export default function HomePage() {
  const router = useRouter()
  const [isHovered, setIsHovered] = useState<string | null>(null)
  const [certificateNo, setCertificateNo] = useState("")
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [activeSection, setActiveSection] = useState("home")
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [moduleIndex, setModuleIndex] = useState(1)
  const [posterIndex, setPosterIndex] = useState(1)

  // Refs for sections
  const aboutRef = useRef<HTMLElement>(null)
  const servicesRef = useRef<HTMLElement>(null)
  const associatesRef = useRef<HTMLElement>(null)
  const modulesRef = useRef<HTMLElement>(null)
  const postersRef = useRef<HTMLElement>(null)
  const statsRef = useRef<HTMLElement>(null)
  const contactRef = useRef<HTMLElement>(null)

  // Scroll animations
  const { scrollY } = useScroll()
  const opacity = useTransform(scrollY, [0, 100], [1, 0.2])
  const scale = useTransform(scrollY, [0, 100], [1, 0.95])

  // Handle certificate validation
  const handleCertificateValidation = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Add your certificate validation logic here.
    console.log("Certificate number submitted:", certificateNo)
  }

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      // Show/hide scroll to top button
      if (window.scrollY > 300) {
        setShowScrollTop(true)
      } else {
        setShowScrollTop(false)
      }

      // Update active section based on scroll position
      const scrollPosition = window.scrollY + 100

      if (
        aboutRef.current &&
        scrollPosition >= aboutRef.current.offsetTop &&
        statsRef.current &&
        scrollPosition < statsRef.current.offsetTop
      ) {
        setActiveSection("about-us")
      } else if (
        statsRef.current &&
        scrollPosition >= statsRef.current.offsetTop &&
        servicesRef.current &&
        scrollPosition < servicesRef.current.offsetTop
      ) {
        setActiveSection("stats")
      } else if (
        servicesRef.current &&
        scrollPosition >= servicesRef.current.offsetTop &&
        associatesRef.current &&
        scrollPosition < associatesRef.current.offsetTop
      ) {
        setActiveSection("services")
      } else if (
        associatesRef.current &&
        scrollPosition >= associatesRef.current.offsetTop &&
        modulesRef.current &&
        scrollPosition < modulesRef.current.offsetTop
      ) {
        setActiveSection("associates")
      } else if (
        modulesRef.current &&
        scrollPosition >= modulesRef.current.offsetTop &&
        postersRef.current &&
        scrollPosition < postersRef.current.offsetTop
      ) {
        setActiveSection("modules")
      } else if (
        postersRef.current &&
        scrollPosition >= postersRef.current.offsetTop &&
        contactRef.current &&
        scrollPosition < contactRef.current.offsetTop
      ) {
        setActiveSection("posters")
      } else if (contactRef.current && scrollPosition >= contactRef.current.offsetTop) {
        setActiveSection("contact")
      } else {
        setActiveSection("home")
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Scroll to section function
  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId)
    if (section) {
      const yOffset = -80 // Header height offset
      const y = section.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: "smooth" })
      setIsMenuOpen(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Bar - Added from original site */}
      <div className="hidden md:block bg-gray-900 text-white py-2">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Mail className="h-4 w-4 mr-2" />
            <a href="mailto:support@cybersafegirl.com" className="text-sm hover:text-rose-400 transition-colors">
              support@cybersafegirl.com
            </a>
          </div>
          <div className="flex space-x-4">{/* Social links can be added here if needed */}</div>
        </div>
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            {/* <motion.div
              whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className="bg-rose-600 text-white rounded-md p-1"
            >
              <Shield className="h-6 w-6" />
            </motion.div> */}
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="font-bold text-xl"
            >
              Cyber Safe Girl
            </motion.span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="#"
              onClick={() => scrollToSection("home")}
              className={`text-sm font-medium transition-colors hover:text-primary ${activeSection === "home" ? "text-primary" : ""}`}
            >
              Home
            </Link>
            <Link
              href="#about-us"
              onClick={(e) => {
                e.preventDefault()
                scrollToSection("about-us")
              }}
              className={`text-sm font-medium transition-colors hover:text-primary ${activeSection === "about-us" ? "text-primary" : ""}`}
            >
              About Us
            </Link>
            <Link
              href="#services"
              onClick={(e) => {
                e.preventDefault()
                scrollToSection("services")
              }}
              className={`text-sm font-medium transition-colors hover:text-primary ${activeSection === "services" ? "text-primary" : ""}`}
            >
              Services
            </Link>
            <Link
              href="#modules"
              onClick={(e) => {
                e.preventDefault()
                scrollToSection("modules")
              }}
              className={`text-sm font-medium transition-colors hover:text-primary ${activeSection === "modules" ? "text-primary" : ""}`}
            >
              Modules
            </Link>
            <Link
              href="#posters"
              onClick={(e) => {
                e.preventDefault()
                scrollToSection("posters")
              }}
              className={`text-sm font-medium transition-colors hover:text-primary ${activeSection === "posters" ? "text-primary" : ""}`}
            >
              Posters
            </Link>
            <Link
              href="#contact"
              onClick={(e) => {
                e.preventDefault()
                scrollToSection("contact")
              }}
              className={`text-sm font-medium transition-colors hover:text-primary ${activeSection === "contact" ? "text-primary" : ""}`}
            >
              Contact
            </Link>
            <ThemeToggle />
            <Button variant="outline" onClick={() => router.push("/login")} className="transition-all hover:scale-105">
              Sign In
            </Button>
          </nav>
          <Button className="md:hidden" variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </Button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-background border-t"
            >
              <div className="flex flex-col p-4 space-y-4">
                <Link
                  href="#"
                  onClick={() => {
                    scrollToSection("home")
                    setIsMenuOpen(false)
                  }}
                  className={`text-sm font-medium ${activeSection === "home" ? "text-primary" : ""}`}
                >
                  Home
                </Link>
                <Link
                  href="#about-us"
                  onClick={(e) => {
                    e.preventDefault()
                    scrollToSection("about-us")
                  }}
                  className={`text-sm font-medium ${activeSection === "about-us" ? "text-primary" : ""}`}
                >
                  About Us
                </Link>
                <Link
                  href="#services"
                  onClick={(e) => {
                    e.preventDefault()
                    scrollToSection("services")
                  }}
                  className={`text-sm font-medium ${activeSection === "services" ? "text-primary" : ""}`}
                >
                  Services
                </Link>
                <Link
                  href="#modules"
                  onClick={(e) => {
                    e.preventDefault()
                    scrollToSection("modules")
                  }}
                  className={`text-sm font-medium ${activeSection === "modules" ? "text-primary" : ""}`}
                >
                  Modules
                </Link>
                <Link
                  href="#posters"
                  onClick={(e) => {
                    e.preventDefault()
                    scrollToSection("posters")
                  }}
                  className={`text-sm font-medium ${activeSection === "posters" ? "text-primary" : ""}`}
                >
                  Posters
                </Link>
                <Link
                  href="#contact"
                  onClick={(e) => {
                    e.preventDefault()
                    scrollToSection("contact")
                  }}
                  className={`text-sm font-medium ${activeSection === "contact" ? "text-primary" : ""}`}
                >
                  Contact
                </Link>
                <div className="flex items-center justify-between">
                  <ThemeToggle />
                  <Button variant="outline" onClick={() => router.push("/login")} size="sm">
                    Sign In
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section id="home" className="relative pt-16 items-center flex min-h-[90vh]">
          <div className="container mx-auto items-center flex flex-wrap">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="w-full md:w-8/12 lg:w-6/12 xl:w-6/12 px-4"
            >
              <div className="pt-32 sm:pt-0">
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                  className="font-semibold text-4xl md:text-5xl lg:text-6xl text-gray-700 dark:text-gray-200"
                >
                  Welcome to <span className="text-rose-600">Cyber Safe Girl</span>
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="mt-4 text-lg leading-relaxed text-gray-600 dark:text-gray-300"
                >
                  Cyber Safe Girl is a unique program inspired by the honorable Prime Minister Narendra Modi ji&apos;s
                  &quot;Beti Bachao, Beti Padhao&quot;. The mission of this project is- &quot;Beti Bachao Cyber Crime
                  Se&quot;, designed to inculcate the best practices of responsible browsing and stay safe and secure
                  from the cyber threats, especially among the students, elderly and working professionals.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                  className="mt-12 flex flex-wrap gap-4"
                >
                  <div className="relative group">
                    <Button variant="outline" className="group relative overflow-hidden">
                      <span className="absolute inset-0 bg-gradient-to-r from-rose-500 to-pink-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
                      Download E-Book
                    </Button>
                    <div className="absolute z-50 hidden group-hover:block mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 border border-gray-200 dark:border-gray-700">
                      <button className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left">
                        English
                      </button>
                      <button className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left">
                        ગુજરાતી
                      </button>
                      <button className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left">
                        ಕನ್ನಡ
                      </button>
                      <button className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left">
                        اللغة العربية
                      </button>
                    </div>
                  </div>
                  <Button
                    className="relative overflow-hidden bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 transition-all duration-300"
                    style={{
                      transform: isHovered === "cert" ? "scale(1.05)" : "scale(1)",
                    }}
                    onMouseEnter={() => setIsHovered("cert")}
                    onMouseLeave={() => setIsHovered(null)}
                    onClick={() => router.push("/login")}
                  >
                    <span className="absolute inset-0 bg-white opacity-0 hover:opacity-10 transition-opacity duration-300"></span>
                    Get Certification
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>

          <motion.div
            style={{ opacity, scale }}
            className="absolute top-0 right-0 pt-16 sm:w-6/12 -mt-48 sm:mt-0 w-10/12 max-h-[80vh] hidden md:block"
          >
            <Image
              src="https://cybersafegirl.vercel.app/static/media/pattern_react.01996482038c959aba34.png"
              width={800}
              height={600}
              alt="Cyber Safe Girl Pattern"
              className="opacity-80"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
          >
            <button
              onClick={() => scrollToSection("about-us")}
              className="flex flex-col items-center
              translate-y-20
              text-gray-500 hover:text-primary transition-colors"
              aria-label="Scroll down"
            >
              <span className="text-sm mb-2">Scroll Down</span>
              <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}>
                <ChevronDown className="h-6 w-6" />
              </motion.div>
            </button>
          </motion.div>
        </section>

        {/* About Us Section */}
        <section id="about-us" ref={aboutRef} className="py-20 bg-gray-100 dark:bg-gray-800 relative mt-10">
          <div className="container mx-auto overflow-hidden pb-20">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold">About Us</h2>
              <div className="mt-4 h-1 w-24 bg-rose-600 mx-auto rounded-full"></div>
            </motion.div>

            <div className="flex flex-wrap items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className="w-full md:w-4/12 px-12 md:px-4 ml-auto mr-auto mt-12"
              >
                <h3 className="text-3xl mb-2 font-semibold leading-normal">Our Mission</h3>
                <p className="text-lg font-light leading-relaxed mt-4 mb-4 text-gray-600 dark:text-gray-300">
                  <strong>
                    We are a group of young professionals with in-depth knowledge into Cyber Security and Cyber Crimes.
                  </strong>
                </p>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  className="text-center inline-flex items-center justify-center w-20 h-20 mb-6 shadow-lg rounded-full bg-white dark:bg-gray-700"
                >
                  <Image
                    src="https://www.cybersafegirl.com/Images/Author.png"
                    width={80}
                    height={80}
                    alt="Dr. Ananth Prabhu G"
                    className="rounded-full"
                  />
                </motion.div>
                <p className="text-md font-light leading-relaxed mt-4 mb-4 text-gray-600 dark:text-gray-300">
                  It all started with the penchant desire of the curator and resource person Dr Ananth Prabhu G, PhD,
                  PDF, to help the young girls and women to engage with responsible browsing on the internet. The idea
                  was given a shape by building Info toons to help students and women easily understand various
                  Cybercrimes committed on a daily basis.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="w-full md:w-5/12 px-4 mr-auto ml-auto mt-32"
              >
                <div className="relative flex flex-col min-w-0 w-full mb-6 mt-48 md:mt-0">
                  <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
                    <Image
                      src="https://www.cybersafegirl.com/Images/MainCSG6.png"
                      width={600}
                      height={400}
                      alt="Cyber Safe Girl"
                      className="w-full align-middle rounded-lg shadow-2xl"
                    />
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats Section - Added from original site */}
        <section id="stats" ref={statsRef} className="py-16 bg-white dark:bg-gray-900">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold">Our Impact</h2>
              <div className="mt-4 h-1 w-24 bg-rose-600 mx-auto rounded-full"></div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center"
              >
                <div className="text-4xl font-bold text-rose-600 mb-2">500,000+</div>
                <div className="text-xl font-semibold">Enrolled Users</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.05 }}
                className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center"
              >
                <div className="text-4xl font-bold text-rose-600 mb-2">50+</div>
                <div className="text-xl font-semibold">Chapters / Episodes</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.05 }}
                className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center"
              >
                <div className="text-4xl font-bold text-rose-600 mb-2">125,000+</div>
                <div className="text-xl font-semibold">Certified Users</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.05 }}
                className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center"
              >
                <div className="text-4xl font-bold text-rose-600 mb-2">3,000,000+</div>
                <div className="text-xl font-semibold">Readers of Cyber Safe Girl</div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" ref={servicesRef} className="py-20 bg-gray-100 dark:bg-gray-800">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold">Our Services</h2>
              <div className="mt-4 h-1 w-24 bg-rose-600 mx-auto rounded-full"></div>
            </motion.div>

            <div className="flex flex-wrap items-center">
              <div className="w-full md:w-6/12 px-4 mr-auto ml-auto">
                <div className="justify-center flex flex-wrap relative">
                  <div className="my-4 w-full lg:w-6/12 px-4">
                    <motion.div
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      whileHover={{
                        scale: 1.05,
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                      }}
                      className="bg-red-600 shadow-lg rounded-lg text-center p-8"
                    >
                      <div className="shadow-md rounded-full max-w-full w-16 mx-auto p-2 bg-white">
                        <Shield className="h-12 w-12 text-red-600" />
                      </div>
                      <p className="text-lg text-white mt-4 font-semibold">Cyber Security</p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      whileHover={{
                        scale: 1.05,
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                      }}
                      className="bg-gray-700 shadow-lg rounded-lg text-center p-8 mt-8"
                    >
                      <div className="shadow-md rounded-full max-w-full w-16 mx-auto p-2 bg-white">
                        <Code className="h-12 w-12 text-gray-700" />
                      </div>
                      <p className="text-lg text-white mt-4 font-semibold">Digital Safety</p>
                    </motion.div>
                  </div>
                  <div className="my-4 w-full lg:w-6/12 px-4 lg:mt-16">
                    <motion.div
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      whileHover={{
                        scale: 1.05,
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                      }}
                      className="bg-yellow-500 shadow-lg rounded-lg text-center p-8"
                    >
                      <div className="shadow-md rounded-full max-w-full w-16 mx-auto p-2 bg-white">
                        <FileText className="h-12 w-12 text-yellow-500" />
                      </div>
                      <p className="text-lg text-white mt-4 font-semibold">E-Learning</p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      whileHover={{
                        scale: 1.05,
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                      }}
                      className="bg-green-500 shadow-lg rounded-lg text-center p-8 mt-8"
                    >
                      <div className="shadow-md rounded-full max-w-full w-16 mx-auto p-2 bg-white">
                        <Shield className="h-12 w-12 text-green-500" />
                      </div>
                      <p className="text-lg text-white mt-4 font-semibold">Cyber Crime Prevention</p>
                    </motion.div>
                  </div>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="w-full md:w-4/12 px-12 md:px-4 ml-auto mr-auto"
              >
                <div className="text-gray-500 p-3 text-center inline-flex items-center justify-center w-16 h-16 mb-6 shadow-lg rounded-full bg-white dark:bg-gray-700">
                  <FileText className="h-8 w-8" />
                </div>
                <h3 className="text-3xl mb-2 font-semibold leading-normal">Services</h3>
                <p className="text-lg font-light leading-relaxed mt-4 mb-4 text-gray-600 dark:text-gray-300">
                  Cyber Safe Girl is an E-Learning Program, containing 50+ animated info toons, explained in detail by
                  Dr. Ananth Prabhu G.
                </p>
                <div className="block pb-6">
                  <motion.div className="flex flex-wrap">
                    {[
                      "E-Learning Program",
                      "On Campus Workshops",
                      "Swacch Devices",
                      "Protection in Digital Era",
                      "Security",
                      "Cyber Crime Laws",
                    ].map((item, index) => (
                      <motion.span
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 * index }}
                        whileHover={{ scale: 1.1, backgroundColor: "rgba(244, 63, 94, 0.1)" }}
                        className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-gray-500 bg-white dark:bg-gray-700 dark:text-gray-300 mr-2 mt-2"
                      >
                        {item}
                      </motion.span>
                    ))}
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Associates Section */}
        <section id="associates" ref={associatesRef} className="py-20 bg-white dark:bg-gray-900">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold">Our Associates</h2>
              <div className="mt-4 h-1 w-24 bg-rose-600 mx-auto rounded-full"></div>
            </motion.div>

            <div className="flex flex-wrap items-center">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className="w-10/12 md:w-9/12 lg:w-4/12 px-2 md:px-4 mx-auto mb-8"
              >
                <div className="relative flex flex-col min-w-0 break-words bg-white dark:bg-gray-700 w-full shadow-lg rounded-lg overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&auto=format&fit=crop&w=700&q=80"
                    width={500}
                    height={300}
                    alt="Cyber Security"
                    className="w-full align-middle rounded-t-lg"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="relative p-8"
                  >
                    <h4 className="text-xl font-bold text-gray-800 dark:text-white">How our Associates help us?</h4>
                    <p className="text-md font-light mt-2 text-gray-600 dark:text-gray-300">
                      Associates in the Cyber Safe Girl project play a crucial role in promoting cybersecurity
                      awareness, educating communities on digital safety practices, and supporting initiatives that
                      empower individuals to protect themselves online.
                    </p>
                  </motion.div>
                </div>
              </motion.div>

              <div className="w-full md:w-12/12 lg:w-6/12 px-4 text-center">
                <h3 className="text-3xl mb-6 font-semibold leading-normal">Our Partners</h3>
                <div className="flex flex-wrap justify-center">
                  <div className="w-full md:w-6/12 px-4">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 }}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="relative flex flex-col"
                    >
                      <div className="px-4 py-3">
                        <div className="text-gray-500 p-3 inline-flex items-center justify-center w-32 h-32 mb-5 shadow-lg rounded-full bg-white dark:bg-gray-700">
                          <Image
                            src="https://cybersafegirl.com/Images/govtOfKarnataka.png?height=64&width=64"
                            width={128}
                            height={128}
                            alt="Government of Karnataka"
                            className="rounded-full"
                          />
                        </div>
                      </div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 }}
                      whileHover={{ scale: 1.1, rotate: -5 }}
                      className="relative flex flex-col"
                    >
                      <div className="px-4 py-1">
                        <div className="text-gray-500 p-3 bg-white dark:bg-gray-700 inline-flex items-center justify-center w-32 h-32 mb-5 shadow-lg rounded-full">
                          <Image
                            src="https://cybersafegirl.vercel.app/static/media/ISEA.ecc9b185646d68183cd0.png?height=64&width=64"
                            width={128}
                            height={128}
                            alt="ISEA"
                            className="rounded-full"
                          />
                        </div>
                      </div>
                    </motion.div>
                  </div>
                  <div className="w-full md:w-6/12 px-4">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 }}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="relative flex flex-col"
                    >
                      <div className="px-4 py-3">
                        <div className="text-gray-500 p-3 inline-flex items-center justify-center w-32 h-32 mb-5 shadow-lg rounded-full bg-white dark:bg-gray-700">
                          <Image
                            src="https://cybersafegirl.vercel.app/static/media/sp.d27fb5237869262928fd.png?height=64&width=64"
                            width={128}
                            height={128}
                            alt="SurePass"
                            className="rounded-full"
                          />
                        </div>
                      </div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4 }}
                      whileHover={{ scale: 1.1, rotate: -5 }}
                      className="relative flex flex-col"
                    >
                      <div className="px-4">
                        <div className="text-gray-500 p-3 inline-flex items-center justify-center w-32 h-32 mb-5 shadow-lg rounded-full bg-white dark:bg-gray-700">
                          <Image
                            src="https://cybersafegirl.com/Images/cyber-jagrithi.png?height=64&width=64"
                            width={128}
                            height={128}
                            alt="Cyber Jagrithi"
                            className="rounded-full"
                          />
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <ModuleCarousel imagesPerSlide={4} />
        <PosterCarousel imagesPerSlide={4} />

        {/* CTA Section */}
        <section className="py-20 bg-gray-100 dark:bg-gray-800">
          <div className="container mx-auto">
            <div className="flex flex-wrap justify-center">
              <div className="w-full lg:w-8/12 px-4">
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8 }}
                  whileHover={{ scale: 1.02 }}
                  className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-2xl rounded-lg bg-gradient-to-r from-rose-600 to-pink-600 p-12"
                >
                  <div className="flex flex-wrap justify-center text-center">
                    <div className="w-full lg:w-8/12 px-4">
                      <h2 className="text-white text-4xl font-semibold">Ready to get certified?</h2>
                      <p className="text-lg leading-relaxed mt-4 mb-4 text-white opacity-90">
                        Join thousands of students who have already completed the Cyber Safe Girl certification program.
                        Learn essential cybersecurity skills and protect yourself online.
                      </p>
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          className="mt-6 bg-white text-rose-600 hover:bg-gray-100 transition-all duration-300"
                          onClick={() => router.push("/login")}
                        >
                          Get Started
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                  <motion.div
                    className="absolute -top-10 -right-10 opacity-20"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  >
                    <Shield className="h-40 w-40 text-white" />
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Us Section */}
        <section id="contact" ref={contactRef} className="py-20 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl font-bold">Contact Us</h2>
              <div className="mt-4 h-1 w-24 bg-rose-600 mx-auto rounded-full"></div>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Our Address */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                }}
                className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md text-center"
              >
                <div className="mx-auto bg-rose-100 dark:bg-rose-900 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <MapPin className="h-8 w-8 text-rose-600 dark:text-rose-300" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Our Address</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  SurePass Academy #9, II Floor,
                  <br />
                  Manasa Towers, P.V.S Junction,
                  <br />
                  Mangalore 575004
                </p>
              </motion.div>

              {/* Email Us */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                }}
                className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md text-center"
              >
                <div className="mx-auto bg-blue-100 dark:bg-blue-900 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <Mail className="h-8 w-8 text-blue-600 dark:text-blue-300" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Email Us</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  support@cybersafegirl.com
                  <br />
                  educatorananth@gmail.com
                </p>
              </motion.div>

              {/* Call Us */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                }}
                className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md text-center"
              >
                <div className="mx-auto bg-green-100 dark:bg-green-900 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <Phone className="h-8 w-8 text-green-600 dark:text-green-300" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Call Us</h3>
                <p className="text-gray-600 dark:text-gray-300">+91 95356 45357</p>
              </motion.div>

              {/* Verify Certificate */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                }}
                className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md text-center"
              >
                <div className="mx-auto bg-yellow-100 dark:bg-yellow-900 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-yellow-600 dark:text-yellow-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Verify Certificate</h3>
                <form onSubmit={handleCertificateValidation}>
                  <div className="mb-4">
                    <Input
                      type="text"
                      value={certificateNo}
                      onChange={(e) => setCertificateNo(e.target.value)}
                      placeholder="Certificate Number"
                      required
                      className="w-full"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Verify
                  </Button>
                </form>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap">
            <div className="w-full md:w-4/12 mb-8 md:mb-0">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex items-center gap-2 mb-4"
              >
                {/* <div className="bg-rose-600 text-white rounded-md p-1">
                  <Shield className="h-6 w-6" />
                </div> */}
                <span className="font-bold text-xl">Cyber Safe Girl</span>
              </motion.div>
              <p className="text-gray-400 mb-4">
                Empowering women and girls with cybersecurity knowledge to stay safe online.
              </p>
              <div className="flex space-x-4">
                <motion.a
                  whileHover={{ scale: 1.2, y: -5 }}
                  href="https://www.facebook.com/educatorananth/"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                      clipRule="evenodd"
                    />
                  </svg>
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.2, y: -5 }}
                  href="https://x.com/i/flow/login?redirect_after_login=%2Feducatorananth"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.2, y: -5 }}
                  href="https://github.com/ashwinbekal"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Github className="h-6 w-6" />
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.2, y: -5 }}
                  href="https://ananthprabhu.com/"
                  className="text-gray-400 hover:text-white transition-colors ml-2"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 7h18M4 7v10a2 2 0 002 2h12a2 2 0 002-2V7"
                    />
                  </svg>
                </motion.a>
              </div>
            </div>

            <div className="w-full md:w-2/12 mb-8 md:mb-0">
              <h3 className="font-semibold text-lg mb-4">Links</h3>
              <ul className="space-y-2">
                {["Home", "About Us", "Services", "Modules", "Posters", "Contact"].map((item, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <Link
                      href={`#${item === "Home" ? "" : item.toLowerCase().replace(" ", "-")}`}
                      onClick={(e) => {
                        e.preventDefault()
                        scrollToSection(item === "Home" ? "home" : item.toLowerCase().replace(" ", "-"))
                      }}
                      className="text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block"
                    >
                      {item}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </div>

            <div className="w-full md:w-2/12 mb-8 md:mb-0">
              <h3 className="font-semibold text-lg mb-4">Resources</h3>
              <ul className="space-y-2">
                {[
                  "E-Book",
                  "Certification",
                  "Workshops",
                  "Blog",
                  "Privacy Policy",
                  "Terms of Service",
                  "Refund Policy",
                ].map((item, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <a
                      href="#"
                      className="text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block"
                    >
                      {item}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </div>

            <div className="w-full md:w-4/12">
              <h3 className="font-semibold text-lg mb-4">Designed and Developed By:</h3>
              {/* Container with overlapping effect */}
              <div className="flex items-center space-x-[-20px]">
                {devs.map((dev) => (
                  <div key={dev.name} className="group flex flex-col items-center cursor-pointer transition-transform duration-300 hover:scale-110">
                    <a href={dev.url} target="_blank" rel="noopener noreferrer">
                      <div className="relative w-16 h-16">
                        <Image
                          src={dev.image}
                          alt={dev.name}
                          fill
                          className="rounded-full object-cover"
                        />
                      </div>
                    </a>
                    {/* The name appears below on hover */}
                    <span className="mt-2 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {dev.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>© {new Date().getFullYear()} Cyber Safe Girl. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Scroll to top button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 bg-rose-600 text-white p-3 rounded-full shadow-lg z-50"
            aria-label="Scroll to top"
          >
            <ArrowUp className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
