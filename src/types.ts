export interface Job {
  id: string;
  title: string;
  country: string;
  category: string;
  salary: string;
  experience: string;
  type: string; // Full-time, Part-time, etc.
  description: string;
  responsibilities: string[];
  requirements: string[];
  requiredDocuments: string[];
  deadline: string;
  createdAt: number;
}

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  fullName: string;
  email: string;
  phone: string;
  passportNumber: string;
  experience: string;
  education: string;
  coverLetter: string;
  documents: {
    name: string;
    url: string;
    type: string;
  }[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
}

export interface SiteContent {
  heroTagline: string;
  aboutUs: string;
  services: {
    title: string;
    description: string;
  }[];
  countries: string[];
}
