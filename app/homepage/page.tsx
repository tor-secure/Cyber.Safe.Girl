"use client";

import type React from "react";
import Slider from "react-slick";
import backgroundImage from '@/public/homepage_background.png';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RedirectLoader } from "@/components/redirect-loader";
import {
  Shield,
  Code,
  FileText,
  Github,
  ChevronRight,
  ChevronDown,
  ArrowUp,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";

const devs = [
  {
    name: "Ashwin Bekal",
    image:
      "/developers/ashwin.webp",
    url: "https://www.linkedin.com/in/ashwinbekal",
  },
  {
    name: "Shreyas H S",
    image:
      "/developers/shreyas.webp",
    url: "https://www.linkedin.com/in/shreyashs98",
  },
  {
    name: "Sanjan",
    image:
      "/developers/sanjan.webp",
    url: "https://www.linkedin.com/in/sanjan-a-p-7bb043236",
  },
  {
    name: "Shashank",
    image:
      "/developers/shashank.webp",
    url: "https://www.linkedin.com/in/shashank-kamath-p",
  }
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
        dots: true,
      },
    },
    {
      breakpoint: 600,
      settings: {
        slidesToShow: slidesToShow > 2 ? 2 : slidesToShow,
        slidesToScroll: slidesToShow > 2 ? 2 : slidesToShow,
        initialSlide: 2,
      },
    },
    {
      breakpoint: 480,
      settings: {
        slidesToShow: 1,
        slidesToScroll: 1,
      },
    },
  ],
});

// Modules Carousel Component
const ModuleCarousel = ({ imagesPerSlide = 4 }) => {
  const totalModuleImages = 60;
  const modules = Array.from(
    { length: totalModuleImages },
    (_, index) => index + 1
  );

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
          <div className="mt-4 h-1 w-24 bg-blue-600 mx-auto rounded-full"></div>
        </motion.div>

        <Slider {...getSliderSettings(imagesPerSlide)}>
          {modules.map((num) => (
            <motion.div key={num} whileHover={{ scale: 1.05 }} className="p-2">
              <div className="bg-white dark:bg-gray-700 rounded-lg overflow-hidden shadow-lg">
                <Image
                  src={`/modules/${num}.webp?height=200&width=300&text=Module`}
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
  const posters = Array.from(
    { length: totalPosterImages },
    (_, index) => index + 1
  );

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
          <div className="mt-4 h-1 w-24 bg-blue-600 mx-auto rounded-full"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Click on each poster to view or download
          </p>
        </motion.div>

        <Slider {...getSliderSettings(imagesPerSlide)}>
          {posters.map((num) => (
            <motion.div key={num} whileHover={{ scale: 1.05 }} className="p-2">
              <div className="bg-white dark:bg-gray-700 rounded-lg overflow-hidden shadow-lg">
                <a
                  href={`https://www.cybersafegirl.com/posters/post${num}.pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Image
                    src={`/posters/${num}.webp?height=300&width=200&text=Poster`}
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
  const router = useRouter();
  const [isHovered, setIsHovered] = useState<string | null>(null);
  const [certificateNo, setCertificateNo] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [moduleIndex, setModuleIndex] = useState(1);
  const [posterIndex, setPosterIndex] = useState(1);
  const [isEbookMenuOpen, setIsEbookMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Refs for sections
  const aboutRef = useRef<HTMLElement>(null);
  const servicesRef = useRef<HTMLElement>(null);
  const associatesRef = useRef<HTMLElement>(null);
  const modulesRef = useRef<HTMLElement>(null);
  const postersRef = useRef<HTMLElement>(null);
  const statsRef = useRef<HTMLElement>(null);
  const contactRef = useRef<HTMLElement>(null);

  // Scroll animations
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 100], [1, 0.2]);
  const scale = useTransform(scrollY, [0, 100], [1, 0.95]);

  // Handle certificate validation
  const handleCertificateValidation = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Add your certificate validation logic here.
    console.log("Certificate number submitted:", certificateNo);
  };

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Check authentication status
  useEffect(() => {
    const checkAuth = () => {
      // Check if we just logged out (URL has a logout parameter)
      const justLoggedOut = window.location.search.includes('logout=true');
      
      if (justLoggedOut) {
        // If we just logged out, don't redirect
        setIsAuthenticated(false);
        setIsCheckingAuth(false);
        return;
      }
      
      // Check for auth tokens in various storage mechanisms
      const hasAuthCookie = document.cookie.includes('firebase-auth-token');
      const hasLocalStorageToken = !!localStorage.getItem('firebase-auth-token');
      const hasSessionStorageToken = !!sessionStorage.getItem('firebase-auth-token');
      
      // If any auth token exists, user is authenticated
      const authenticated = hasAuthCookie || hasLocalStorageToken || hasSessionStorageToken;
      setIsAuthenticated(authenticated);
      setIsCheckingAuth(false);
    };
    
    // Small delay to ensure all storage is checked properly
    const timer = setTimeout(checkAuth, 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      // Show/hide scroll to top button
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }

      // Update active section based on scroll position
      const scrollPosition = window.scrollY + 100;

      if (
        aboutRef.current &&
        scrollPosition >= aboutRef.current.offsetTop &&
        statsRef.current &&
        scrollPosition < statsRef.current.offsetTop
      ) {
        setActiveSection("about-us");
      } else if (
        statsRef.current &&
        scrollPosition >= statsRef.current.offsetTop &&
        servicesRef.current &&
        scrollPosition < servicesRef.current.offsetTop
      ) {
        setActiveSection("stats");
      } else if (
        servicesRef.current &&
        scrollPosition >= servicesRef.current.offsetTop &&
        associatesRef.current &&
        scrollPosition < associatesRef.current.offsetTop
      ) {
        setActiveSection("services");
      } else if (
        associatesRef.current &&
        scrollPosition >= associatesRef.current.offsetTop &&
        modulesRef.current &&
        scrollPosition < modulesRef.current.offsetTop
      ) {
        setActiveSection("associates");
      } else if (
        modulesRef.current &&
        scrollPosition >= modulesRef.current.offsetTop &&
        postersRef.current &&
        scrollPosition < postersRef.current.offsetTop
      ) {
        setActiveSection("modules");
      } else if (
        postersRef.current &&
        scrollPosition >= postersRef.current.offsetTop &&
        contactRef.current &&
        scrollPosition < contactRef.current.offsetTop
      ) {
        setActiveSection("posters");
      } else if (
        contactRef.current &&
        scrollPosition >= contactRef.current.offsetTop
      ) {
        setActiveSection("contact");
      } else {
        setActiveSection("home");
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll to section function
  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      const yOffset = -80; // Header height offset
      const y =
        section.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
      setIsMenuOpen(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Show loader and redirect if authenticated */}
      {!isCheckingAuth && isAuthenticated && (
        <RedirectLoader 
          redirectTo="/dashboard" 
          message="You're already logged in. Redirecting to dashboard..." 
        />
      )}
      
      {/* Top Bar - Added from original site */}
      <div className="hidden md:block bg-gray-900 text-white py-2">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Mail className="h-4 w-4 mr-2" />
            <a
              href="mailto:support@cybersafegirl.com"
              className="text-sm hover:text-blue-400 transition-colors"
            >
              support@cybersafegirl.com
            </a>
          </div>
          <div className="flex space-x-4">
            {/* Social links can be added here if needed */}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            {/* <motion.div
              whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className="bg-blue-600 text-white rounded-md p-1"
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
              className={`text-sm font-medium transition-colors hover:text-primary ${
                activeSection === "home" ? "text-primary" : ""
              }`}
            >
              Home
            </Link>
            <Link
              href="#about-us"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("about-us");
              }}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                activeSection === "about-us" ? "text-primary" : ""
              }`}
            >
              About Us
            </Link>
            <Link
              href="#services"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("services");
              }}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                activeSection === "services" ? "text-primary" : ""
              }`}
            >
              Services
            </Link>
            <Link
              href="#modules"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("modules");
              }}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                activeSection === "modules" ? "text-primary" : ""
              }`}
            >
              Modules
            </Link>
            <Link
              href="#posters"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("posters");
              }}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                activeSection === "posters" ? "text-primary" : ""
              }`}
            >
              Posters
            </Link>
            <Link
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("contact");
              }}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                activeSection === "contact" ? "text-primary" : ""
              }`}
            >
              Contact
            </Link>
            <ThemeToggle />
            <Button
              variant="outline"
              onClick={() => router.push("/login")}
              className="transition-all hover:scale-105"
            >
              Sign In
            </Button>
          </nav>
          <Button
            className="md:hidden"
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
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
                    scrollToSection("home");
                    setIsMenuOpen(false);
                  }}
                  className={`text-sm font-medium ${
                    activeSection === "home" ? "text-primary" : ""
                  }`}
                >
                  Home
                </Link>
                <Link
                  href="#about-us"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection("about-us");
                  }}
                  className={`text-sm font-medium ${
                    activeSection === "about-us" ? "text-primary" : ""
                  }`}
                >
                  About Us
                </Link>
                <Link
                  href="#services"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection("services");
                  }}
                  className={`text-sm font-medium ${
                    activeSection === "services" ? "text-primary" : ""
                  }`}
                >
                  Services
                </Link>
                <Link
                  href="#modules"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection("modules");
                  }}
                  className={`text-sm font-medium ${
                    activeSection === "modules" ? "text-primary" : ""
                  }`}
                >
                  Modules
                </Link>
                <Link
                  href="#posters"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection("posters");
                  }}
                  className={`text-sm font-medium ${
                    activeSection === "posters" ? "text-primary" : ""
                  }`}
                >
                  Posters
                </Link>
                <Link
                  href="#contact"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection("contact");
                  }}
                  className={`text-sm font-medium ${
                    activeSection === "contact" ? "text-primary" : ""
                  }`}
                >
                  Contact
                </Link>
                <div className="flex items-center justify-between">
                  <ThemeToggle />
                  <Button
                    variant="outline"
                    onClick={() => router.push("/login")}
                    size="sm"
                  >
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
        <section
          id="home"
          className="relative items-center flex min-h-[90vh]"
        >
          <div className="container mx-auto items-center flex flex-wrap">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="w-full md:w-8/12 lg:w-6/12 xl:w-6/12 px-4"
            >
              <div className="sm:pt-0">
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                  className="font-semibold text-4xl md:text-5xl lg:text-6xl text-gray-700 dark:text-gray-200"
                >
                  Welcome to{" "}
                  <span className="text-[#55A0E3]">Cyber Safe Girl</span>
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="mt-4 text-lg 
                  text-justify
                  leading-relaxed text-gray-600 dark:text-gray-300"
                >
                  Cyber Safe Girl is a unique program inspired by the honorable
                  Prime Minister Narendra Modi ji&apos;s &quot;Beti Bachao, Beti
                  Padhao&quot;. The mission of this project is- &quot;Beti
                  Bachao Cyber Crime Se&quot;, designed to inculcate the best
                  practices of responsible browsing and stay safe and secure
                  from the cyber threats, especially among the students, elderly
                  and working professionals.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                  className="mt-12 flex flex-wrap gap-4"
                >
                  <div className="relative">
                    <Button
                      variant="outline"
                      className="relative overflow-hidden"
                      onClick={() => setIsEbookMenuOpen((prev) => !prev)} 
                      
                      // Toggle menu on click
                    >
                      <span
                        className={`absolute inset-0 bg-gradient-to-r from-blue-500 to-pink-500 ${
                          isEbookMenuOpen ? "opacity-20" : "opacity-0"
                        } transition-opacity duration-300`}
                      ></span>
                      Download E-Book
                    </Button>
                    {isEbookMenuOpen && ( // Show menu only when clicked
                      <div className="absolute z-50 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 border border-gray-200 dark:border-gray-700">
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
                    )}
                  </div>
                  <Button
                    className="relative overflow-hidden bg-gradient-to-r from-[#87ABC2] to-[#55A0E3] hover:from-blue-700 hover:to-pink-700 transition-all duration-300"
                    style={{
                      transform:
                        isHovered === "cert" ? "scale(1.05)" : "scale(1)",
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
            className="absolute top-0 right-0 sm:w-6/12 -mt-48 sm:mt-0 w-10/12 max-h-[80vh] hidden md:block"
          >
            <Image
              src={backgroundImage}
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
              {/* <span className="text-sm mb-2">Scroll Down</span>
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
              >
                <ChevronDown className="h-6 w-6" />
              </motion.div> */}
            </button>
          </motion.div>
        </section>

        {/* About Us Section */}
        <section
          id="about-us"
          ref={aboutRef}
          className="py-20 bg-gray-100 dark:bg-gray-800 relative mt-10"
        >
          <div className="container mx-auto overflow-hidden pb-20">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold">About Us</h2>
              <div className="mt-4 h-1 w-24 bg-blue-600 mx-auto rounded-full"></div>
            </motion.div>

            <div className="flex flex-wrap items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className="w-full md:w-4/12 px-12 md:px-4 ml-auto mr-auto mt-12"
              >
                <h3 className="text-3xl mb-2 font-semibold leading-normal">
                  Our Mission
                </h3>
                <p className="text-lg font-light leading-relaxed mt-4 mb-4 text-gray-600 dark:text-gray-300">
                  <strong>
                    We are a group of young professionals with in-depth
                    knowledge into Cyber Security and Cyber Crimes.
                  </strong>
                </p>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  className="text-center inline-flex items-center justify-center w-20 h-20 mb-6 shadow-lg rounded-full bg-white dark:bg-gray-700"
                >
                  <Image
                    src="/author/Author.webp"
                    width={80}
                    height={80}
                    alt="Dr. Ananth Prabhu G"
                    className="rounded-full"
                  />
                </motion.div>
                <p className="text-md text-justify font-light leading-relaxed mt-4 mb-4 text-gray-600 dark:text-gray-300">
                  It all started with the penchant desire of the curator and
                  resource person Dr Ananth Prabhu G, PhD, PDF, to help the
                  young girls and women to engage with responsible browsing on
                  the internet. The idea was given a shape by building Info
                  toons to help students and women easily understand various
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
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
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
        <section
          id="stats"
          ref={statsRef}
          className="py-16 bg-white dark:bg-gray-900"
        >
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold">Our Impact</h2>
              <div className="mt-4 h-1 w-24 bg-blue-600 mx-auto rounded-full"></div>
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
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  500,000+
                </div>
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
                <div className="text-4xl font-bold text-blue-600 mb-2">70+</div>
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
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  125,000+
                </div>
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
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  3,000,000+
                </div>
                <div className="text-xl font-semibold">
                  Readers of Cyber Safe Girl
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section
          id="services"
          ref={servicesRef}
          className="py-20 bg-gray-100 dark:bg-gray-800"
        >
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold">Our Services</h2>
              <div className="mt-4 h-1 w-24 bg-blue-600 mx-auto rounded-full"></div>
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
                        boxShadow:
                          "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                      }}
                      className="bg-red-600 shadow-lg rounded-lg text-center p-8"
                    >
                      <div className="shadow-md rounded-full max-w-full w-16 mx-auto p-2 bg-white">
                        <Shield className="h-12 w-12 text-red-600" />
                      </div>
                      <p className="text-lg text-white mt-4 font-semibold">
                        Cyber Security
                      </p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      whileHover={{
                        scale: 1.05,
                        boxShadow:
                          "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                      }}
                      className="bg-gray-700 shadow-lg rounded-lg text-center p-8 mt-8"
                    >
                      <div className="shadow-md rounded-full max-w-full w-16 mx-auto p-2 bg-white">
                        <Code className="h-12 w-12 text-gray-700" />
                      </div>
                      <p className="text-lg text-white mt-4 font-semibold">
                        Digital Safety
                      </p>
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
                        boxShadow:
                          "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                      }}
                      className="bg-yellow-500 shadow-lg rounded-lg text-center p-8"
                    >
                      <div className="shadow-md rounded-full max-w-full w-16 mx-auto p-2 bg-white">
                        <FileText className="h-12 w-12 text-yellow-500" />
                      </div>
                      <p className="text-lg text-white mt-4 font-semibold">
                        E-Learning
                      </p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      whileHover={{
                        scale: 1.05,
                        boxShadow:
                          "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                      }}
                      className="bg-green-500 shadow-lg rounded-lg text-center p-8 mt-8"
                    >
                      <div className="shadow-md rounded-full max-w-full w-16 mx-auto p-2 bg-white">
                        <Shield className="h-12 w-12 text-green-500" />
                      </div>
                      <p className="text-lg text-white mt-4 font-semibold">
                        Cyber Crime Prevention
                      </p>
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
                <h3 className="text-3xl mb-2 font-semibold leading-normal">
                  Services
                </h3>
                <p className="text-lg font-light text-justify leading-relaxed mt-4 mb-4 text-gray-600 dark:text-gray-300">
                  Cyber Safe Girl is an E-Learning Program, containing 70+
                  animated infotoons, explained in detail by Dr. Ananth Prabhu
                  G.
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
                        whileHover={{
                          scale: 1.1,
                          backgroundColor: "rgba(244, 63, 94, 0.1)",
                        }}
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
        <section
          id="associates"
          ref={associatesRef}
          className="py-20 bg-white dark:bg-gray-900"
        >
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold">Our Associates</h2>
              <div className="mt-4 h-1 w-24 bg-blue-600 mx-auto rounded-full"></div>
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
                    <h4 className="text-xl font-bold text-gray-800 dark:text-white">
                      How our Associates help us?
                    </h4>
                    <p className="text-md text-justify font-light mt-2 text-gray-600 dark:text-gray-300">
                      Associates in the Cyber Safe Girl project play a crucial
                      role in promoting cybersecurity awareness, educating
                      communities on digital safety practices, and supporting
                      initiatives that empower individuals to protect themselves
                      online.
                    </p>
                  </motion.div>
                </div>
              </motion.div>

              <div className="w-full md:w-12/12 lg:w-6/12 px-4 text-center">
                <h3 className="text-3xl mb-6 font-semibold leading-normal">
                  Our Partners
                </h3>
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
                            src="/partners/govtOfKarnataka.webp"
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
                            src="/partners/ISEA.webp"
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
                            src="/partners/surePass.webp"
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
                            src="/partners/cyber-jagrithi.webp"
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
                  className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-2xl rounded-lg bg-gradient-to-r from-blue-600 to-pink-600 p-12"
                >
                  <div className="flex flex-wrap justify-center text-center">
                    <div className="w-full lg:w-8/12 px-4">
                      <h2 className="text-white text-4xl font-semibold">
                        Ready to get certified?
                      </h2>
                      <p className="text-lg text-justify leading-relaxed mt-4 mb-4 text-white opacity-90">
                        Join thousands of students who have already completed
                        the Cyber Safe Girl certification program. Learn
                        essential cybersecurity skills and protect yourself
                        online.
                      </p>
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          className="mt-6 bg-white text-blue-600 hover:bg-gray-100 transition-all duration-300"
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
                    transition={{
                      duration: 20,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "linear",
                    }}
                  >
                    <Shield className="h-40 w-40 text-white" />
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Us Section */}
        <section
          id="contact"
          ref={contactRef}
          className="py-20 bg-white dark:bg-gray-900"
        >
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl font-bold">Contact Us</h2>
              <div className="mt-4 h-1 w-24 bg-blue-600 mx-auto rounded-full"></div>
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
                  boxShadow:
                    "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                }}
                className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md text-center"
              >
                <div className="mx-auto bg-blue-100 dark:bg-blue-900 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <MapPin className="h-8 w-8 text-blue-600 dark:text-blue-300" />
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
                  boxShadow:
                    "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
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
                  boxShadow:
                    "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                }}
                className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md text-center"
              >
                <div className="mx-auto bg-green-100 dark:bg-green-900 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <Phone className="h-8 w-8 text-green-600 dark:text-green-300" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Call Us</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  +91 95356 45357
                </p>
              </motion.div>

              {/* Verify Certificate */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                whileHover={{
                  scale: 1.05,
                  boxShadow:
                    "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
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
                <h3 className="text-xl font-semibold mb-2">
                  Verify Certificate
                </h3>
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
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
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
                {/* <div className="bg-blue-600 text-white rounded-md p-1">
                  <Shield className="h-6 w-6" />
                </div> */}
                <span className="font-bold text-xl">Cyber Safe Girl</span>
              </motion.div>
              <p className="text-gray-400 mb-4">
                Empowering women and girls with cybersecurity <br />
                knowledge to stay safe online.
              </p>
              <div className="flex space-x-4">
                <motion.a
                  whileHover={{ scale: 1.2, y: -5 }}
                  href="https://www.facebook.com/educatorananth/"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
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
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
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
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
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
                {[
                  "Home",
                  "About Us",
                  "Services",
                  "Modules",
                  "Posters",
                  "Contact",
                ].map((item, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <Link
                      href={`#${
                        item === "Home"
                          ? ""
                          : item.toLowerCase().replace(" ", "-")
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToSection(
                          item === "Home"
                            ? "home"
                            : item.toLowerCase().replace(" ", "-")
                        );
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
              <h3 className="font-semibold text-lg mb-4">
                Designed and Developed By:
              </h3>
              {/* Container with overlapping effect */}
              <div className="flex items-center">
                {devs.map((dev, index) => (
                  <div
                    key={dev.name}
                    className={`group flex flex-col items-center cursor-pointer transition-transform duration-300 hover:scale-110 ${index !== 0 ? '-ml-6' : '-mr-5'}`}
                  >
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
                    <span className="mt-2 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {dev.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>
              © {new Date().getFullYear()} Cyber Safe Girl. All rights reserved.
            </p>
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
            className="fixed bottom-8 right-8 bg-blue-600 text-white p-3 rounded-full shadow-lg z-50"
            aria-label="Scroll to top"
          >
            <ArrowUp className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}