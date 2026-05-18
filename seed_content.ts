import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import fs from "fs";

const configPath = "./firebase-applet-config.json";
if (!fs.existsSync(configPath)) {
  console.error("Firebase config not found.");
  process.exit(1);
}

const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const seedData = async () => {
  try {
    const docRef = doc(db, "settings", "siteContent");
    const docSnap = await getDoc(docRef);
    let currentData: Record<string, any> = {};
    if (docSnap.exists()) {
      currentData = docSnap.data();
    }

    const newData = {
      ...currentData,
      heroTitle: currentData.heroTitle || "Your Premier Bridge to Global Career Excellence",
      heroTagline: currentData.heroTagline || "Ethical Recruitment • Global Reach • Professional Success",
      heroDescription: currentData.heroDescription || "Specializing in sourcing and placing skilled talent across Europe, the Middle East, and worldwide. With thousands of successful placements, we empower your professional journey matching talent with opportunity.",
      heroCtaText: currentData.heroCtaText || "Apply for Jobs",
      heroSecondaryCtaText: currentData.heroSecondaryCtaText || "Consult with Us",
      aboutUs: currentData.aboutUs || "We are a trusted recruitment agency specialized in connecting highly skilled, semi-skilled, and unskilled talent with premier employers around the globe. Our process ensures ethical hiring, compliance with all legal requirements, and sustainable career paths for everyone involved.",
      mission: currentData.mission || "To redefine recruitment through transparency, ethical practices, and seamless placement that empowers candidates and enriches organizations worldwide.",
      vision: currentData.vision || "To be the globally preferred talent acquisition partner recognized for trust, agility, and uncompromising quality in matching the right people with the right organizations.",
      values: currentData.values?.length ? currentData.values : [
        { title: "Integrity", description: "Uncompromising ethical standards in every step of recruitment." },
        { title: "Excellence", description: "Delivering top-tier candidates efficiently and transparently." },
        { title: "Empathy", description: "Supporting candidates with understanding and comprehensive care." },
        { title: "Reliability", description: "Building long-term partnerships through consistent delivery." }
      ],
      coreStrengths: currentData.coreStrengths?.length ? currentData.coreStrengths : [
        "Rapid Deployment Models",
        "Rigorous Background Checks",
        "Expertise in Visa & Compliance",
        "Deep Industry Networks",
        "End-to-end Assistance",
        "Scalable Workforce Solutions"
      ],
      coreStrengthsTitle: currentData.coreStrengthsTitle || "Our Core Strengths",
      services: currentData.services?.length ? currentData.services : [
        {
          title: "Executive Search",
          description: "Targeted headhunting to find unparalleled leadership and niche-skilled candidates tailored to your corporate strategy.",
          icon: "Search",
          imageUrl: ""
        },
        {
          title: "Mass Recruitment",
          description: "Scalable volume hiring solutions tailored to the construction, hospitality, manufacturing, and retail sectors.",
          icon: "Users",
          imageUrl: ""
        },
        {
          title: "Visa & Immigration Support",
          description: "Comprehensive assistance with documentation, work permits, and visa processing to ensure frictionless deployment.",
          icon: "Globe",
          imageUrl: ""
        },
        {
          title: "Pre-departure Training",
          description: "Equipping candidates with cultural, ethical, and professional orientation to integrate smoothly into their new roles.",
          icon: "BookOpen",
          imageUrl: ""
        }
      ],
      servicesTagline: currentData.servicesTagline || "Our Expertise",
      servicesTitle: currentData.servicesTitle || "Comprehensive HR Solutions",
      servicesSubtitle: currentData.servicesSubtitle || "Tailored recruitment models designed to bridge the gap between global employers and elite talent.",
      whyChooseUs: currentData.whyChooseUs?.title ? currentData.whyChooseUs : {
        title: "Why Partner With Us?",
        description: "We go beyond just filling vacancies. We ensure every placement aligns perfectly with both the organization's culture and the candidate's career goals.",
        points: [
          { title: "Global Reach, Local Expertise", description: "Our expansive network spans multiple continents, providing unparalleled access to a diverse pool of talent." },
          { title: "Zero Hassle Process", description: "From initial screening to full logistical deployment, we handle all the heavy lifting." },
          { title: "Ethical Recruitment", description: "We adhere strictly to international labor laws and promote fare, transparent practices." }
        ]
      },
      stats: currentData.stats?.length ? currentData.stats : [
        { label: "Successful Placements", value: "2500+" },
        { label: "Partner Companies", value: "150+" },
        { label: "Countries Served", value: "20+" },
        { label: "Years of Excellence", value: "12+" }
      ],
      countries: currentData.countries?.length ? currentData.countries : [
        "United Arab Emirates", "Saudi Arabia", "Qatar", "Romania", "Poland", "Croatia", "Latvia", "Lithuania", "Serbia", "Portugal"
      ],
      jobPositions: currentData.jobPositions?.length ? currentData.jobPositions : [
        "Construction Worker", "Civil Engineer", "Heavy Equipment Operator", "Registered Nurse", "Software Developer", "Hotel Manager", "Chef", "Security Guard", "Electrician", "Plumber"
      ],
      jobCategories: currentData.jobCategories?.length ? currentData.jobCategories : [
        "Construction & Engineering", "Healthcare", "Hospitality & Tourism", "Information Technology", "Manufacturing", "Security", "Logistics & Transport"
      ],
      contactEmail: currentData.contactEmail || "info@workineu.com",
      contactPhone: currentData.contactPhone || "+971 50 123 4567",
      contactAddress: currentData.contactAddress || "Global Business Tower, Office 402, UAE",
      whatsappNumber: currentData.whatsappNumber || "971501234567",
      navHome: currentData.navHome || "Home",
      navJobs: currentData.navJobs || "Jobs",
      navAbout: currentData.navAbout || "About Us",
      navContact: currentData.navContact || "Contact",
      navDiary: currentData.navDiary || "Diary / Stories",
      ctaTitle: currentData.ctaTitle || "Ready to Take the Next Step?",
      ctaDescription: currentData.ctaDescription || "Whether you are a professional seeking global opportunities or a company looking for outstanding talent, we are here to help.",
      ctaButtonText: currentData.ctaButtonText || "Get in Touch Today",
      countriesTitle: currentData.countriesTitle || "Destinations We Cover",
      countriesTagline: currentData.countriesTagline || "Where talent meets opportunity",
      livingSectionTitle: currentData.livingSectionTitle || "Your Journey, Supported Every Step of the Way",
      livingSection: currentData.livingSection?.title ? currentData.livingSection : {
        title: "Relocation Made Easy",
        description: "We understand that relocating for a job is a monumental step. That's why we provide full-scale support, taking the stress out of your move.",
        features: [
          { title: "Accommodation Sourcing", description: "Safe and convenient housing arrangements established before your arrival." },
          { title: "Cultural Orientation", description: "Comprehensive sessions to familiarize you with the local culture and workspace." },
          { title: "On-ground Support", description: "Dedicated counselors available post-deployment to ensure your well-being." },
          { title: "Financial Guidance", description: "Assistance with banking, local taxes, and initial budget planning." }
        ]
      },
      ourProcessTitle: currentData.ourProcessTitle || "How We Work",
      ourProcess: currentData.ourProcess?.title ? currentData.ourProcess : {
        title: "Streamlined For Success",
        description: "A meticulously crafted pathway designed to match the right talent with the right opportunity flawlessly.",
        steps: [
          { title: "Requirement Analysis", description: "We consult with employers to deeply understand their specific workforce needs, culture, and timelines." },
          { title: "Talent Discovery", description: "Leveraging our vast database and global partners to source meticulously vetted candidates." },
          { title: "Rigorous Screening", description: "Conducting multi-level interviews, background verifications, and medical tests." },
          { title: "Visa & Logistics", description: "Managing the complexities of immigration, ticketing, and pre-departure briefings seamlessly." }
        ]
      },
      faqs: currentData.faqs?.length ? currentData.faqs : [
        { question: "How long does the recruitment process typically take?", answer: "The timeline depends on the target country and visa regulations, but it generally takes between 4 to 8 weeks from final selection to deployment." },
        { question: "Do you charge candidates for placement?", answer: "We strictly follow an ethical recruitment policy in alignment with the employer-pays model where applicable, keeping transparency at the forefront." },
        { question: "What sectors do you specialize in?", answer: "We cover multiple sectors including Healthcare, Hospitality, Construction, Logistics, and Information Technology across Europe and the Middle East." },
        { question: "Do you provide post-deployment support?", answer: "Yes, we maintain communication with both employers and candidates post-deployment to ensure smooth integration and satisfaction." }
      ],
      partners: currentData.partners?.length ? currentData.partners : [
        { name: "Global Construction Corp", logoUrl: "" },
        { name: "Euro Hospitality Group", logoUrl: "" },
        { name: "Logistics Pro LLC", logoUrl: "" }
      ],
      companyStoryTitle: currentData.companyStoryTitle || "A Decade of Excellence",
      companyStoryTagline: currentData.companyStoryTagline || "Our Legacy",
      companyStoryDescription: currentData.companyStoryDescription || "Founded with a vision to bridge the gap between burgeoning global industries and unparalleled talent, our agency has grown into a beacon of ethical recruitment. Over the years, we've transformed thousands of lives while helping businesses across the UAE and Europe scale with the right workforce.",
      globalStandardsTagline: currentData.globalStandardsTagline || "Uncompromising Quality",
      globalStandardsTitle: currentData.globalStandardsTitle || "Committed to World-Class Standards",
      globalStandardsDescription: currentData.globalStandardsDescription || "We leave no stone unturned when it comes to compliance and excellence. Our stringent screening processes and adherence to international labor standards ensure that every placement is legally sound, ethically responsible, and mutually beneficial.",
      professionalHrSolutionsTitle: currentData.professionalHrSolutionsTitle || "Elite HR Consulting",
      professionalHrSolutionsDescription: currentData.professionalHrSolutionsDescription || "Partner with us to gain a strategic workforce advantage. We offer comprehensive HR solutions taking care of the entire employee lifecycle—from sourcing and relocation to onboarding strategy.",
      professionalHrSolutionsBadge: currentData.professionalHrSolutionsBadge || "Industry Leaders",
      professionalEdgeTitle: currentData.professionalEdgeTitle || "The Professional Edge",
      professionalEdgeSubtitle: currentData.professionalEdgeSubtitle || "Empowering Your Corporate Vision",
      professionalEdgeDescription: currentData.professionalEdgeDescription || "Our seasoned team of recruitment consultants brings decades of combined experience, offering deep insights into market trends and the foresight necessary to navigate complex global hiring landscapes.",
      jobsTagline: currentData.jobsTagline || "Career Opportunities",
      jobsTitle: currentData.jobsTitle || "Explore Your Potential",
      successStoriesTagline: currentData.successStoriesTagline || "Triumphs",
      successStoriesTitle: currentData.successStoriesTitle || "Inspiring Success Journeys",
      // visibility flags enabled by default to show this content
      showStats: currentData.showStats ?? true,
      showServices: currentData.showServices ?? true,
      showWhyChooseUs: currentData.showWhyChooseUs ?? true,
      showCountries: currentData.showCountries ?? true,
      showProcess: currentData.showProcess ?? true,
      showFaqs: currentData.showFaqs ?? true,
      showPartners: currentData.showPartners ?? true,
      showSuccessStories: currentData.showSuccessStories ?? true,
      showDiary: currentData.showDiary ?? true,
      showLivingSection: currentData.showLivingSection ?? true,
    };

    await setDoc(docRef, newData);
    console.log("Successfully seeded site content!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding content:", error);
    process.exit(1);
  }
};

seedData();
