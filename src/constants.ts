export const COUNTRIES = [
  'Nepal', 
  'Poland', 'Romania', 'Croatia', 'Malta', 'Cyprus', 'Portugal', 'United Kingdom',
  'United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Oman', 'Bahrain',
  'Albania', 'Andorra', 'Armenia', 'Austria', 'Azerbaijan', 'Belarus', 'Belgium', 
  'Bosnia and Herzegovina', 'Bulgaria', 'Czech Republic', 
  'Denmark', 'Estonia', 'Finland', 'France', 'Georgia', 'Germany', 'Greece', 
  'Hungary', 'Iceland', 'Ireland', 'Italy', 'Kosovo', 'Latvia', 'Liechtenstein', 
  'Lithuania', 'Luxembourg', 'Moldova', 'Monaco', 'Montenegro', 
  'Netherlands', 'North Macedonia', 'Norway', 'San Marino', 'Serbia', 'Slovakia', 'Slovenia', 'Spain', 'Sweden', 'Switzerland', 
  'Turkey', 'Ukraine', 'Vatican City',
  'Sri Lanka', 'India', 'Pakistan', 'Bangladesh', 'Philippines'
];

export const countryToCode: Record<string, string> = {
  "Albania": "al", "Andorra": "ad", "Armenia": "am", "Austria": "at", "Azerbaijan": "az",
  "Belarus": "by", "Belgium": "be", "Bosnia and Herzegovina": "ba", "Bulgaria": "bg",
  "Croatia": "hr", "Cyprus": "cy", "Czech Republic": "cz", "Denmark": "dk",
  "Estonia": "ee", "Finland": "fi", "France": "fr", "Georgia": "ge", "Germany": "de",
  "Greece": "gr", "Hungary": "hu", "Iceland": "is", "Ireland": "ie", "Italy": "it",
  "Kosovo": "xk", "Latvia": "lv", "Liechtenstein": "li", "Lithuania": "lt",
  "Luxembourg": "lu", "Malta": "mt", "Moldova": "md", "Monaco": "mc", "Montenegro": "me",
  "Netherlands": "nl", "North Macedonia": "mk", "Norway": "no", "Poland": "pl",
  "Portugal": "pt", "Romania": "ro", "San Marino": "sm", "Serbia": "rs",
  "Slovakia": "sk", "Slovenia": "si", "Spain": "es", "Sweden": "se", "Switzerland": "ch",
  "Turkey": "tr", "Ukraine": "ua", "United Kingdom": "gb", "Vatican City": "va",
  "United Arab Emirates": "ae", "Saudi Arabia": "sa", "Qatar": "qa", "Kuwait": "kw",
  "Oman": "om", "Bahrain": "bh", "Nepal": "np", "Sri Lanka": "lk", "India": "in",
  "Pakistan": "pk", "Bangladesh": "bd", "Philippines": "ph"
};

export const JOB_POSITIONS = [
  "Warehouse Worker",
  "Forklift Operator",
  "General Laborer",
  "Construction Worker",
  "Electrician",
  "Plumber",
  "Welder",
  "Driver (Heavy/Light)",
  "Delivery Rider",
  "Security Guard",
  "Cleaner",
  "Housekeeper",
  "Waiter/Waitress",
  "Cook/Chef",
  "Kitchen Helper",
  "Sales Associate",
  "Customer Service Representative",
  "IT Support Technician",
  "Software Developer",
  "Nurse",
  "Caregiver",
  "Accountant",
  "HR Assistant",
  "Administrative Assistant",
  "Receptionist",
  "Storekeeper",
  "Packer",
  "Production Worker",
  "Mechanical Technician",
  "Civil Engineer"
];

export const JOB_CATEGORIES = [
  "Civil & Architectural",
  "Electrical & Mechanical",
  "Security",
  "Heavy Equipment & Drivers",
  "Warehouse Sector",
  "Administration",
  "Hotel & Hospitality",
  "Agriculture & Plantation",
  "Denting & Painting",
  "Supermarkets / Hypermarkets",
  "Cleaning & Housekeeping",
  "Power / Gas / Water",
  "Medical / Paramedical",
  "Manufacturing & Production",
  "Oil & Gas Sector"
];

export const CURRENCIES = ['EUR', 'NPR', 'INR', 'AED', 'USD'] as const;

export const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  NPR: 'Rs',
  INR: '₹',
  AED: 'د.إ',
  USD: '$'
};
