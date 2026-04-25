export interface Job {
  id: string;
  title: string;
  country: string;
  category: string;
  minSalary: string;
  maxSalary: string;
  currency?: string;
  experience: string;
  type: string; // Full-time, Part-time, etc.
  description: string;
  responsibilities: string[];
  requirements: string[];
  requiredDocuments: string[];
  deadline: string;
  imageUrl?: string;
  createdAt: number;
  // Fee related fields
  totalAmount?: string;
  initialPay?: string;
  payAfterWP?: string;
  payAfterVisa?: string;
  visaFeeMin?: string;
  visaFeeMax?: string;
  serviceFee?: string;
  visaFee?: string;
  ticketFee?: string;
  otherFees?: string;
  totalPackageFee?: string;
  includedPackageItems?: string[];
  excludedPackageItems?: string[];
  pricingNepal?: PackagePricing;
  pricingGulf?: PackagePricing;
  pricingEurope?: PackagePricing;
}

export interface PackagePricing {
  totalAmount?: string;
  initialPay?: string;
  payAfterWP?: string;
  payAfterVisa?: string;
  visaFeeMin?: string;
  visaFeeMax?: string;
  currency?: string;
  riskAmount?: string;
}

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  appliedCountry?: string;
  originalCountry?: string;
  targetCountry?: string;
  fullName: string;
  email: string;
  phone: string;
  passportNumber: string;
  nationality?: string;
  experience: string;
  education: string;
  coverLetter: string;
  candidateUid?: string;
  documents: {
    name: string;
    url: string;
    type: string;
  }[];
  skills?: { name: string; level: string }[];
  status: 'pending' | 'approved' | 'rejected';
  assignedBatch?: string;
  assignedCompany?: string;
  statusHistory?: {
    prevStatus: string;
    newStatus: string;
    changedAt: number;
    changedBy?: string;
  }[];
  createdAt: number;
}

export interface TeamMember {
  id: string;
  name: string;
  position: string;
  whatsapp: string;
  email?: string;
  photoUrl: string;
  bio?: string;
  order: number;
}

export interface Review {
  id: string;
  userName: string;
  userRole?: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved';
  createdAt: number;
}

export interface ContactMessage {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  message: string;
  createdAt: number;
}

export interface DiaryPost {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  author?: string;
  category?: string;
  createdAt: number;
}

export interface CandidateProfile {
  uid: string;
  fullName: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  passportNumber?: string;
  passportIssueDate?: string;
  passportExpiryDate?: string;
  passportIssueCountry?: string;
  fatherName?: string;
  motherName?: string;
  wifeName?: string;
  childrenNames?: string[];
  nationality?: string;
  experience?: string;
  education?: string;
  address?: string;
  homeCountry?: string;
  currentCountry?: string;
  dateOfBirth?: string;
  gender?: string;
  skills?: { name: string; level: string }[];
  languages?: { language: string; level: string; proficiency?: number }[];
  workHistory?: {
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
  }[];
  educationHistory?: {
    institution: string;
    degree: string;
    startDate: string;
    endDate: string;
    description: string;
  }[];
  visaStatus?: 'pending' | 'approved' | 'rejected';
  workPermitStatus?: 'pending' | 'approved' | 'rejected' | 'Review Pending';
  globalVisaStatus?: 'pending' | 'approved' | 'rejected' | 'Review Pending';
  aboutMe?: string;
  profileIntel?: string;
  documentProcessingStatus?: 'pending' | 'in-progress' | 'completed';
  joiningDate?: string;
  expectedArrivalDate?: string;
  interviewLink?: string;
  interviewDate?: string;
  interviewTime?: string;
  interviewPosition?: string;
  interviewCountry?: string;
  documents: {
    name: string;
    url: string;
    type: string;
    uploadedAt: number;
  }[];
  // Payment Tracking
  assignedCountry?: string;
  assignedBatch?: string;
  assignedCompany?: string;
  cvTemplate?: string;
  paymentStatus?: 'pending' | 'partially-paid' | 'fully-paid';
  totalAmount?: string;
  initialPay?: string;
  payAfterWP?: string;
  payAfterVisa?: string;
  paidAmount?: string;
  paymentCurrency?: 'EUR' | 'NPR' | 'INR' | 'AED' | 'USD';
  includedPackageItems?: string[];
  excludedPackageItems?: string[];
  paymentHistory?: {
    date: string;
    amount: string;
    method: string;
    receiptUrl?: string;
    note?: string;
  }[];
  createdAt: number;
  updatedAt: number;
  searchHistory?: string[];
  refundRequest?: RefundRequest;
  photoUrl?: string;
  cvPhotoStyle?: 'round' | 'square';
  jobAlerts?: JobAlert[];
}

export interface JobAlert {
  id: string;
  candidateUid?: string;
  email: string;
  country?: string;
  category?: string;
  keywords?: string;
  active: boolean;
  createdAt: number;
}

export interface RefundRequest {
  id: string;
  candidateUid: string;
  candidateName: string;
  reason: string;
  status: 'pending' | 'proposed' | 'agreed' | 'processing' | 'completed' | 'rejected';
  totalReceivedAmount: number;
  riskAmount: number;
  refundableAmount: number;
  agreedByCandidate: boolean;
  installments: {
    amount: number;
    dueDate: number;
    status: 'pending' | 'paid';
    paidAt?: number;
    note?: string;
  }[];
  createdAt: number;
  updatedAt: number;
}

export interface SystemSettings {
  activeConfigId?: string;
  apiConfigs: APIConfig[];
  updatedAt?: number;
}

export interface APIConfig {
  id: string;
  provider: 'gemini' | 'openai' | 'custom';
  apiKey: string;
  endpoint?: string;
  modelName?: string;
  label: string;
  isEnabled: boolean;
  createdAt: number;
}

export interface VisaSuccessStory {
  id: string;
  candidateName: string;
  candidatePhotoUrl: string;
  visaImageUrl: string;
  country: string;
  position: string;
  story?: string;
  createdAt: number;
  order: number;
}

export interface ClientPartner {
  id: string;
  companyName: string;
  country: string;
  logoUrl?: string;
  review?: string;
  reviewerName?: string;
  reviewerPosition?: string;
  storyNote?: string;
  rating?: number;
  createdAt: number;
  order: number;
}

export interface SiteContent {
  heroTagline: string;
  heroTitle?: string;
  heroDescription?: string;
  heroCtaText?: string;
  heroSecondaryCtaText?: string;
  aboutUs: string;
  mission?: string;
  vision?: string;
  values?: { title: string; description: string }[];
  coreStrengths?: string[];
  branchOffices?: { location: string; address: string; phone: string; email: string }[];
  companyProfileUrl?: string;
  logoUrl?: string;
  footerLogoUrl?: string;
  faviconUrl?: string;
  heroImageUrl?: string;
  heroImageUrls?: string[];
  aboutImageUrl?: string;
  servicesImageUrl?: string;
  whyChooseUsImageUrl?: string;
  guidingPrinciplesImageUrl?: string;
  socialLinks?: {
    facebook?: string;
    whatsapp?: string;
    linkedin?: string;
    tiktok?: string;
    instagram?: string;
    youtube?: string;
  };
  services: {
    title: string;
    description: string;
    icon?: string;
    imageUrl?: string;
  }[];
  whyChooseUs: {
    title: string;
    description: string;
    points: { title: string; description: string }[];
  };
  stats: {
    label: string;
    value: string;
  }[];
  countries: string[];
  jobPositions?: string[];
  jobCategories?: string[];
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  whatsappNumber?: string;
  navHome?: string;
  navJobs?: string;
  navAbout?: string;
  navContact?: string;
  navDiary?: string;
  ctaTitle?: string;
  ctaDescription?: string;
  ctaButtonText?: string;
  countriesTitle?: string;
  countriesTagline?: string;
  countriesDescription?: string;
  livingSection?: {
    title: string;
    description: string;
    imageUrl?: string;
    features: { title: string; description: string; icon?: string }[];
  };
  ourProcess?: {
    title: string;
    description: string;
    steps: { title: string; description: string }[];
  };
  faqs?: { question: string; answer: string }[];
  partners?: { name: string; logoUrl: string }[];
  // Visibility Controls
  showStats?: boolean;
  showServices?: boolean;
  showWhyChooseUs?: boolean;
  showCountries?: boolean;
  showProcess?: boolean;
  showFaqs?: boolean;
  showPartners?: boolean;
  showSuccessStories?: boolean;
  showDiary?: boolean;
  showLivingSection?: boolean;
  autoHeroJobs?: boolean;
  officeMapUrl?: string;
  officeImageUrl?: string;
  companyStoryTitle?: string;
  companyStoryTagline?: string;
  companyStoryDescription?: string;
  globalStandardsTagline?: string;
  globalStandardsTitle?: string;
  globalStandardsDescription?: string;
  globalStandardsImageUrl?: string;
  coreStrengthsTitle?: string;
  coreStrengthsImageUrl?: string;
  professionalHrSolutionsTitle?: string;
  professionalHrSolutionsDescription?: string;
  professionalHrSolutionsImageUrl?: string;
  professionalHrSolutionsBadge?: string;
  professionalEdgeTitle?: string;
  professionalEdgeSubtitle?: string;
  professionalEdgeDescription?: string;
  servicesTagline?: string;
  servicesTitle?: string;
  servicesSubtitle?: string;
  ourProcessTitle?: string;
  jobsTagline?: string;
  jobsTitle?: string;
  jobsSubtitle?: string;
  successStoriesTagline?: string;
  successStoriesTitle?: string;
  successStoriesSubtitle?: string;
  livingSectionTitle?: string;
  assistants?: AIAssistant[];
  // Styling Options
  styles?: {
    heroTagline?: { color?: string; font?: string };
    heroTitle?: { color?: string; font?: string };
    heroDescription?: { color?: string; font?: string };
    heroPrimaryCta?: { bgColor?: string; textColor?: string; font?: string };
    heroSecondaryCta?: { bgColor?: string; textColor?: string; font?: string };
    bottomCta?: { 
      titleColor?: string; 
      descriptionColor?: string; 
      buttonBgColor?: string; 
      buttonTextColor?: string;
      font?: string;
    };
  };
}

export interface AIAssistant {
  id: string;
  name: string;
  role: string;
  photoUrl?: string;
  systemPrompt: string;
  icon?: string;
  color?: string;
  isActive: boolean;
}
