import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "./firebase";
import { Toaster } from "sonner";
import { doc, getDoc, setDoc, onSnapshot, collection, getDocs, addDoc } from "firebase/firestore";
import { SiteContent } from "./types";
import { getDirectImageUrl } from "./lib/utils";

import ScrollToTop from "./components/ScrollToTop";
import ScrollToAnchor from "./components/ScrollToAnchor";

// Pages
import HomePage from "./pages/HomePage";
import JobsPage from "./pages/JobsPage";
import JobDetailsPage from "./pages/JobDetailsPage";
import AdminDashboard from "./pages/AdminDashboard";
import LoginPage from "./pages/LoginPage";
import CandidateDashboard from "./pages/CandidateDashboard";
import CandidateProfilePage from "./pages/CandidateProfilePage";
import DiaryPage from "./pages/DiaryPage";
import DiaryDetailsPage from "./pages/DiaryDetailsPage";
import AboutPage from "./pages/AboutPage";
import OfficePage from "./pages/OfficePage";
import CandidateInterviewJoin from "./pages/interview/CandidateInterviewJoin";
import EmployerInterviewView from "./pages/interview/EmployerInterviewView";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import RefundPolicy from "./pages/RefundPolicy";

// Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import SmartAssistant from "./components/SmartAssistant";
import MobileBottomNav from "./components/MobileBottomNav";
import { useLocation } from "react-router-dom";

function AppLayout({ user, isAdmin }: { user: User | null; isAdmin: boolean }) {
  const location = useLocation();
  const isHideLayout =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/interview") ||
    location.pathname.startsWith("/employer/interview");
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      {!isHideLayout && <Navbar user={user} />}
      <main className="flex-grow pb-32 md:pb-0">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/:id" element={<JobDetailsPage />} />
          <Route path="/diary" element={<DiaryPage />} />
          <Route path="/diary/:id" element={<DiaryDetailsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/office" element={<OfficePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin/login" element={<Navigate to="/login" />} />
          <Route path="/candidate/login" element={<Navigate to="/login" />} />
          <Route
            path="/admin/*"
            element={
              user && isAdmin ? (
                <AdminDashboard />
              ) : (
                <Navigate
                  to="/login"
                  state={{ from: { pathname: "/admin" } }}
                />
              )
            }
          />
          <Route
            path="/candidate/dashboard"
            element={
              user ? (
                <CandidateDashboard />
              ) : (
                <Navigate
                  to="/login"
                  state={{ from: { pathname: "/candidate/dashboard" } }}
                />
              )
            }
          />
          <Route
            path="/candidate/profile/:uid"
            element={<CandidateProfilePage />}
          />
          <Route path="/interview/join/:code" element={<CandidateInterviewJoin />} />
          <Route path="/employer/interview/:id" element={<EmployerInterviewView />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-conditions" element={<TermsConditions />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
        </Routes>
      </main>
      {!isHideLayout && <Footer />}
      {!isHideLayout && (
        <SmartAssistant
          externalOpen={isChatOpen}
          onOpen={() => setIsChatOpen(true)}
          onClose={() => setIsChatOpen(false)}
        />
      )}
      {!isHideLayout && (
        <MobileBottomNav
          isAdmin={isAdmin}
          onChatClick={() => setIsChatOpen(!isChatOpen)}
        />
      )}
    </div>
  );
}

import { ThemeProvider } from "./context/ThemeContext";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // Check default admin email
        if (currentUser.email === "workineuhr@gmail.com") {
          setIsAdmin(true);
          // Ensure they exist in the users collection with admin role
          try {
            const userRef = doc(db, "users", currentUser.uid);
            const userDoc = await getDoc(userRef);
            if (!userDoc.exists() || userDoc.data().role !== "admin") {
              await setDoc(
                userRef,
                {
                  email: currentUser.email,
                  role: "admin",
                  updatedAt: new Date(),
                },
                { merge: true },
              );
            }
            // TEMPORARY SEED CONTENT
            try {
              const siteContentRef = doc(db, "settings", "siteContent");
              const scSnap = await getDoc(siteContentRef);
              if (scSnap.exists()) {
                const currentData = scSnap.data();
                const updates: any = {};

                // FAQ Fix
                if (!currentData.faqs || currentData.faqs.length === 0 || currentData.faqs[0].answer === "") {
                  updates.faqs = [
                      {
                        question: "Which countries do you provide job opportunities in?",
                        answer: "We provide excellent career opportunities across Europe, including prime destinations like Slovenia, Croatia, Romania, Lithuania, and several other EU countries. Our network is constantly growing to offer you the best possible placements."
                      },
                      {
                        question: "What types of jobs and sectors are currently available?",
                        answer: "We offer a diverse range of roles to match different skill levels! You can find secure and rewarding jobs in factories, warehousing, construction, hospitality, logistics, and professional driving sectors."
                      },
                      {
                        question: "Do I need prior experience to apply for these positions?",
                        answer: "While basic experience is definitely a plus and preferred by some employers, it is not strictly mandatory for many of our entry-level roles. Positions in production and warehousing often include comprehensive on-the-job training, so your dedication and willingness to work are what matter most!"
                      },
                      {
                        question: "How long does the overall recruitment and visa processing take?",
                        answer: "The timeline can vary depending on the destination country and the specific job category. However, for most of our European roles, the complete process from selection to visa processing typically takes between 3 to 6 months. We guide you every step of the way!"
                      },
                      {
                        question: "What documents do I need to begin the registration process?",
                        answer: "To get started, you will need a valid passport, an up-to-date CV (the Europass format is highly preferred), relevant education certificates, and any experience letters you might have from previous employers. We can help you double-check your documents during the initial screening."
                      }
                  ];
                }

                if (!currentData.countriesTitle || currentData.countriesTitle === "") {
                   updates.countriesTitle = "Destinations We Cover";
                   updates.countriesTagline = "Where talent meets opportunity";
                   if (!currentData.countries || currentData.countries.length === 0) {
                     updates.countries = ["Slovenia", "Croatia", "Romania", "Lithuania", "Poland", "United Arab Emirates"];
                   }
                }

                if (!currentData.services || currentData.services.length === 0) {
                   updates.servicesTitle = "Professional Services";
                   updates.servicesTagline = "Our Expertise";
                   updates.services = [
                     { title: "Executive Search", description: "Targeted headhunting to find unparalleled leadership and niche-skilled candidates tailored to your corporate strategy.", imageUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a" },
                     { title: "Mass Recruitment", description: "Scalable volume hiring solutions tailored to the construction, hospitality, manufacturing, and retail sectors.", imageUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d" },
                     { title: "Visa & Immigration Support", description: "Comprehensive assistance with documentation, work permits, and visa processing to ensure frictionless deployment.", imageUrl: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7" }
                   ];
                }

                if (!currentData.ourProcessTitle || currentData.ourProcessTitle === "") {
                   updates.ourProcessTitle = "Our Recruitment Process";
                   updates.ourProcess = {
                     title: "Simplifying Your Journey to Europe",
                     description: "A meticulously crafted pathway designed to match the right talent with the right opportunity flawlessly.",
                     steps: [
                       { title: "Application & Screening", description: "Submit your profile and consult with our experts to find the right fit." },
                       { title: "Interview & Selection", description: "Participate in employer interviews and skill assessments." },
                       { title: "Documentation & Visa", description: "We handle the paperwork, work permits, and visa applications." },
                       { title: "Pre-Departure & Travel", description: "Briefing, ticketing, and safe travel arrangements to your destination." }
                     ]
                   };
                }

                if (!currentData.professionalHrSolutionsTitle || currentData.professionalHrSolutionsTitle === "") {
                   updates.professionalHrSolutionsTitle = "Professional HR Solutions";
                   updates.professionalHrSolutionsDescription = "Partner with us to gain a strategic workforce advantage. We offer comprehensive HR solutions taking care of the entire employee lifecycle—from sourcing and relocation to onboarding strategy.";
                   updates.professionalHrSolutionsBadge = "Elite HR Consultancy";
                }

                if (!currentData.coreStrengthsTitle || currentData.coreStrengthsTitle === "") {
                   updates.coreStrengthsTitle = "Our Core Strengths";
                   updates.coreStrengths = [
                      "Ethical & Transparent Recruitment",
                      "Vast European Employer Network",
                      "End-to-end Documentation Support",
                      "Industry-Specific Skill Matching",
                      "Post-Arrival Candidate Care"
                   ];
                }

                if (!currentData.professionalEdgeTitle || currentData.professionalEdgeTitle === "") {
                   updates.professionalEdgeTitle = "The Professional Edge";
                   updates.professionalEdgeSubtitle = "Why we stand out";
                   updates.professionalEdgeDescription = "Our seasoned team of recruitment consultants brings decades of combined experience, offering deep insights into market trends and the foresight necessary to navigate complex global hiring landscapes.";
                }

                if (!currentData.whyChooseUs || !currentData.whyChooseUs.title || currentData.whyChooseUs.title === "") {
                   updates.whyChooseUs = {
                     title: "Agency Advantages",
                     description: "We go beyond just filling vacancies. We ensure every placement aligns perfectly with both the organization's culture and the candidate's career goals.",
                     points: [
                       { title: "Proven Track Record", description: "Thousands of successful deployments across Europe with high satisfaction rates." },
                       { title: "Zero Hassle Process", description: "From initial screening to full logistical deployment, we handle all the heavy lifting." },
                       { title: "Ethical Practices", description: "We adhere strictly to international labor laws and promote fair, transparent processes." }
                     ]
                   };
                }

                if (Object.keys(updates).length > 0) {
                   await setDoc(siteContentRef, updates, { merge: true });
                   console.log("Auto-seeded requested sections!", updates);
                }
                
                // TEMPORARY JOB SEEDING
                try {
                  const jobsCollection = collection(db, "jobs");
                  const jobsSnap = await getDocs(jobsCollection);
                  if (jobsSnap.size < 6) { // If missing our trending seeded jobs
                    console.log("Seeding trending jobs...");
                    const newJobs = [
                      {
                        title: "Registered General Nurse",
                        company: "Prime Healthcare",
                        location: "Berlin, Germany",
                        country: "Germany",
                        type: "Full-time",
                        category: "Healthcare",
                        minSalary: "€3,500",
                        maxSalary: "€4,500",
                        experience: "3-5 Years",
                        description: "We are seeking compassionate and skilled Registered Nurses to join elite hospitals in Germany. You will provide excellent patient care and work alongside a dedicated international medical team.",
                        requirements: ["Nursing Degree", "Valid License", "B1/B2 German Language Proficiency", "Minimum 3 years experience"],
                        responsibilities: ["Patient care", "Administering medication", "Updating patient records", "Assisting in procedures"],
                        benefits: ["Accommodation provided", "Language classes", "Health Insurance", "Flight Tickets"],
                        status: "open",
                        deadline: "2026-12-31",
                        createdAt: Date.now()
                      },
                      {
                        title: "Warehouse Specialist",
                        company: "Logistics Europe Hub",
                        location: "Munich, Germany",
                        country: "Germany",
                        type: "Full-time",
                        category: "Logistics",
                        minSalary: "€2,200",
                        maxSalary: "€2,800",
                        experience: "1-3 Years",
                        description: "Join one of the largest distribution centers in Germany. We need efficient warehouse workers to manage inventory, package goods, and handle logistics.",
                        requirements: ["Physical fitness", "Ability to work shifts", "Basic English or German", "Prior warehouse experience"],
                        responsibilities: ["Picking and packing", "Inventory management", "Operating forklifts (optional)", "Quality check"],
                        benefits: ["Subsidized meals", "Performance bonuses", "Overtime pay", "Health Insurance"],
                        status: "open",
                        deadline: "2026-12-31",
                        createdAt: Date.now() + 1
                      },
                      {
                        title: "Full Stack Software Engineer",
                        company: "TechNova Solutions",
                        location: "Bucharest, Romania",
                        country: "Romania",
                        type: "Full-time",
                        category: "IT",
                        minSalary: "€4,000",
                        maxSalary: "€6,000",
                        experience: "3-5 Years",
                        description: "Exciting opportunity for an IT professional to build scalable web applications. You will work with modern frameworks including React, Node.js, and Cloud services.",
                        requirements: ["Computer Science Degree", "3+ years React/Node", "English fluency", "Problem-solving skills"],
                        responsibilities: ["Developing web applications", "Code reviews", "Architecture design", "API integration"],
                        benefits: ["Remote options", "Health Insurance", "Tech conference budget", "Relocation package"],
                        status: "open",
                        deadline: "2026-12-31",
                        createdAt: Date.now() + 2
                      },
                      {
                        title: "Luxury Hotel Manager",
                        company: "Grand Resorts Europe",
                        location: "Split, Croatia",
                        country: "Croatia",
                        type: "Full-time",
                        category: "Hospitality",
                        minSalary: "€3,000",
                        maxSalary: "€4,500",
                        experience: "5+ Years",
                        description: "A premium resort in Croatia is looking for an experienced Hotel Manager to oversee operations, ensure exceptional guest experiences, and manage staff.",
                        requirements: ["Hospitality Degree", "5+ years management experience", "Fluent English", "Financial acumen"],
                        responsibilities: ["Staff management", "Budgeting", "Guest relations", "Quality assurance"],
                        benefits: ["Housing allowance", "Yearly bonuses", "Health Insurance", "Travel perks"],
                        status: "open",
                        deadline: "2026-12-31",
                        createdAt: Date.now() + 3
                      },
                      {
                        title: "Heavy Truck Driver",
                        company: "EuroTrans Logistics",
                        location: "Warsaw, Poland",
                        country: "Poland",
                        type: "Full-time",
                        category: "Logistics",
                        minSalary: "€2,500",
                        maxSalary: "€3,200",
                        experience: "3-5 Years",
                        description: "We are hiring experienced Heavy Truck Drivers for international routes across Europe. Ensure safe and timely delivery of goods while adhering to EU regulations.",
                        requirements: ["CE Driving License", "Code 95", "Clean driving record", "Basic English"],
                        responsibilities: ["Driving heavy trucks", "Route planning", "Vehicle inspection", "Cargo security check"],
                        benefits: ["Performance bonuses", "Health Insurance", "Modern fleet", "Provided uniform"],
                        status: "open",
                        deadline: "2026-12-31",
                        createdAt: Date.now() + 4
                      }
                    ];
                    
                    for (const job of newJobs) {
                      await addDoc(jobsCollection, job);
                    }
                    console.log("Trending jobs seeded!");
                  }
                } catch (e) {
                  console.error("Job seeding failed", e);
                }
              }
            } catch (e) {
              console.error("Auto-seeding sections failed", e);
            }
          } catch (e) {
            console.error("Auto-provisioning admin failed", e);
          }
        } else {
          // Check role in Firestore & check system settings for authorized recruiter email
          try {
            const systemSnap = await getDoc(doc(db, "settings", "system"));
            const systemData = systemSnap.exists() ? systemSnap.data() : null;
            const authorizedEmails = systemData?.authorizedEmails || [];
            const isEmailAuthorized = authorizedEmails.some(
              (email: string) => email.toLowerCase() === currentUser.email?.toLowerCase()
            );

            const userRef = doc(db, "users", currentUser.uid);
            const userDoc = await getDoc(userRef);

            if (isEmailAuthorized) {
              setIsAdmin(true);
              if (!userDoc.exists() || userDoc.data().role !== "admin") {
                await setDoc(userRef, { email: currentUser.email, role: "admin", updatedAt: new Date() }, { merge: true });
              }
            } else {
              // If not authorized but was previously admin in users table, demote them
              if (userDoc.exists() && userDoc.data().role === "admin") {
                await setDoc(userRef, { role: "candidate", updatedAt: new Date() }, { merge: true });
                setIsAdmin(false);
              } else {
                setIsAdmin(userDoc.exists() && userDoc.data().role === "admin");
              }
            }
          } catch (error) {
            console.error("Error checking admin status:", error);
            setIsAdmin(false);
          }
        }
      } else {
        setIsAdmin(false);
      }

      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Listen for site content changes to update favicon
    const unsubscribe = onSnapshot(
      doc(db, "settings", "siteContent"),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as SiteContent;
          if (data.faviconUrl) {
            let link: HTMLLinkElement | null =
              document.querySelector("link[rel~='icon']");
            if (!link) {
              link = document.createElement("link");
              link.rel = "icon";
              document.getElementsByTagName("head")[0].appendChild(link);
            }
            link.href = getDirectImageUrl(data.faviconUrl);
          }
        }
      },
    );
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#121212]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <Router>
        <ScrollToTop />
        <ScrollToAnchor />
        <AppLayout user={user} isAdmin={isAdmin} />
        <Toaster position="top-right" richColors />
      </Router>
    </ThemeProvider>
  );
}
