import React, { useState, useEffect } from 'react';
import { 
  Save,
  Plus, 
  Trash2, 
  Loader2, 
  Database, 
  Image as ImageIcon, 
  TrendingUp, 
  Info, 
  CheckCircle2, 
  Briefcase,
  Upload,
  ShieldCheck,
  FileText,
  Target,
  HelpCircle,
  LayoutGrid,
  Home,
  Users2,
  Building2,
  Bot,
  Zap,
  Globe,
  Phone,
  MapPin
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { SiteContent } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const COUNTRIES = [
  'Albania', 'Andorra', 'Armenia', 'Austria', 'Azerbaijan', 'Belarus', 'Belgium', 
  'Bosnia and Herzegovina', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic', 
  'Denmark', 'Estonia', 'Finland', 'France', 'Georgia', 'Germany', 'Greece', 
  'Hungary', 'Iceland', 'Ireland', 'Italy', 'Kosovo', 'Latvia', 'Liechtenstein', 
  'Lithuania', 'Luxembourg', 'Malta', 'Moldova', 'Monaco', 'Montenegro', 
  'Netherlands', 'North Macedonia', 'Norway', 'Poland', 'Portugal', 'Romania', 
  'San Marino', 'Serbia', 'Slovakia', 'Slovenia', 'Spain', 'Sweden', 'Switzerland', 
  'Turkey', 'Ukraine', 'United Kingdom', 'Vatican City',
  'United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Oman', 'Bahrain'
];
const JOB_POSITIONS = ['Construction Worker', 'Electrician', 'Plumber', 'Welder', 'Driver', 'Warehouse Worker', 'Cleaner', 'Waiter/Waitress', 'Cook', 'Security Guard'];
const JOB_CATEGORIES = ['Construction', 'Hospitality', 'Logistics', 'Manufacturing', 'Healthcare', 'Agriculture', 'IT & Tech'];

const FONT_OPTIONS = [
  { id: 'sans', label: 'Inter (Professional Sans)' },
  { id: 'space', label: 'Space Grotesk (Modern/Bold)' },
  { id: 'outfit', label: 'Outfit (Clean/Modern)' },
  { id: 'serif', label: 'Playfair Display (Elegant Serif)' },
  { id: 'mono', label: 'JetBrains Mono (Technical)' },
];

const COLOR_OPTIONS = [
  { id: 'teal', label: 'Brand Teal (#2AB9B0)', class: 'bg-brand-teal' },
  { id: 'gold', label: 'Brand Gold (#C5A059)', class: 'bg-brand-gold' },
  { id: 'rose', label: 'Brand Rose (#fb7185)', class: 'bg-brand-rose' },
  { id: 'blue', label: 'Brand Blue (#0F172A)', class: 'bg-brand-blue' },
  { id: 'white', label: 'White (#FFFFFF)', class: 'bg-white border' },
  { id: 'slate', label: 'Slate/Neutral', class: 'bg-slate-900' },
];

const CharacterCounter = ({ current, max }: { current: number; max: number }) => (
  <div className={cn(
    "text-[10px] font-bold mt-1 text-right",
    current > max ? "text-red-500" : "text-gray-400"
  )}>
    {current}/{max}
  </div>
);

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('URL copied to clipboard');
  };
  return (
    <button 
      onClick={handleCopy}
      className="p-2 text-gray-400 hover:text-brand-blue transition-colors"
      title="Copy URL"
    >
      {copied ? <CheckCircle2 size={14} className="text-green-500" /> : <Save size={14} className="rotate-90" />}
    </button>
  );
};

const SectionHeader = ({ title, icon: Icon, description, onToggle, isVisible, onAdd }: { 
  title: string; 
  icon: any; 
  description?: string; 
  onToggle?: () => void;
  isVisible?: boolean;
  onAdd?: () => void;
}) => (
  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
    <div>
      <h3 className="text-xl font-bold text-brand-blue flex items-center gap-3">
        <Icon className="text-brand-gold w-6 h-6" /> {title}
      </h3>
      {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
    </div>
    <div className="flex items-center gap-3">
      {onToggle !== undefined && (
        <button
          onClick={onToggle}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border",
            isVisible 
              ? "bg-green-50 text-green-600 border-green-100" 
              : "bg-gray-50 text-gray-400 border-gray-100"
          )}
        >
          {isVisible ? <CheckCircle2 size={14} /> : <Loader2 size={14} />}
          {isVisible ? 'Visible on Site' : 'Hidden on Site'}
        </button>
      )}
      {onAdd && (
        <button onClick={onAdd} className="bg-brand-gold/10 text-brand-gold px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-brand-gold hover:text-brand-blue transition-all">
          <Plus size={18} /> Add New
        </button>
      )}
    </div>
  </div>
);

const ReorderButtons = ({ onMoveUp, onMoveDown, isFirst, isLast }: { 
  onMoveUp: () => void; 
  onMoveDown: () => void; 
  isFirst: boolean; 
  isLast: boolean;
}) => (
  <div className="flex flex-col gap-1 absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all">
    <button 
      disabled={isFirst}
      onClick={onMoveUp}
      className="p-1 text-gray-400 hover:text-brand-blue disabled:opacity-20"
    >
      <Plus className="rotate-180" size={14} />
    </button>
    <button 
      disabled={isLast}
      onClick={onMoveDown}
      className="p-1 text-gray-400 hover:text-brand-blue disabled:opacity-20"
    >
      <Plus size={14} />
    </button>
  </div>
);

export default function AdminContent() {
  const [content, setContent] = useState<SiteContent>({
    heroTagline: '',
    heroTitle: '',
    heroDescription: '',
    heroCtaText: '',
    heroSecondaryCtaText: '',
    aboutUs: '',
    services: [],
    stats: [],
    branchOffices: [],
    countries: [],
    jobPositions: [],
    jobCategories: [],
    whyChooseUs: {
      title: '',
      description: '',
      points: []
    },
    ctaTitle: '',
    ctaDescription: '',
    ctaButtonText: '',
    countriesTitle: '',
    countriesDescription: '',
    livingSection: {
      title: '',
      description: '',
      features: []
    },
    partners: [],
    companyStoryTitle: '',
    companyStoryTagline: '',
    companyStoryDescription: '',
    coreStrengthsTitle: '',
    servicesTagline: '',
    servicesTitle: '',
    servicesSubtitle: '',
    ourProcessTitle: '',
    jobsTagline: '',
    jobsTitle: '',
    jobsSubtitle: '',
    successStoriesTagline: '',
    successStoriesTitle: '',
    successStoriesSubtitle: '',
    livingSectionTitle: '',
    globalStandardsTagline: '',
    globalStandardsTitle: '',
    globalStandardsDescription: '',
    professionalHrSolutionsTitle: '',
    professionalHrSolutionsDescription: '',
    professionalHrSolutionsImageUrl: '',
    assistants: [],
    socialLinks: {
      facebook: '',
      whatsapp: '',
      linkedin: '',
      tiktok: '',
      instagram: '',
      youtube: ''
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('general');
  const [showSeedConfirm, setShowSeedConfirm] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const docRef = doc(db, 'settings', 'siteContent');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setContent(docSnap.data() as SiteContent);
        }
      } catch (error) {
        console.error('Error fetching content:', error);
        toast.error('Failed to load content');
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'siteContent'), content);
      toast.success('Website content updated successfully!');
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string, index?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(field);
    try {
      const storage = getStorage();
      const storageRef = ref(storage, `site-assets/${field}-${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      if (field.startsWith('service_') && index !== undefined) {
        const newServices = [...(content.services || [])];
        newServices[index] = { ...newServices[index], imageUrl: url };
        setContent({ ...content, services: newServices });
      } else if (field.startsWith('heroImageUrls_') && index !== undefined) {
        const newImages = [...(content.heroImageUrls || [])];
        newImages[index] = url;
        setContent({ ...content, heroImageUrls: newImages });
      } else {
        setContent({ ...content, [field]: url });
      }
      
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(null);
    }
  };

  const seedDefaults = () => {
    setContent({
      ...content,
      heroTitle: content.heroTitle || 'Your Premier Bridge to Global Career Excellence',
      heroTagline: content.heroTagline || 'Ethical Recruitment • Global Reach • Professional Success',
      heroDescription: content.heroDescription || 'Specializing in sourcing and placing skilled talent across Europe and the Middle East. With 600+ successful placements and a presence in multiple continents, we empower your professional journey.',
      heroCtaText: content.heroCtaText || 'Apply for Jobs',
      heroSecondaryCtaText: content.heroSecondaryCtaText || 'Consult with Us',
      heroImageUrl: content.heroImageUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=1200',
      heroImageUrls: content.heroImageUrls?.length ? content.heroImageUrls : [
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1454165833772-d99628a5ffad?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=1200'
      ],
      ctaTitle: content.ctaTitle || 'Ready to Start Your Global Career?',
      ctaDescription: content.ctaDescription || 'Join over 600+ successful candidates who have found their dream roles in Europe and the Gulf through our ethical and transparent recruitment process.',
      ctaButtonText: content.ctaButtonText || 'Register as Candidate',
      countriesTitle: content.countriesTitle || 'Our Global Reach',
      countriesTagline: content.countriesTagline || 'International Presence',
      countriesDescription: content.countriesDescription || 'With main operations in Dubai and branches in Nepal, Sri Lanka, India, and Africa, we connect talent to top employers in Latvia, Lithuania, Romania, and the UAE.',
      aboutUs: content.aboutUs || 'WorkinEU Human Resources Consultancies LLC is a Dubai-based international recruitment agency specializing in sourcing and placing skilled and unskilled workers into industries across Europe and the Middle East. Backed by ethical practices and global reach, we have successfully placed over 600+ candidates.',
      mission: content.mission || 'To empower organizations by aligning their HR strategy with business objectives, enhancing efficiency and productivity through expert workforce solutions across Europe and the Gulf.',
      vision: content.vision || 'To be the leading HR partner for growth-minded businesses in Europe and the Gulf, driving success through strategic talent acquisition, ethical recruitment, and global workforce mobility.',
      values: [
        { title: 'Integrity & Transparency', description: 'We conduct all activities with honesty and openness, ensuring trust in every interaction.' },
        { title: 'Respect & Fairness', description: 'Fostering relationships built on mutual respect and equal opportunity for all candidates.' },
        { title: 'Accountability', description: 'We take full responsibility for our actions and maintain the highest professional standards.' },
        { title: 'Quality & Ethics', description: 'Adherence to strict compliance and ethical recruitment practices, ensuring total client satisfaction.' }
      ],
      services: [
        { title: 'International Recruitment', description: 'Sourcing skilled and unskilled workers from Asia, Africa, and the Gulf for European industries.', imageUrl: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&q=80&w=800' },
        { title: 'Visa & Documentation', description: 'Expert legal documentation, visa processing, and embassy coordination for smooth deployment.', imageUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=800' },
        { title: 'Executive Search', description: 'Customized recruitment campaigns and high-level executive search for specialized roles.', imageUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=800' },
        { title: 'Post-Placement Support', description: 'Ongoing performance tracking and support for both employers and candidates post-deployment.', imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800' }
      ],
      stats: [
        { label: 'Success Stories', value: '600+' },
        { label: 'Candidates / Quarter', value: '500+' },
        { label: 'Global Branches', value: '3+' },
        { label: 'Countries Served', value: '15+' }
      ],
      branchOffices: [
        { location: 'Dubai (Headquarters)', address: 'Mai Tower, 4th Floor Royal Zone Business Center, Al Nahda 1, Dubai, UAE', phone: '+971 55 299 7311', email: 'info@workineu.co' },
        { location: 'Nepal Office', address: 'Singamangal-9, Kathmandu, Nepal', phone: '+977-01-4560541', email: 'info@workineu.co' },
        { location: 'Sri Lanka Office', address: 'No.600/4A, Kandy Road, Eldeniya, Kadawatha, Sri Lanka', phone: '+94 77 841 1444', email: 'info@workineu.co' }
      ],
      countries: ['Latvia', 'Lithuania', 'Romania', 'Poland', 'Croatia', 'UAE', 'Saudi Arabia', 'Qatar', 'Oman'],
      jobPositions: ['Construction Worker', 'Electrician', 'Plumber', 'Warehouse Assistant', 'Driver', 'Cook', 'Waiter', 'Security Guard', 'Accountant'],
      jobCategories: ['Construction', 'Hospitality', 'Logistics', 'Healthcare', 'Facility Management', 'Administration'],
      livingSectionTitle: content.livingSectionTitle || 'Life and Integration in Europe',
      globalStandardsTagline: content.globalStandardsTagline || 'Excellence in HR',
      globalStandardsTitle: content.globalStandardsTitle || 'Ethical Global Recruitment Standards',
      globalStandardsDescription: content.globalStandardsDescription || 'WorkinEU is committed to excellence by bridging the gap between world-class talent and global opportunities through integrity and unmatched expertise.',
      livingSection: {
        title: 'Work and Life Abroad',
        description: 'Comprehensive support for transition, including housing coordination and legal integration assistance.',
        features: [
          { title: 'Housing Coordination', description: 'Ensuring safe and compliant living conditions for candidates.' },
          { title: 'Legal Path', description: 'Full assistance with work permits, city registration, and health insurance.' },
          { title: 'Onboarding', description: 'Professional orientation to help you adapt to your new work environment.' }
        ]
      },
      ourProcess: {
        title: 'Transparent Recruitment Journey',
        description: 'A structured flowchart designed for maximum efficiency and candidate protection.',
        steps: [
          { title: 'Requirement Analysis', description: 'Deep understanding of client workforce needs and job requisition.' },
          { title: 'Strategic Sourcing', description: 'Accessing our network of 500+ candidates to find the perfect match.' },
          { title: 'Screening & Testing', description: 'Rigorous skill testing and interviews to ensure quality standards.' },
          { title: 'Deployment', description: 'Full logistical support for visa processing and pre-departure orientation.' }
        ]
      },
      whyChooseUs: {
        title: 'Why Work with WorkinEU?',
        description: 'Proven success, global reach, and a commitment to ethical hiring practices.',
        points: [
          { title: '600+ Placements', description: 'A track record of success across diversified industries.' },
          { title: 'Global Network', description: 'Presence across multiple continents with certified recruitment partners.' },
          { title: 'Total Compliance', description: 'Full adherence to international labor laws and visa procedures.' },
          { title: 'Client Trust', description: 'Trusted by top employers in the European Union and the Gulf region.' }
        ]
      },
      socialLinks: {
        facebook: 'https://www.facebook.com/workineuhr/',
        whatsapp: '971501942811',
        linkedin: 'https://www.linkedin.com/in/workineuhrconsultancy/',
        tiktok: 'https://www.tiktok.com/@workineuhr',
        instagram: 'https://www.instagram.com/workineuhr/',
        youtube: ''
      },
      aboutImageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800',
      servicesImageUrl: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&q=80&w=800',
      whyChooseUsImageUrl: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&q=80&w=800',
      guidingPrinciplesImageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800',
      faqs: [
        { question: 'How long does the visa processing take?', answer: 'The duration varies by country and job category, typically ranging from 3 to 6 months for most European roles.' },
        { question: 'What documents are required for registration?', answer: 'You will need a valid passport, updated CV (Europass format preferred), education certificates, and experience letters.' },
        { question: 'Do you provide guidance for the VFS appointment?', answer: 'Yes, we provide full support for VFS appointments, document legalization, and pre-interview preparation.' },
        { question: 'Are there any upfront fees for processing?', answer: 'WorkinEU follows ethical recruitment practices. Any mandatory service fees are transparently communicated and agreed upon before processing.' }
      ],
      partners: [
        { name: 'Inspirado SIA', logoUrl: 'https://images.unsplash.com/photo-1586528116311-ad86d7c71798?auto=format&fit=crop&q=80&w=200' },
        { name: 'Lamprell Energy', logoUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19480c5?auto=format&fit=crop&q=80&w=200' },
        { name: 'Club Militari', logoUrl: 'https://images.unsplash.com/photo-1505751172107-573228a64227?auto=format&fit=crop&q=80&w=200' },
        { name: 'EU Logistics SIA', logoUrl: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&q=80&w=200' },
        { name: 'Global Maritime', logoUrl: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&q=80&w=200' }
      ],
      professionalHrSolutionsTitle: 'Precision-Guided HR Solutions',
      professionalHrSolutionsDescription: 'We provide end-to-end recruitment services tailored to the unique regulatory environments of Latvia, Lithuania, Romania, and the UAE. From talent discovery to full logistical deployment, we handle every detail with professional precision.',
      assistants: [
        { 
          id: 'raj-consultant', 
          name: 'Raj', 
          role: 'Senior Consultant', 
          photoUrl: '/raj.jpg',
          systemPrompt: 'You are Raj, a senior consultant at WorkinEU. You are an expert in European recruitment (Latvia, Romania, Poland) and Middle East staffing.',
          isActive: true,
          color: '#0F172A'
        }
      ]
    });
    setShowSeedConfirm(false);
    toast.success("Professional company data loaded! Please Review and Save changes.");
  };

  const moveItem = (field: keyof SiteContent, index: number, direction: 'up' | 'down') => {
    const list = [...((content[field] as any[]) || [])];
    if (direction === 'up' && index > 0) {
      [list[index], list[index - 1]] = [list[index - 1], list[index]];
    } else if (direction === 'down' && index < list.length - 1) {
      [list[index], list[index + 1]] = [list[index + 1], list[index]];
    }
    setContent({ ...content, [field]: list });
  };

  const moveNestedItem = (parentField: string, childField: string, index: number, direction: 'up' | 'down') => {
    const parent = { ...(content as any)[parentField] };
    const list = [...(parent[childField] || [])];
    if (direction === 'up' && index > 0) {
      [list[index], list[index - 1]] = [list[index - 1], list[index]];
    } else if (direction === 'down' && index < list.length - 1) {
      [list[index], list[index + 1]] = [list[index + 1], list[index]];
    }
    parent[childField] = list;
    setContent({ ...content, [parentField]: parent });
  };

  const handleProcessStepChange = (index: number, field: 'title' | 'description', value: string) => {
    const newSteps = [...(content.ourProcess?.steps || [])];
    if (!newSteps[index]) newSteps[index] = { title: '', description: '' };
    newSteps[index][field] = value;
    setContent({ ...content, ourProcess: { ...content.ourProcess!, steps: newSteps } });
  };

  const addProcessStep = () => {
    setContent({ 
      ...content, 
      ourProcess: { 
        title: content.ourProcess?.title || '', 
        description: content.ourProcess?.description || '', 
        steps: [...(content.ourProcess?.steps || []), { title: '', description: '' }] 
      } 
    });
  };

  const removeProcessStep = (index: number) => {
    setContent({ 
      ...content, 
      ourProcess: { 
        ...content.ourProcess!, 
        steps: (content.ourProcess?.steps || []).filter((_, i) => i !== index) 
      } 
    });
  };

  const handleFaqChange = (index: number, field: 'question' | 'answer', value: string) => {
    const newFaqs = [...(content.faqs || [])];
    if (!newFaqs[index]) newFaqs[index] = { question: '', answer: '' };
    newFaqs[index][field] = value;
    setContent({ ...content, faqs: newFaqs });
  };

  const addFaq = () => {
    setContent({ ...content, faqs: [...(content.faqs || []), { question: '', answer: '' }] });
  };

  const removeFaq = (index: number) => {
    setContent({ ...content, faqs: (content.faqs || []).filter((_, i) => i !== index) });
  };

  const handleServiceChange = (index: number, field: 'title' | 'description' | 'imageUrl', value: string) => {
    const newServices = [...content.services];
    newServices[index][field] = value;
    setContent({ ...content, services: newServices });
  };

  const addService = () => {
    setContent({ ...content, services: [...content.services, { title: '', description: '' }] });
  };

  const removeService = (index: number) => {
    setContent({ ...content, services: content.services.filter((_, i) => i !== index) });
  };

  const handleStatChange = (index: number, field: 'label' | 'value', value: string) => {
    const newStats = [...(content.stats || [])];
    newStats[index][field] = value;
    setContent({ ...content, stats: newStats });
  };

  const addStat = () => {
    setContent({ ...content, stats: [...(content.stats || []), { label: '', value: '' }] });
  };

  const removeStat = (index: number) => {
    setContent({ ...content, stats: (content.stats || []).filter((_, i) => i !== index) });
  };

  const handleBranchChange = (index: number, field: keyof any, value: string) => {
    const newBranches = [...(content.branchOffices || [])];
    (newBranches[index] as any)[field] = value;
    setContent({ ...content, branchOffices: newBranches });
  };

  const handleLivingFeatureChange = (index: number, field: 'title' | 'description', value: string) => {
    const newFeatures = [...(content.livingSection?.features || [])];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    setContent({ ...content, livingSection: { ...content.livingSection!, features: newFeatures } });
  };

  const addLivingFeature = () => {
    setContent({ 
      ...content, 
      livingSection: { 
        ...content.livingSection!, 
        features: [...(content.livingSection?.features || []), { title: '', description: '' }] 
      } 
    });
  };

  const removeLivingFeature = (index: number) => {
    setContent({ 
      ...content, 
      livingSection: { 
        ...content.livingSection!, 
        features: (content.livingSection?.features || []).filter((_, i) => i !== index) 
      } 
    });
  };

  const addBranch = () => {
    setContent({ ...content, branchOffices: [...(content.branchOffices || []), { location: '', address: '', phone: '', email: '' }] });
  };

  const removeBranch = (index: number) => {
    setContent({ ...content, branchOffices: (content.branchOffices || []).filter((_, i) => i !== index) });
  };

  const handleValueChange = (index: number, field: 'title' | 'description', value: string) => {
    const newValues = [...(content.values || [])];
    newValues[index][field] = value;
    setContent({ ...content, values: newValues });
  };

  const addValue = () => {
    setContent({ ...content, values: [...(content.values || []), { title: '', description: '' }] });
  };

  const removeValue = (index: number) => {
    setContent({ ...content, values: (content.values || []).filter((_, i) => i !== index) });
  };

  const handleStrengthChange = (index: number, value: string) => {
    const newStrengths = [...(content.coreStrengths || [])];
    newStrengths[index] = value;
    setContent({ ...content, coreStrengths: newStrengths });
  };

  const addStrength = () => {
    setContent({ ...content, coreStrengths: [...(content.coreStrengths || []), ''] });
  };

  const removeStrength = (index: number) => {
    setContent({ ...content, coreStrengths: (content.coreStrengths || []).filter((_, i) => i !== index) });
  };

  const handleWhyPointChange = (index: number, field: 'title' | 'description', value: string) => {
    const newPoints = [...(content.whyChooseUs?.points || [])];
    if (!newPoints[index]) newPoints[index] = { title: '', description: '' };
    newPoints[index][field] = value;
    setContent({ 
      ...content, 
      whyChooseUs: { 
        ...(content.whyChooseUs || { title: '', description: '', points: [] }), 
        points: newPoints 
      } 
    });
  };

  const addWhyPoint = () => {
    setContent({ 
      ...content, 
      whyChooseUs: { 
        ...(content.whyChooseUs || { title: '', description: '', points: [] }), 
        points: [...(content.whyChooseUs?.points || []), { title: '', description: '' }] 
      } 
    });
  };

  const removeWhyPoint = (index: number) => {
    setContent({ 
      ...content, 
      whyChooseUs: { 
        ...(content.whyChooseUs || { title: '', description: '', points: [] }), 
        points: (content.whyChooseUs?.points || []).filter((_, i) => i !== index) 
      } 
    });
  };

  const handleListChange = (field: 'countries' | 'jobPositions' | 'jobCategories', index: number, value: string) => {
    const newList = [...(content[field] || [])];
    newList[index] = value;
    setContent({ ...content, [field]: newList });
  };

  const addListItem = (field: 'countries' | 'jobPositions' | 'jobCategories') => {
    setContent({ ...content, [field]: [...(content[field] || []), ''] });
  };

  const removeListItem = (field: 'countries' | 'jobPositions' | 'jobCategories', index: number) => {
    setContent({ ...content, [field]: (content[field] || []).filter((_, i) => i !== index) });
  };

  if (loading) return <div className="animate-pulse h-96 bg-white rounded-2xl"></div>;

  return (
    <div className="space-y-8 w-full">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-brand-blue">Content Management</h1>
          <p className="text-gray-500">Customize every aspect of your website's information and appearance.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <button 
            onClick={() => setShowSeedConfirm(true)}
            className="flex-1 sm:flex-none bg-gray-50 text-gray-600 px-6 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-all border border-gray-100"
          >
            <Database size={20} /> Seed Defaults
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex-1 sm:flex-none bg-brand-blue text-white px-10 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-brand-gold hover:text-brand-blue transition-all shadow-xl shadow-brand-blue/20 disabled:opacity-70"
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Save All Changes</>}
          </button>
        </div>
      </div>

      {/* Seed Confirmation Modal */}
      {showSeedConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-blue/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border border-gray-100"
          >
            <div className="w-20 h-20 bg-brand-gold/10 text-brand-gold rounded-full flex items-center justify-center mb-8 mx-auto">
              <Database size={40} />
            </div>
            <h3 className="text-2xl font-bold text-brand-blue text-center mb-4">Seed Default Content?</h3>
            <p className="text-gray-500 text-center mb-10 leading-relaxed">
              This will add default lists, services, and sections. Existing data will be preserved, but new defaults will be added. This action cannot be easily undone.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowSeedConfirm(false)}
                className="flex-1 px-6 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={seedDefaults}
                className="flex-1 bg-brand-blue text-white px-6 py-4 rounded-2xl font-bold hover:bg-brand-gold hover:text-brand-blue transition-all shadow-lg"
              >
                Yes, Seed Defaults
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Sidebar Layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="sticky top-8 space-y-2 bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
            {[
              { id: 'general', label: '1. General & Navbar', icon: <Globe size={18} /> },
              { id: 'hero', label: '2. Hero Section', icon: <ImageIcon size={18} /> },
              { id: 'data', label: '3. Lists, Jobs & FAQs', icon: <Database size={18} /> },
              { id: 'services', label: '4. Professional Services', icon: <Briefcase size={18} /> },
              { id: 'impact', label: '5. Impact & Statistics', icon: <TrendingUp size={18} /> },
              { id: 'expertise', label: '6. Expertise & Advantage', icon: <ShieldCheck size={18} /> },
              { id: 'living', label: '7. Living & Culture', icon: <Home size={18} /> },
              { id: 'about', label: '8. Our Story & Legacy', icon: <Info size={18} /> },
              { id: 'partners', label: '9. Industry Leaders', icon: <Users2 size={18} /> },
              { id: 'contact', label: '10. Contact & Offices', icon: <Phone size={18} /> },
              { id: 'visibility', label: '11. Commander View', icon: <LayoutGrid size={18} /> },
              { id: 'styles', label: '12. Visual Styles', icon: <Zap size={18} /> },
              { id: 'assistants', label: '13. AI Support Bot', icon: <Bot size={18} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all",
                  activeTab === tab.id 
                    ? "bg-brand-blue text-white shadow-lg shadow-brand-blue/20" 
                    : "text-gray-500 hover:text-brand-blue hover:bg-gray-50"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-grow min-w-0">
          <div className="grid grid-cols-1 gap-8">
            {activeTab === 'general' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Branding Section */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-brand-blue mb-8 flex items-center gap-3">
                <ImageIcon className="text-brand-gold w-6 h-6" /> Branding Assets
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Logo */}
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-gray-700">Main Logo</label>
                  <div className="flex flex-col gap-4">
                    <div className="flex gap-2">
                      <input 
                        className="flex-grow px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm"
                        value={content.logoUrl || ''}
                        onChange={(e) => setContent({ ...content, logoUrl: e.target.value })}
                        placeholder="Logo URL"
                      />
                      <label className="bg-brand-blue/5 p-3 rounded-xl cursor-pointer hover:bg-brand-blue/10 transition-all flex items-center justify-center text-brand-blue">
                        {uploading === 'logoUrl' ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logoUrl')} />
                      </label>
                    </div>
                    {content.logoUrl && content.logoUrl !== "" && (
                      <div className="p-6 bg-gray-50 rounded-2xl flex items-center justify-center border border-dashed border-gray-200">
                        <img src={content.logoUrl} alt="Logo Preview" className="max-h-16 object-contain" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Favicon */}
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-gray-700">Favicon (Browser Icon)</label>
                  <div className="flex flex-col gap-4">
                    <div className="flex gap-2">
                      <input 
                        className="flex-grow px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm"
                        value={content.faviconUrl || ''}
                        onChange={(e) => setContent({ ...content, faviconUrl: e.target.value })}
                        placeholder="Favicon URL"
                      />
                      <label className="bg-brand-blue/5 p-3 rounded-xl cursor-pointer hover:bg-brand-blue/10 transition-all flex items-center justify-center text-brand-blue">
                        {uploading === 'faviconUrl' ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'faviconUrl')} />
                      </label>
                    </div>
                    {content.faviconUrl && content.faviconUrl !== "" && (
                      <div className="p-6 bg-gray-50 rounded-2xl flex items-center justify-center border border-dashed border-gray-200">
                        <img src={content.faviconUrl} alt="Favicon Preview" className="w-12 h-12 object-contain" />
                      </div>
                    )}
                  </div>
                </div>

                {/* PDF Profile */}
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-gray-700">Company Profile (PDF)</label>
                  <div className="flex flex-col gap-4">
                    <div className="flex gap-2">
                      <input 
                        className="flex-grow px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm"
                        value={content.companyProfileUrl || ''}
                        onChange={(e) => setContent({ ...content, companyProfileUrl: e.target.value })}
                        placeholder="PDF URL"
                      />
                      <label className="bg-brand-blue/5 p-3 rounded-xl cursor-pointer hover:bg-brand-blue/10 transition-all flex items-center justify-center text-brand-blue">
                        {uploading === 'companyProfileUrl' ? <Loader2 className="animate-spin" size={20} /> : <FileText size={20} />}
                        <input type="file" className="hidden" accept=".pdf" onChange={(e) => handleFileUpload(e, 'companyProfileUrl')} />
                      </label>
                    </div>
                    {content.companyProfileUrl && (
                      <div className="p-4 bg-green-50 rounded-xl flex items-center gap-3 border border-green-100">
                        <CheckCircle2 className="text-green-500" size={20} />
                        <span className="text-xs font-bold text-green-700">PDF Document Linked</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Logo */}
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-gray-700">Footer Logo</label>
                  <div className="flex flex-col gap-4">
                    <div className="flex gap-2">
                      <input 
                        className="flex-grow px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm"
                        value={content.footerLogoUrl || ''}
                        onChange={(e) => setContent({ ...content, footerLogoUrl: e.target.value })}
                        placeholder="Footer Logo URL"
                      />
                      <label className="bg-brand-blue/5 p-3 rounded-xl cursor-pointer hover:bg-brand-blue/10 transition-all flex items-center justify-center text-brand-blue">
                        {uploading === 'footerLogoUrl' ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'footerLogoUrl')} />
                      </label>
                    </div>
                    {content.footerLogoUrl && content.footerLogoUrl !== "" && (
                      <div className="p-6 bg-gray-50 rounded-2xl flex items-center justify-center border border-dashed border-gray-200">
                        <img src={content.footerLogoUrl} alt="Footer Logo Preview" className="max-h-12 object-contain" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media Links - NEW */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-brand-blue mb-8 flex items-center gap-3">
                <Globe className="text-brand-gold w-6 h-6" /> Social Media Presence
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Facebook URL</label>
                  <input 
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold text-brand-blue"
                    value={content.socialLinks?.facebook || ''}
                    onChange={(e) => setContent({ ...content, socialLinks: { ...content.socialLinks, facebook: e.target.value } })}
                    placeholder="https://facebook.com/..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">LinkedIn URL</label>
                  <input 
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold text-brand-blue"
                    value={content.socialLinks?.linkedin || ''}
                    onChange={(e) => setContent({ ...content, socialLinks: { ...content.socialLinks, linkedin: e.target.value } })}
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Instagram URL</label>
                  <input 
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold text-brand-blue"
                    value={content.socialLinks?.instagram || ''}
                    onChange={(e) => setContent({ ...content, socialLinks: { ...content.socialLinks, instagram: e.target.value } })}
                    placeholder="https://instagram.com/..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">TikTok URL</label>
                  <input 
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold text-brand-blue"
                    value={content.socialLinks?.tiktok || ''}
                    onChange={(e) => setContent({ ...content, socialLinks: { ...content.socialLinks, tiktok: e.target.value } })}
                    placeholder="https://tiktok.com/@..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">WhatsApp Number (with country code)</label>
                  <input 
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold text-brand-blue"
                    value={content.socialLinks?.whatsapp || ''}
                    onChange={(e) => setContent({ ...content, socialLinks: { ...content.socialLinks, whatsapp: e.target.value } })}
                    placeholder="e.g. 971501942811"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">YouTube URL</label>
                  <input 
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold text-brand-blue"
                    value={content.socialLinks?.youtube || ''}
                    onChange={(e) => setContent({ ...content, socialLinks: { ...content.socialLinks, youtube: e.target.value } })}
                    placeholder="https://youtube.com/..."
                  />
                </div>
              </div>
            </div>

            {/* Navigation Labels */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-brand-blue mb-8 flex items-center gap-3">
                <Globe className="text-brand-gold w-6 h-6" /> Navigation Labels
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Home', field: 'navHome' },
                  { label: 'Jobs', field: 'navJobs' },
                  { label: 'Diary', field: 'navDiary' },
                  { label: 'About Us', field: 'navAbout' },
                  { label: 'Contact Us', field: 'navContact' },
                ].map((item) => (
                  <div key={item.field}>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{item.label}</label>
                    <input 
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                      value={(content as any)[item.field] || ''}
                      onChange={(e) => setContent({ ...content, [item.field]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'hero' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Hero Section */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-brand-blue mb-8 flex items-center gap-3">
                <Globe className="text-brand-gold w-6 h-6" /> Hero Section
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Hero Tagline</label>
                    <input 
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                      value={content.heroTagline}
                      onChange={(e) => setContent({ ...content, heroTagline: e.target.value })}
                    />
                    <CharacterCounter current={content.heroTagline.length} max={50} />
                  </div>
                  
                  {/* Dynamic Job Toggle */}
                  <div className="bg-brand-blue/5 p-6 rounded-2xl border border-brand-blue/10">
                    <div className="flex items-center justify-between mb-2">
                       <h4 className="text-sm font-bold text-brand-blue flex items-center gap-2">
                         <Zap size={16} className="text-brand-gold" /> Dynamic Hero Jobs
                       </h4>
                       <button
                         onClick={() => setContent({ ...content, autoHeroJobs: !content.autoHeroJobs })}
                         className={cn(
                           "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                           content.autoHeroJobs ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
                         )}
                       >
                         {content.autoHeroJobs ? 'Enabled' : 'Disabled'}
                       </button>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-relaxed">
                      Automatically showcase the latest job title in the Hero headline. 
                      <span className="font-bold text-brand-blue ml-1">"Connecting Talent Globally"</span> will always remain as the top tagline.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Hero Title</label>
                    <input 
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                      value={content.heroTitle || ''}
                      onChange={(e) => setContent({ ...content, heroTitle: e.target.value })}
                      placeholder="e.g. Your Gateway to Europe"
                    />
                    <CharacterCounter current={(content.heroTitle || '').length} max={60} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Hero Description</label>
                    <textarea 
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm"
                      value={content.heroDescription || ''}
                      onChange={(e) => setContent({ ...content, heroDescription: e.target.value })}
                    ></textarea>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Hero Primary CTA</label>
                      <input 
                        className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                        value={content.heroCtaText || ''}
                        onChange={(e) => setContent({ ...content, heroCtaText: e.target.value })}
                        placeholder="e.g. Explore Opportunities"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Hero Secondary CTA</label>
                      <input 
                        className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                        value={content.heroSecondaryCtaText || ''}
                        onChange={(e) => setContent({ ...content, heroSecondaryCtaText: e.target.value })}
                        placeholder="e.g. Contact Expert"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Hero Background Images (Slider)</label>
                    <button 
                      onClick={() => setContent({ ...content, heroImageUrls: [...(content.heroImageUrls || []), ''] })}
                      className="text-brand-gold font-bold text-xs flex items-center gap-1"
                    >
                      <Plus size={14} /> Add Slide
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(content.heroImageUrls || []).map((url, i) => (
                      <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 relative group pl-10">
                        <ReorderButtons 
                          onMoveUp={() => moveItem('heroImageUrls', i, 'up')}
                          onMoveDown={() => moveItem('heroImageUrls', i, 'down')}
                          isFirst={i === 0}
                          isLast={i === (content.heroImageUrls?.length || 0) - 1}
                        />
                        <button 
                          onClick={() => setContent({ ...content, heroImageUrls: content.heroImageUrls!.filter((_, idx) => idx !== i) })}
                          className="absolute -top-2 -right-2 w-8 h-8 bg-white text-red-400 rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:text-red-600 z-10"
                        >
                          <Trash2 size={16} />
                        </button>
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <input 
                              className="flex-grow px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-gold transition-all text-[10px] bg-white"
                              value={url || ''}
                              onChange={(e) => {
                                const newUrls = [...(content.heroImageUrls || [])];
                                newUrls[i] = e.target.value;
                                setContent({ ...content, heroImageUrls: newUrls });
                              }}
                              placeholder="Image URL"
                            />
                            <label className="bg-brand-blue/5 p-2 rounded-lg cursor-pointer hover:bg-brand-blue/10 transition-all flex items-center justify-center text-brand-blue">
                              {uploading === `heroImageUrls_${i}` ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, `heroImageUrls_${i}`, i)} />
                            </label>
                          </div>
                          {url && (
                            <div className="aspect-[4/5] rounded-xl overflow-hidden border border-gray-100">
                              <img src={url} alt="Slide Preview" className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'about' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-brand-blue mb-8 flex items-center gap-3">
                <Info className="text-brand-gold w-6 h-6" /> Our Company Story
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">About Tagline</label>
                      <input 
                        className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                        value={content.companyStoryTagline || ''}
                        onChange={(e) => setContent({ ...content, companyStoryTagline: e.target.value })}
                        placeholder="e.g. Our History"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">About Title</label>
                      <input 
                        className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                        value={content.companyStoryTitle || ''}
                        onChange={(e) => setContent({ ...content, companyStoryTitle: e.target.value })}
                        placeholder="e.g. A Decade of Excellence"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Comprehensive Narrative</label>
                    <textarea 
                      rows={10}
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm leading-relaxed"
                      value={content.aboutUs}
                      onChange={(e) => setContent({ ...content, aboutUs: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Story Showcase Image (Office Photo)</label>
                    <div className="flex gap-2">
                      <input 
                        className="flex-grow px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm"
                        value={content.aboutImageUrl || content.officeImageUrl || ''}
                        onChange={(e) => setContent({ ...content, aboutImageUrl: e.target.value })}
                        placeholder="Image URL"
                      />
                      <label className="bg-brand-blue/5 p-3 rounded-xl cursor-pointer hover:bg-brand-blue/10 transition-all flex items-center justify-center text-brand-blue">
                        {uploading === 'aboutImageUrl' ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'aboutImageUrl')} />
                      </label>
                    </div>
                    {(content.aboutImageUrl || content.officeImageUrl) && (
                      <div className="aspect-video bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 shadow-inner">
                        <img src={content.aboutImageUrl || content.officeImageUrl} alt="Story Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  <div className="p-8 bg-slate-900 text-white rounded-[2rem] border border-white/5">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-lg mb-1">Our Team</h4>
                        <p className="text-xs text-slate-400">Manage members, portraits and roles.</p>
                      </div>
                      <Link 
                        to="/admin/team" 
                        className="bg-brand-gold text-slate-900 px-6 py-2 rounded-xl font-bold text-xs hover:bg-white transition-all shadow-lg"
                      >
                        Manage Team
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
               <h3 className="text-xl font-bold text-brand-blue mb-8 flex items-center gap-3">
                <Target className="text-brand-gold w-6 h-6" /> Mission & Vision
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Our Mission</label>
                  <textarea 
                    rows={6}
                    className="w-full px-6 py-4 rounded-3xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm leading-relaxed italic"
                    value={content.mission || ''}
                    onChange={(e) => setContent({ ...content, mission: e.target.value })}
                    placeholder="Our mission is to..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Our Vision</label>
                  <textarea 
                    rows={6}
                    className="w-full px-6 py-4 rounded-3xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm leading-relaxed italic"
                    value={content.vision || ''}
                    onChange={(e) => setContent({ ...content, vision: e.target.value })}
                    placeholder="Our vision is to exceed..."
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <SectionHeader 
                    title="Our Core Values" 
                    icon={CheckCircle2} 
                    description="The fundamental beliefs that drive our agency's behavior and decisions."
                    onAdd={addValue}
                  />
                  <div className="space-y-4">
                    {(content.values || []).map((value, index) => (
                      <div key={index} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 relative group pl-12">
                        <ReorderButtons 
                          onMoveUp={() => moveItem('values', index, 'up')}
                          onMoveDown={() => moveItem('values', index, 'down')}
                          isFirst={index === 0}
                          isLast={index === (content.values || []).length - 1}
                        />
                        <button 
                          onClick={() => removeValue(index)}
                          className="absolute -top-2 -right-2 w-8 h-8 bg-white text-red-500 rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 z-10"
                        >
                          <Trash2 size={16} />
                        </button>
                        <div className="grid grid-cols-1 gap-3">
                          <input 
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-brand-gold transition-all text-sm font-bold bg-white"
                            value={value.title}
                            onChange={(e) => handleValueChange(index, 'title', e.target.value)}
                            placeholder="Value Title (e.g. Integrity)"
                          />
                          <textarea 
                            rows={2}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-brand-gold transition-all text-xs bg-white text-gray-500 leading-relaxed font-medium"
                            value={value.description}
                            onChange={(e) => handleValueChange(index, 'description', e.target.value)}
                            placeholder="How do we live this value?"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Culture & Principles Visual</label>
                  <div className="flex gap-2">
                    <input 
                      className="flex-grow px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm"
                      value={content.guidingPrinciplesImageUrl || ''}
                      onChange={(e) => setContent({ ...content, guidingPrinciplesImageUrl: e.target.value })}
                      placeholder="Image URL"
                    />
                    <label className="bg-brand-blue text-white p-3 rounded-xl cursor-pointer hover:bg-brand-gold hover:text-brand-blue transition-all flex items-center justify-center">
                      {uploading === 'guidingPrinciplesImageUrl' ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'guidingPrinciplesImageUrl')} />
                    </label>
                  </div>
                  {content.guidingPrinciplesImageUrl && (
                    <div className="relative group aspect-square rounded-[3rem] overflow-hidden border-8 border-gray-50 shadow-2xl">
                      <img src={content.guidingPrinciplesImageUrl} alt="Principles Preview" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent group-hover:opacity-0 transition-opacity flex items-end p-8">
                        <span className="text-white font-bold text-xl drop-shadow-lg">Visual Identity</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Expertise & Solutions Section */}
        {activeTab === 'expertise' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Professional HR Solutions Section - Added per user request */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
               <h3 className="text-xl font-bold text-brand-blue mb-8 flex items-center gap-3">
                <ShieldCheck className="text-brand-gold w-6 h-6" /> Professional HR Solutions
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Badge Text</label>
                      <input 
                        className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                        value={content.professionalHrSolutionsBadge || ''}
                        onChange={(e) => setContent({ ...content, professionalHrSolutionsBadge: e.target.value })}
                        placeholder="e.g. Elite HR Consultancy"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Section Title</label>
                      <input 
                        className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                        value={content.professionalHrSolutionsTitle || ''}
                        onChange={(e) => setContent({ ...content, professionalHrSolutionsTitle: e.target.value })}
                        placeholder="e.g. Professional HR Solutions"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Detailed Description (5-7 lines)</label>
                    <textarea 
                      rows={8}
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm leading-relaxed font-medium"
                      value={content.professionalHrSolutionsDescription || ''}
                      onChange={(e) => setContent({ ...content, professionalHrSolutionsDescription: e.target.value })}
                      placeholder="Describe your professional HR advisory and recruitment services in detail..."
                    ></textarea>
                    <CharacterCounter current={(content.professionalHrSolutionsDescription || '').length} max={1000} />
                  </div>
                </div>
                <div className="space-y-6">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Side Showcase Photo</label>
                  <div className="flex gap-2">
                    <input 
                      className="flex-grow px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm"
                      value={content.professionalHrSolutionsImageUrl || ''}
                      onChange={(e) => setContent({ ...content, professionalHrSolutionsImageUrl: e.target.value })}
                      placeholder="Image URL"
                    />
                    <label className="bg-brand-blue/5 p-3 rounded-xl cursor-pointer hover:bg-brand-blue/10 transition-all flex items-center justify-center text-brand-blue">
                      {uploading === 'professionalHrSolutionsImageUrl' ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'professionalHrSolutionsImageUrl')} />
                    </label>
                  </div>
                  {content.professionalHrSolutionsImageUrl && (
                    <div className="aspect-video bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                      <img src={content.professionalHrSolutionsImageUrl} alt="HR Solutions Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Core Strengths Section (Moved from About) */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-bold text-brand-blue mb-4 flex items-center gap-3">
                    <ShieldCheck className="text-brand-gold w-6 h-6" /> Core Strengths
                  </h3>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Core Strengths Title</label>
                  <input 
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold mb-6"
                    value={content.coreStrengthsTitle || ''}
                    onChange={(e) => setContent({ ...content, coreStrengthsTitle: e.target.value })}
                    placeholder="e.g. Our Core Strengths"
                  />
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Strengths List</label>
                    <button onClick={addStrength} className="text-brand-gold font-bold text-xs flex items-center gap-1">
                      <Plus size={14} /> Add Strength
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(content.coreStrengths || []).map((strength, index) => (
                      <div key={index} className="flex gap-2 group">
                        <input 
                          className="flex-1 px-4 py-2 rounded-lg border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-medium"
                          value={strength}
                          onChange={(e) => handleStrengthChange(index, e.target.value)}
                        />
                        <button onClick={() => removeStrength(index)} className="p-2 text-gray-300 hover:text-red-500 transition-colors bg-gray-100 rounded-lg">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-6 bg-brand-blue/5 rounded-2xl border border-brand-blue/10 mb-6">
                    <h4 className="text-sm font-black text-brand-blue uppercase tracking-widest mb-4 flex items-center gap-2">
                       <Zap size={16} /> Professional Edge Section
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Badge/Tagline</label>
                        <input 
                          className="w-full px-4 py-2 rounded-lg border border-gray-100 bg-white outline-none focus:border-brand-gold font-bold text-xs"
                          value={content.professionalEdgeTitle || ''}
                          onChange={(e) => setContent({ ...content, professionalEdgeTitle: e.target.value })}
                          placeholder="e.g. Professional Edge"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Headline</label>
                        <input 
                          className="w-full px-4 py-2 rounded-lg border border-gray-100 bg-white outline-none focus:border-brand-gold font-bold text-xs"
                          value={content.professionalEdgeSubtitle || ''}
                          onChange={(e) => setContent({ ...content, professionalEdgeSubtitle: e.target.value })}
                          placeholder="e.g. Mastering Global Talent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Description (4-5 lines)</label>
                      <textarea 
                        rows={4}
                        className="w-full px-4 py-2 rounded-lg border border-gray-100 bg-white outline-none focus:border-brand-gold text-xs leading-relaxed"
                        value={content.professionalEdgeDescription || ''}
                        onChange={(e) => setContent({ ...content, professionalEdgeDescription: e.target.value })}
                        placeholder="Add a detailed description that will appear on the left..."
                      />
                    </div>
                  </div>

                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Strengths Section Image</label>
                  <div className="flex gap-2">
                    <input 
                      className="flex-grow px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm"
                      value={content.coreStrengthsImageUrl || ''}
                      onChange={(e) => setContent({ ...content, coreStrengthsImageUrl: e.target.value })}
                      placeholder="Image URL"
                    />
                    <label className="bg-brand-blue/5 p-3 rounded-xl cursor-pointer hover:bg-brand-blue/10 transition-all flex items-center justify-center text-brand-blue">
                      {uploading === 'coreStrengthsImageUrl' ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'coreStrengthsImageUrl')} />
                    </label>
                  </div>
                  {content.coreStrengthsImageUrl && (
                    <div className="aspect-video bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                      <img src={content.coreStrengthsImageUrl} alt="Core Strengths Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Why Choose Us Section (Moved from About) */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <SectionHeader 
                title="Agency Advantages" 
                icon={CheckCircle2} 
                description="Highlight unique selling points that make your agency stand out."
                onToggle={() => setContent({ ...content, showWhyChooseUs: !content.showWhyChooseUs })}
                isVisible={content.showWhyChooseUs}
                onAdd={addWhyPoint}
              />
              <div className="space-y-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Advantage Section Title</label>
                    <input 
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                      value={content.whyChooseUs?.title || ''}
                      onChange={(e) => setContent({ ...content, whyChooseUs: { ...(content.whyChooseUs || { title: '', description: '', points: [] }), title: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Advantage Section Description</label>
                    <input 
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm"
                      value={content.whyChooseUs?.description || ''}
                      onChange={(e) => setContent({ ...content, whyChooseUs: { ...(content.whyChooseUs || { title: '', description: '', points: [] }), description: e.target.value } })}
                    />
                  </div>
                </div>
                
                <div className="mt-6">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Advantage Section Heading Image (Side Photo)</label>
                  <div className="flex gap-2">
                    <input 
                      className="flex-grow px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm"
                      value={content.whyChooseUsImageUrl || ''}
                      onChange={(e) => setContent({ ...content, whyChooseUsImageUrl: e.target.value })}
                      placeholder="Image URL"
                    />
                    <label className="bg-brand-blue/5 p-3 rounded-xl cursor-pointer hover:bg-brand-blue/10 transition-all flex items-center justify-center text-brand-blue">
                      {uploading === 'whyChooseUsImageUrl' ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'whyChooseUsImageUrl')} />
                    </label>
                  </div>
                  {content.whyChooseUsImageUrl && (
                    <div className="mt-4 aspect-video max-h-48 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                      <img src={content.whyChooseUsImageUrl} alt="Advantage Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(content.whyChooseUs?.points || []).map((point, i) => (
                  <div key={i} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 relative group pl-10">
                    <ReorderButtons 
                      onMoveUp={() => moveNestedItem('whyChooseUs', 'points', i, 'up')}
                      onMoveDown={() => moveNestedItem('whyChooseUs', 'points', i, 'down')}
                      isFirst={i === 0}
                      isLast={i === (content.whyChooseUs?.points || []).length - 1}
                    />
                    <button 
                      onClick={() => removeWhyPoint(i)}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-white text-red-400 rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:text-red-600 z-10"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="space-y-4">
                      <input 
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-gold transition-all text-sm font-bold bg-white"
                        value={point.title}
                        onChange={(e) => handleWhyPointChange(i, 'title', e.target.value)}
                        placeholder="Advantage Title"
                      />
                      <textarea 
                        rows={3}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-gold transition-all text-xs bg-white text-gray-500"
                        value={point.description}
                        onChange={(e) => handleWhyPointChange(i, 'description', e.target.value)}
                        placeholder="Short description..."
                      ></textarea>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom CTA moved to end of expertise for logical flow */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-brand-blue mb-8 flex items-center gap-3">
                <Target className="text-brand-gold w-6 h-6" /> Conversion Point (Bottom CTA)
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">CTA Headline</label>
                    <input 
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                      value={content.ctaTitle || ''}
                      onChange={(e) => setContent({ ...content, ctaTitle: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">CTA Explanation</label>
                    <textarea 
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm"
                      value={content.ctaDescription || ''}
                      onChange={(e) => setContent({ ...content, ctaDescription: e.target.value })}
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Action Button Label</label>
                    <input 
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                      value={content.ctaButtonText || ''}
                      onChange={(e) => setContent({ ...content, ctaButtonText: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">CTA Background Visual</label>
                  <div className="flex gap-2">
                    <input 
                      className="flex-grow px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm"
                      value={content.whyChooseUsImageUrl || ''}
                      onChange={(e) => setContent({ ...content, whyChooseUsImageUrl: e.target.value })}
                    />
                    <label className="bg-brand-blue/5 p-3 rounded-xl cursor-pointer hover:bg-brand-blue/10 transition-all flex items-center justify-center text-brand-blue">
                      {uploading === 'whyChooseUsImageUrl' ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'whyChooseUsImageUrl')} />
                    </label>
                  </div>
                  {content.whyChooseUsImageUrl && (
                    <div className="aspect-video bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                      <img src={content.whyChooseUsImageUrl} alt="CTA Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'impact' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Global Standards Banner */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-brand-blue mb-8 flex items-center gap-3">
                <Globe className="text-brand-gold w-6 h-6" /> Commitment & Global Standards
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Standards Tagline</label>
                      <input 
                        className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                        value={content.globalStandardsTagline || ''}
                        onChange={(e) => setContent({ ...content, globalStandardsTagline: e.target.value })}
                        placeholder="e.g. Quality Commitment"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Standards Headline</label>
                      <input 
                        className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                        value={content.globalStandardsTitle || ''}
                        onChange={(e) => setContent({ ...content, globalStandardsTitle: e.target.value })}
                        placeholder="e.g. World Class Standards"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Standards Message</label>
                    <textarea 
                      rows={6}
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm leading-relaxed"
                      value={content.globalStandardsDescription || ''}
                      onChange={(e) => setContent({ ...content, globalStandardsDescription: e.target.value })}
                      placeholder="Explain your commitment to international recruitment standards..."
                    />
                  </div>
                </div>
                <div className="space-y-6">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Standards Banner Visual</label>
                  <div className="flex gap-2">
                    <input 
                      className="flex-grow px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm"
                      value={content.globalStandardsImageUrl || ''}
                      onChange={(e) => setContent({ ...content, globalStandardsImageUrl: e.target.value })}
                      placeholder="Image URL"
                    />
                    <label className="bg-brand-blue/5 p-3 rounded-xl cursor-pointer hover:bg-brand-blue/10 transition-all flex items-center justify-center text-brand-blue">
                      {uploading === 'globalStandardsImageUrl' ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'globalStandardsImageUrl')} />
                    </label>
                  </div>
                  {content.globalStandardsImageUrl && (
                    <div className="aspect-video bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 shadow-md">
                      <img src={content.globalStandardsImageUrl} alt="Standards Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Section (Moved from General) */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <SectionHeader 
                title="Impact Statistics" 
                icon={TrendingUp} 
                description="Highlight key numbers that prove your agency's scale and success."
                onToggle={() => setContent({ ...content, showStats: !content.showStats })}
                isVisible={content.showStats}
                onAdd={addStat}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                {content.stats?.map((stat, i) => (
                  <div key={i} className="group bg-gray-50 p-6 rounded-2xl border border-gray-100 relative pl-10">
                    <ReorderButtons 
                      onMoveUp={() => moveItem('stats', i, 'up')}
                      onMoveDown={() => moveItem('stats', i, 'down')}
                      isFirst={i === 0}
                      isLast={i === (content.stats?.length || 0) - 1}
                    />
                    <button 
                      onClick={() => setContent({ ...content, stats: content.stats!.filter((_, idx) => idx !== i) })}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-white text-red-400 rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:text-red-600 z-10"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="space-y-4">
                      <input 
                        placeholder="Value (e.g. 500+)"
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-gold bg-white font-bold text-lg text-brand-blue"
                        value={stat.value}
                        onChange={(e) => {
                          const newStats = [...content.stats!];
                          newStats[i].value = e.target.value;
                          setContent({ ...content, stats: newStats });
                        }}
                      />
                      <input 
                        placeholder="Label"
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-gold bg-white text-xs font-semibold text-gray-500"
                        value={stat.label}
                        onChange={(e) => {
                          const newStats = [...content.stats!];
                          newStats[i].label = e.target.value;
                          setContent({ ...content, stats: newStats });
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'services' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Services Section */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <SectionHeader 
                title="Professional Services" 
                icon={Briefcase} 
                description="List the core services your agency provides to candidates and clients."
                onToggle={() => setContent({ ...content, showServices: !content.showServices })}
                isVisible={content.showServices}
                onAdd={addService}
              />
              
              <div className="mb-12 p-8 bg-brand-blue/5 rounded-[2.5rem] border border-brand-blue/10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Services Tagline</label>
                    <input 
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-white outline-none focus:border-brand-gold transition-all text-sm font-bold"
                      value={content.servicesTagline || ''}
                      onChange={(e) => setContent({ ...content, servicesTagline: e.target.value })}
                      placeholder="e.g. Expertise & Advantage"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Services Title</label>
                    <input 
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-white outline-none focus:border-brand-gold transition-all text-sm font-bold"
                      value={content.servicesTitle || ''}
                      onChange={(e) => setContent({ ...content, servicesTitle: e.target.value })}
                      placeholder="e.g. Professional HR Solutions"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Services Subtitle</label>
                    <textarea 
                      rows={1}
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-white outline-none focus:border-brand-gold transition-all text-sm"
                      value={content.servicesSubtitle || ''}
                      onChange={(e) => setContent({ ...content, servicesSubtitle: e.target.value })}
                    ></textarea>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Section Main Image</label>
                    <p className="text-sm text-gray-500 mb-4">This image will appear next to the Professional HR Solutions title on the homepage.</p>
                    <div className="flex gap-2">
                      <input 
                        className="flex-grow px-4 py-3 rounded-xl border border-gray-100 bg-white outline-none focus:border-brand-gold transition-all text-sm"
                        value={content.servicesImageUrl || ''}
                        onChange={(e) => setContent({ ...content, servicesImageUrl: e.target.value })}
                        placeholder="Image URL"
                      />
                      <label className="bg-brand-blue text-white p-3 rounded-xl cursor-pointer hover:bg-brand-gold hover:text-brand-blue transition-all flex items-center justify-center">
                        {uploading === 'servicesImageUrl' ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'servicesImageUrl')} />
                      </label>
                    </div>
                  </div>
                  {content.servicesImageUrl && (
                    <div className="aspect-video lg:aspect-square bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100">
                      <img src={content.servicesImageUrl} alt="Services Section Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {content.services.map((service, i) => (
                  <div key={i} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 relative group pl-10">
                    <ReorderButtons 
                      onMoveUp={() => moveItem('services', i, 'up')}
                      onMoveDown={() => moveItem('services', i, 'down')}
                      isFirst={i === 0}
                      isLast={i === content.services.length - 1}
                    />
                    <button 
                      onClick={() => removeService(i)}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-white text-red-400 rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="space-y-4">
                      <input 
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-gold transition-all text-sm font-bold bg-white"
                        value={service.title}
                        onChange={(e) => handleServiceChange(i, 'title', e.target.value)}
                        placeholder="Service Title"
                      />
                      <textarea 
                        rows={3}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-gold transition-all text-xs bg-white text-gray-500"
                        value={service.description}
                        onChange={(e) => handleServiceChange(i, 'description', e.target.value)}
                        placeholder="Description"
                      ></textarea>
                      <div className="flex gap-2">
                        <input 
                          className="flex-grow px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-gold transition-all text-[10px] bg-white"
                          value={service.imageUrl || ''}
                          onChange={(e) => handleServiceChange(i, 'imageUrl', e.target.value)}
                          placeholder="Image URL"
                        />
                        {service.imageUrl && <CopyButton text={service.imageUrl} />}
                        <label className="bg-brand-blue/5 p-2 rounded-lg cursor-pointer hover:bg-brand-blue/10 transition-all flex items-center justify-center text-brand-blue">
                          {uploading === `service_${i}` ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, `service_${i}`, i)} />
                        </label>
                      </div>
                      {service.imageUrl && service.imageUrl !== "" && (
                        <div className="aspect-video rounded-lg overflow-hidden border border-gray-100">
                          <img src={service.imageUrl} alt="Service Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Our Process Section */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <SectionHeader 
                title="Our Recruitment Process" 
                icon={Target} 
                description="A transparent and efficient journey from application to deployment."
                onToggle={() => setContent({ ...content, showProcess: !content.showProcess })}
                isVisible={content.showProcess}
                onAdd={addProcessStep}
              />
              <div className="space-y-6 mb-8">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Our Process Section Title</label>
                    <input 
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold mb-6"
                      value={content.ourProcessTitle || ''}
                      onChange={(e) => setContent({ ...content, ourProcessTitle: e.target.value })}
                      placeholder="e.g. The Recruitment Process"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Process Tagline</label>
                      <input 
                        className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                        value={content.ourProcess?.title || ''}
                        onChange={(e) => setContent({ ...content, ourProcess: { ...content.ourProcess!, title: e.target.value } })}
                        placeholder="e.g. Our Method"
                      />
                      <CharacterCounter current={(content.ourProcess?.title || '').length} max={50} />
                    </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Process Description</label>
                    <input 
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm"
                      value={content.ourProcess?.description || ''}
                      onChange={(e) => setContent({ ...content, ourProcess: { ...content.ourProcess!, description: e.target.value } })}
                    />
                    <CharacterCounter current={(content.ourProcess?.description || '').length} max={150} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {(content.ourProcess?.steps || []).map((step, i) => (
                  <div key={i} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 relative group pl-10">
                    <ReorderButtons 
                      onMoveUp={() => moveNestedItem('ourProcess', 'steps', i, 'up')}
                      onMoveDown={() => moveNestedItem('ourProcess', 'steps', i, 'down')}
                      isFirst={i === 0}
                      isLast={i === (content.ourProcess?.steps || []).length - 1}
                    />
                    <div className="absolute -top-3 -left-3 w-8 h-8 bg-brand-blue text-white rounded-full flex items-center justify-center font-bold text-xs shadow-lg">
                      {i + 1}
                    </div>
                    <button 
                      onClick={() => removeProcessStep(i)}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-white text-red-400 rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="space-y-4 mt-2">
                      <input 
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-gold transition-all text-sm font-bold bg-white"
                        value={step.title}
                        onChange={(e) => handleProcessStepChange(i, 'title', e.target.value)}
                        placeholder="Step Title"
                      />
                      <textarea 
                        rows={3}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-gold transition-all text-xs bg-white text-gray-500"
                        value={step.description}
                        onChange={(e) => handleProcessStepChange(i, 'description', e.target.value)}
                        placeholder="Description"
                      ></textarea>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'contact' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Contact Info */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-brand-blue mb-8 flex items-center gap-3">
                <Phone className="text-brand-gold w-6 h-6" /> Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Contact Email</label>
                  <input 
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm"
                    value={content.contactEmail || ''}
                    onChange={(e) => setContent({ ...content, contactEmail: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Contact Phone</label>
                  <input 
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm"
                    value={content.contactPhone || ''}
                    onChange={(e) => setContent({ ...content, contactPhone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">WhatsApp Number</label>
                  <input 
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm"
                    value={content.whatsappNumber || ''}
                    onChange={(e) => setContent({ ...content, whatsappNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Office Address</label>
                  <input 
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm"
                    value={content.contactAddress || ''}
                    onChange={(e) => setContent({ ...content, contactAddress: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Google Maps URL (Visit Our Office)</label>
                  <input 
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm"
                    value={content.officeMapUrl || ''}
                    onChange={(e) => setContent({ ...content, officeMapUrl: e.target.value })}
                    placeholder="https://maps.app.goo.gl/..."
                  />
                </div>
              </div>
            </div>

            {/* Branch Offices */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-brand-blue flex items-center gap-3">
                  <MapPin className="text-brand-gold w-6 h-6" /> Branch Offices
                </h3>
                <button 
                  onClick={() => setContent({ ...content, branchOffices: [...(content.branchOffices || []), { location: '', address: '', phone: '', email: '' }] })}
                  className="bg-brand-gold/10 text-brand-gold px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-brand-gold hover:text-brand-blue transition-all"
                >
                  <Plus size={18} /> Add Branch
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(content.branchOffices || []).map((branch, i) => (
                  <div key={i} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 relative group">
                    <button 
                      onClick={() => setContent({ ...content, branchOffices: content.branchOffices!.filter((_, idx) => idx !== i) })}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-white text-red-400 rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="space-y-4">
                      <input 
                        placeholder="Branch Name"
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-gold transition-all text-sm font-bold bg-white"
                        value={branch.location}
                        onChange={(e) => {
                          const newBranches = [...content.branchOffices!];
                          newBranches[i].location = e.target.value;
                          setContent({ ...content, branchOffices: newBranches });
                        }}
                      />
                      <input 
                        placeholder="Address"
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-gold transition-all text-xs bg-white"
                        value={branch.address}
                        onChange={(e) => {
                          const newBranches = [...content.branchOffices!];
                          newBranches[i].address = e.target.value;
                          setContent({ ...content, branchOffices: newBranches });
                        }}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input 
                          placeholder="Phone"
                          className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-gold transition-all text-xs bg-white"
                          value={branch.phone}
                          onChange={(e) => {
                            const newBranches = [...content.branchOffices!];
                            newBranches[i].phone = e.target.value;
                            setContent({ ...content, branchOffices: newBranches });
                          }}
                        />
                        <input 
                          placeholder="Email"
                          className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-gold transition-all text-xs bg-white"
                          value={branch.email}
                          onChange={(e) => {
                            const newBranches = [...content.branchOffices!];
                            newBranches[i].email = e.target.value;
                            setContent({ ...content, branchOffices: newBranches });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'data' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* FAQs Section */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <SectionHeader 
                title="Frequently Asked Questions" 
                icon={HelpCircle} 
                description="Address common queries from candidates and employers."
                onToggle={() => setContent({ ...content, showFaqs: !content.showFaqs })}
                isVisible={content.showFaqs}
                onAdd={addFaq}
              />
              <div className="space-y-4">
                {(content.faqs || []).map((faq, i) => (
                  <div key={i} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 relative group pl-10">
                    <ReorderButtons 
                      onMoveUp={() => moveItem('faqs', i, 'up')}
                      onMoveDown={() => moveItem('faqs', i, 'down')}
                      isFirst={i === 0}
                      isLast={i === (content.faqs || []).length - 1}
                    />
                    <button 
                      onClick={() => removeFaq(i)}
                      className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Question</label>
                        <input 
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold transition-all text-sm font-bold bg-white"
                          value={faq.question}
                          onChange={(e) => handleFaqChange(i, 'question', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Answer</label>
                        <textarea 
                          rows={2}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold transition-all text-sm bg-white"
                          value={faq.answer}
                          onChange={(e) => handleFaqChange(i, 'answer', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section Headers for Lists */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-12">
              <div>
                <h4 className="text-md font-bold text-brand-blue mb-6 flex items-center gap-3">
                  <Briefcase className="text-brand-gold w-5 h-5" /> Featured Jobs Header
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Jobs Tagline</label>
                    <input 
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold transition-all text-sm font-bold bg-white"
                      value={content.jobsTagline || ''}
                      onChange={(e) => setContent({ ...content, jobsTagline: e.target.value })}
                      placeholder="e.g. Opportunities"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Jobs Title</label>
                    <input 
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold transition-all text-sm font-bold bg-white"
                      value={content.jobsTitle || ''}
                      onChange={(e) => setContent({ ...content, jobsTitle: e.target.value })}
                      placeholder="e.g. Featured Job Openings"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Jobs Subtitle</label>
                    <textarea 
                      rows={1}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold transition-all text-sm bg-white"
                      value={content.jobsSubtitle || ''}
                      onChange={(e) => setContent({ ...content, jobsSubtitle: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-gray-100">
                <h4 className="text-md font-bold text-brand-blue mb-6 flex items-center gap-3">
                  <Target className="w-5 h-5 text-gradient" /> Visa Success Gallery Header
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Success Tagline</label>
                    <input 
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold transition-all text-sm font-bold bg-white"
                      value={content.successStoriesTagline || ''}
                      onChange={(e) => setContent({ ...content, successStoriesTagline: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Success Title</label>
                    <input 
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold transition-all text-sm font-bold bg-white"
                      value={content.successStoriesTitle || ''}
                      onChange={(e) => setContent({ ...content, successStoriesTitle: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Success Subtitle</label>
                    <textarea 
                      rows={1}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold transition-all text-sm bg-white"
                      value={content.successStoriesSubtitle || ''}
                      onChange={(e) => setContent({ ...content, successStoriesSubtitle: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-gray-100">
                <h3 className="text-xl font-bold text-brand-blue mb-8 flex items-center gap-3">
                  <Globe className="text-brand-gold w-6 h-6" /> Countries Section Header
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Section Tagline</label>
                  <input 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold transition-all text-sm font-bold bg-white"
                    value={content.countriesTagline || ''}
                    onChange={(e) => setContent({ ...content, countriesTagline: e.target.value })}
                    placeholder="e.g. Global Reach"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Section Title</label>
                  <input 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold transition-all text-sm font-bold bg-white"
                    value={content.countriesTitle || ''}
                    onChange={(e) => setContent({ ...content, countriesTitle: e.target.value })}
                    placeholder="e.g. Countries We Serve"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Section Description</label>
                  <textarea 
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold transition-all text-sm bg-white"
                    value={content.countriesDescription || ''}
                    onChange={(e) => setContent({ ...content, countriesDescription: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Countries */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-brand-blue flex items-center gap-2">
                    <MapPin className="text-brand-gold" size={20} /> Countries
                  </h3>
                  <button onClick={() => addListItem('countries')} className="text-brand-gold hover:text-brand-blue">
                    <Plus size={20} />
                  </button>
                </div>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {(content.countries || []).map((country, i) => (
                    <div key={i} className="flex gap-2 group">
                      <input 
                        className="flex-1 px-4 py-2 rounded-lg border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm"
                        value={country}
                        onChange={(e) => handleListChange('countries', i, e.target.value)}
                      />
                      <button onClick={() => removeListItem('countries', i)} className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Job Positions */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-brand-blue flex items-center gap-2">
                    <Briefcase className="text-brand-gold" size={20} /> Positions
                  </h3>
                  <button onClick={() => addListItem('jobPositions')} className="text-brand-gold hover:text-brand-blue">
                    <Plus size={20} />
                  </button>
                </div>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {(content.jobPositions || []).map((pos, i) => (
                    <div key={i} className="flex gap-2 group">
                      <input 
                        className="flex-1 px-4 py-2 rounded-lg border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm"
                        value={pos}
                        onChange={(e) => handleListChange('jobPositions', i, e.target.value)}
                      />
                      <button onClick={() => removeListItem('jobPositions', i)} className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Job Categories */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-brand-blue flex items-center gap-2">
                    <Database className="text-brand-gold" size={20} /> Categories
                  </h3>
                  <button onClick={() => addListItem('jobCategories')} className="text-brand-gold hover:text-brand-blue">
                    <Plus size={20} />
                  </button>
                </div>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {(content.jobCategories || []).map((cat, i) => (
                    <div key={i} className="flex gap-2 group">
                      <input 
                        className="flex-1 px-4 py-2 rounded-lg border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm"
                        value={cat}
                        onChange={(e) => handleListChange('jobCategories', i, e.target.value)}
                      />
                      <button onClick={() => removeListItem('jobCategories', i)} className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
        {activeTab === 'partners' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <SectionHeader 
                title="Industry Leaders & Partners" 
                icon={Users2} 
                description="Display logos of companies you've successfully partnered with."
                onToggle={() => setContent({ ...content, showPartners: !content.showPartners })}
                isVisible={content.showPartners}
                onAdd={() => setContent({ ...content, partners: [...(content.partners || []), { name: '', logoUrl: '' }] })}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-8 border-t border-gray-50">
                {(content.partners || []).map((partner, i) => (
                  <div key={i} className="group bg-gray-50 p-6 rounded-2xl border border-gray-100 relative pl-10">
                    <ReorderButtons 
                      onMoveUp={() => moveItem('partners', i, 'up')}
                      onMoveDown={() => moveItem('partners', i, 'down')}
                      isFirst={i === 0}
                      isLast={i === (content.partners || []).length - 1}
                    />
                    <button 
                      onClick={() => setContent({ ...content, partners: content.partners!.filter((_, idx) => idx !== i) })}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-white text-red-400 rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:text-red-600 z-10"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Partner Name</label>
                        <input 
                          className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-gold bg-white font-bold text-brand-blue"
                          value={partner.name}
                          onChange={(e) => {
                            const newPartners = [...content.partners!];
                            newPartners[i].name = e.target.value;
                            setContent({ ...content, partners: newPartners });
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Logo URL</label>
                        <div className="flex gap-2">
                          <input 
                            className="flex-grow px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-gold bg-white text-sm"
                            value={partner.logoUrl}
                            onChange={(e) => {
                              const newPartners = [...content.partners!];
                              newPartners[i].logoUrl = e.target.value;
                              setContent({ ...content, partners: newPartners });
                            }}
                          />
                          <label className="bg-brand-blue/5 p-2 rounded-lg cursor-pointer hover:bg-brand-blue/10 transition-all flex items-center justify-center text-brand-blue">
                            {uploading === `partner_${i}` ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                            <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setUploading(`partner_${i}`);
                              try {
                                const storage = getStorage();
                                const storageRef = ref(storage, `partners/logo-${Date.now()}`);
                                await uploadBytes(storageRef, file);
                                const url = await getDownloadURL(storageRef);
                                const newPartners = [...content.partners!];
                                newPartners[i].logoUrl = url;
                                setContent({ ...content, partners: newPartners });
                                toast.success('Logo uploaded');
                              } catch (err) {
                                toast.error('Upload failed');
                              } finally {
                                setUploading(null);
                              }
                            }} />
                          </label>
                        </div>
                      </div>
                      {partner.logoUrl && partner.logoUrl !== "" && (
                        <div className="h-20 bg-white rounded-xl flex items-center justify-center p-4 border border-gray-100">
                          <img src={partner.logoUrl} alt={partner.name} className="max-h-full object-contain" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'living' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Living Section Header */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-brand-blue mb-8 flex items-center gap-3">
                <Home className="text-brand-gold w-6 h-6" /> Living & Accommodation Section
              </h3>
              <div className="grid grid-cols-1 gap-8">
                <div className="space-y-4">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Living Section Title (HomePage Main Heading)</label>
                  <input 
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                    value={content.livingSectionTitle || ''}
                    onChange={(e) => setContent({ ...content, livingSectionTitle: e.target.value })}
                    placeholder="e.g. Seamless European Integration"
                  />
                </div>
                <div className="space-y-4">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Living Section Tagline</label>
                  <input 
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm"
                    value={content.livingSection?.title || ''}
                    onChange={(e) => setContent({ ...content, livingSection: { ...content.livingSection!, title: e.target.value } })}
                    placeholder="e.g. Beyond the Workplace"
                  />
                </div>
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-gray-700">Section Description</label>
                  <textarea 
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all"
                    value={content.livingSection?.description || ''}
                    onChange={(e) => setContent({ ...content, livingSection: { ...content.livingSection!, description: e.target.value } })}
                    placeholder="Describe the living conditions and support provided..."
                  />
                </div>
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-gray-700">Section Image</label>
                  <div className="flex flex-col gap-4">
                    <div className="flex gap-2">
                      <input 
                        className="flex-grow px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm"
                        value={content.livingSection?.imageUrl || ''}
                        onChange={(e) => setContent({ ...content, livingSection: { ...content.livingSection!, imageUrl: e.target.value } })}
                        placeholder="Image URL"
                      />
                      {content.livingSection?.imageUrl && <CopyButton text={content.livingSection.imageUrl} />}
                      <label className="bg-brand-blue/5 p-3 rounded-xl cursor-pointer hover:bg-brand-blue/10 transition-all flex items-center justify-center text-brand-blue">
                        {uploading === 'livingSection_image' ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'livingSection_image')} />
                      </label>
                    </div>
                    {content.livingSection?.imageUrl && content.livingSection.imageUrl !== "" && (
                      <div className="p-6 bg-gray-50 rounded-2xl flex items-center justify-center border border-dashed border-gray-200">
                        <img src={content.livingSection.imageUrl} alt="Living Preview" className="max-h-48 rounded-xl object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Living Features */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <SectionHeader 
                title="Key Features" 
                icon={CheckCircle2} 
                description="Detail the specific benefits of the accommodation provided."
                onAdd={addLivingFeature}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(content.livingSection?.features || []).map((feature, i) => (
                  <div key={i} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 relative group pl-10">
                    <ReorderButtons 
                      onMoveUp={() => moveNestedItem('livingSection', 'features', i, 'up')}
                      onMoveDown={() => moveNestedItem('livingSection', 'features', i, 'down')}
                      isFirst={i === 0}
                      isLast={i === (content.livingSection?.features || []).length - 1}
                    />
                    <button 
                      onClick={() => removeLivingFeature(i)}
                      className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                    <div className="space-y-4">
                      <input 
                        className="w-full px-4 py-2 rounded-lg border border-gray-100 bg-white outline-none focus:border-brand-gold transition-all font-bold text-brand-blue"
                        value={feature.title}
                        onChange={(e) => handleLivingFeatureChange(i, 'title', e.target.value)}
                        placeholder="Feature Title"
                      />
                      <textarea 
                        rows={3}
                        className="w-full px-4 py-2 rounded-lg border border-gray-100 bg-white outline-none focus:border-brand-gold transition-all text-sm text-gray-500"
                        value={feature.description}
                        onChange={(e) => handleLivingFeatureChange(i, 'description', e.target.value)}
                        placeholder="Feature Description"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'visibility' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-brand-blue mb-8 flex items-center gap-3">
                <LayoutGrid className="text-brand-gold w-6 h-6" /> Home Page Layout Manager
              </h3>
              <p className="text-gray-500 mb-8">Drag and drop sections to reorder them, or use the toggles to hide/show sections on the homepage.</p>
              
              <div className="space-y-4 max-w-2xl">
                {[
                  { id: 'showStats', label: 'Statistics Counter', description: 'Displays your agency impact numbers.' },
                  { id: 'showServices', label: 'Our Services', description: 'Showcases the professional services you offer.' },
                  { id: 'showWhyChooseUs', label: 'Why Choose Us', description: 'Highlights your unique selling points.' },
                  { id: 'showCountries', label: 'Countries We Serve', description: 'Lists the countries where you have job openings.' },
                  { id: 'showProcess', label: 'Our Process', description: 'Explains the recruitment journey steps.' },
                  { id: 'showFaqs', label: 'FAQs', description: 'Answers common questions from users.' },
                  { id: 'showPartners', label: 'Our Partners/Clients', description: 'Displays logos of industry partners.' },
                  { id: 'showSuccessStories', label: 'Visa Success Stories', description: 'Shows real-life candidate success stories.' },
                  { id: 'showDiary', label: 'Latest from Diary', description: 'Displays recent blog posts or news.' },
                  { id: 'showLivingSection', label: 'Living & Accommodation', description: 'Details about housing and support.' },
                ].map((section) => (
                  <div key={section.id} className={cn(
                    "flex items-center justify-between p-6 rounded-2xl border transition-all",
                    (content as any)[section.id] ? "bg-white border-brand-gold/20 shadow-md" : "bg-gray-50 border-gray-100 opacity-60"
                  )}>
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        (content as any)[section.id] ? "bg-brand-gold/10 text-brand-gold" : "bg-gray-200 text-gray-400"
                      )}>
                        <LayoutGrid size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-brand-blue">{section.label}</h4>
                        <p className="text-xs text-gray-500">{section.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setContent({ ...content, [section.id]: !(content as any)[section.id] })}
                      className={cn(
                        "w-14 h-7 rounded-full transition-all relative",
                        (content as any)[section.id] ? "bg-brand-gold" : "bg-gray-300"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm",
                        (content as any)[section.id] ? "right-1" : "left-1"
                      )} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'styles' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-brand-blue mb-8 flex items-center gap-3">
                <Zap className="text-brand-gold w-6 h-6" /> Typography & Color Identities
              </h3>
              <p className="text-gray-500 mb-8 max-w-2xl">
                Customize the emotional tone of your website by choosing premium font pairings and colors for key hero elements.
              </p>

              <div className="grid grid-cols-1 gap-12">
                {[
                  { label: 'Hero Tagline', key: 'heroTagline' },
                  { label: 'Hero Title', key: 'heroTitle' },
                  { label: 'Hero Description', key: 'heroDescription' },
                  { label: 'Hero Primary Button', key: 'heroPrimaryCta', isButton: true },
                  { label: 'Hero Secondary Button', key: 'heroSecondaryCta', isButton: true },
                  { label: 'Bottom Call to Action', key: 'bottomCta', isSection: true }
                ].map((section) => (
                  <div key={section.key} className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100">
                    <h4 className="text-lg font-black text-brand-blue uppercase tracking-widest mb-8 border-l-4 border-brand-teal pl-6">
                      {section.label}
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                      {/* Font Selection */}
                      <div className="space-y-4">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Font Family</label>
                        <div className="grid grid-cols-1 gap-2">
                          {FONT_OPTIONS.map(f => (
                            <button
                              key={f.id}
                              onClick={() => {
                                const newStyles = { ...(content.styles || {}) };
                                if (!newStyles[section.key as keyof typeof newStyles]) (newStyles as any)[section.key] = {};
                                (newStyles as any)[section.key].font = f.id;
                                setContent({ ...content, styles: newStyles });
                              }}
                              className={cn(
                                "flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-sm font-bold",
                                (content.styles as any)?.[section.key]?.font === f.id
                                  ? "bg-brand-blue text-white ring-4 ring-brand-blue/5 border-transparent"
                                  : "bg-white text-slate-600 border-slate-100 hover:border-brand-teal"
                              )}
                            >
                              <span className={cn(
                                f.id === 'serif' ? 'font-serif' : 
                                f.id === 'space' ? 'font-space' : 
                                f.id === 'outfit' ? 'font-outfit' : 
                                f.id === 'mono' ? 'font-mono' : 'font-sans'
                              )}>{f.label}</span>
                              {(content.styles as any)?.[section.key]?.font === f.id && <CheckCircle2 size={16} />}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Color Palette */}
                      {!section.isButton && !section.isSection && (
                        <div className="space-y-4">
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Text Color</label>
                          <div className="grid grid-cols-1 gap-2">
                            {COLOR_OPTIONS.map(c => (
                              <button
                                key={c.id}
                                onClick={() => {
                                  const newStyles = { ...(content.styles || {}) };
                                  if (!newStyles[section.key as keyof typeof newStyles]) (newStyles as any)[section.key] = {};
                                  (newStyles as any)[section.key].color = c.id;
                                  setContent({ ...content, styles: newStyles });
                                }}
                                className={cn(
                                  "flex items-center gap-4 px-4 py-3 rounded-xl border transition-all text-sm font-bold",
                                  (content.styles as any)?.[section.key]?.color === c.id
                                    ? "bg-brand-blue text-white ring-4 ring-brand-blue/5 border-transparent"
                                    : "bg-white text-slate-600 border-slate-100 hover:border-brand-teal"
                                )}
                              >
                                <div className={cn("w-6 h-6 rounded-lg", c.class)}></div>
                                {c.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Button Styling */}
                      {section.isButton && (
                        <>
                          <div className="space-y-4">
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Background Color</label>
                            <div className="grid grid-cols-1 gap-2">
                              {COLOR_OPTIONS.filter(c => c.id !== 'white').map(c => (
                                <button
                                  key={c.id}
                                  onClick={() => {
                                    const newStyles = { ...(content.styles || {}) };
                                    if (!newStyles[section.key as keyof typeof newStyles]) (newStyles as any)[section.key] = {};
                                    (newStyles as any)[section.key].bgColor = c.id;
                                    setContent({ ...content, styles: newStyles });
                                  }}
                                  className={cn(
                                    "flex items-center gap-4 px-4 py-3 rounded-xl border transition-all text-sm font-bold",
                                    (content.styles as any)?.[section.key]?.bgColor === c.id
                                      ? "bg-brand-blue text-white ring-4 ring-brand-blue/5 border-transparent"
                                      : "bg-white text-slate-600 border-slate-100 hover:border-brand-teal"
                                  )}
                                >
                                  <div className={cn("w-6 h-6 rounded-lg", c.class)}></div>
                                  {c.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-4">
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Text Color</label>
                            <div className="grid grid-cols-1 gap-2">
                              {COLOR_OPTIONS.filter(c => c.id === 'white' || c.id === 'blue').map(c => (
                                <button
                                  key={c.id}
                                  onClick={() => {
                                    const newStyles = { ...(content.styles || {}) };
                                    if (!newStyles[section.key as keyof typeof newStyles]) (newStyles as any)[section.key] = {};
                                    (newStyles as any)[section.key].textColor = c.id;
                                    setContent({ ...content, styles: newStyles });
                                  }}
                                  className={cn(
                                    "flex items-center gap-4 px-4 py-3 rounded-xl border transition-all text-sm font-bold",
                                    (content.styles as any)?.[section.key]?.textColor === c.id
                                      ? "bg-brand-blue text-white ring-4 ring-brand-blue/5 border-transparent"
                                      : "bg-white text-slate-600 border-slate-100 hover:border-brand-teal"
                                  )}
                                >
                                  <div className={cn("w-6 h-6 rounded-lg", c.class)}></div>
                                  {c.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {/* Section Specific Styling (Bottom CTA) */}
                      {section.isSection && (
                         <>
                          <div className="space-y-4">
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Title Color</label>
                            <div className="grid grid-cols-1 gap-2">
                              {['blue', 'teal', 'gold'].map(cid => {
                                const c = COLOR_OPTIONS.find(x => x.id === cid)!;
                                return (
                                  <button
                                    key={c.id}
                                    onClick={() => {
                                      const newStyles = { ...(content.styles || {}) };
                                      if (!newStyles[section.key as keyof typeof newStyles]) (newStyles as any)[section.key] = {};
                                      (newStyles as any)[section.key].titleColor = c.id;
                                      setContent({ ...content, styles: newStyles });
                                    }}
                                    className={cn(
                                      "flex items-center gap-4 px-4 py-3 rounded-xl border transition-all text-sm font-bold",
                                      (content.styles as any)?.[section.key]?.titleColor === c.id
                                        ? "bg-brand-blue text-white ring-4 ring-brand-blue/5 border-transparent"
                                        : "bg-white text-slate-600 border-slate-100 hover:border-brand-teal"
                                    )}
                                  >
                                    <div className={cn("w-6 h-6 rounded-lg", c.class)}></div>
                                    {c.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <div className="space-y-4">
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Button Background</label>
                            <div className="grid grid-cols-1 gap-2">
                              {['blue', 'teal', 'gold'].map(cid => {
                                const c = COLOR_OPTIONS.find(x => x.id === cid)!;
                                return (
                                  <button
                                    key={c.id}
                                    onClick={() => {
                                      const newStyles = { ...(content.styles || {}) };
                                      if (!newStyles[section.key as keyof typeof newStyles]) (newStyles as any)[section.key] = {};
                                      (newStyles as any)[section.key].buttonBgColor = c.id;
                                      setContent({ ...content, styles: newStyles });
                                    }}
                                    className={cn(
                                      "flex items-center gap-4 px-4 py-3 rounded-xl border transition-all text-sm font-bold",
                                      (content.styles as any)?.[section.key]?.buttonBgColor === c.id
                                        ? "bg-brand-blue text-white ring-4 ring-brand-blue/5 border-transparent"
                                        : "bg-white text-slate-600 border-slate-100 hover:border-brand-teal"
                                    )}
                                  >
                                    <div className={cn("w-6 h-6 rounded-lg", c.class)}></div>
                                    {c.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                         </>
                      )}

                      {/* Preview Area */}
                      <div className="space-y-4 lg:col-span-1">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Live Suggestion</label>
                        <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-inner flex items-center justify-center min-h-[160px] text-center">
                          {!section.isButton && !section.isSection && (
                            <p className={cn(
                              "text-2xl font-black",
                              (content.styles as any)?.[section.key]?.font === 'serif' ? 'font-serif' : 
                              (content.styles as any)?.[section.key]?.font === 'space' ? 'font-space' : 
                              (content.styles as any)?.[section.key]?.font === 'outfit' ? 'font-outfit' : 
                              (content.styles as any)?.[section.key]?.font === 'mono' ? 'font-mono' : 'font-sans',
                              (content.styles as any)?.[section.key]?.color === 'teal' ? 'text-brand-teal' :
                              (content.styles as any)?.[section.key]?.color === 'rose' ? 'text-brand-rose' :
                              (content.styles as any)?.[section.key]?.color === 'gold' ? 'text-brand-gold' :
                              (content.styles as any)?.[section.key]?.color === 'blue' ? 'text-brand-blue' :
                              (content.styles as any)?.[section.key]?.color === 'white' ? 'text-white' : 'text-slate-900'
                            )}>
                              Premium Excellence
                            </p>
                          )}
                          {section.isButton && (
                            <div className={cn(
                              "px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg",
                              (content.styles as any)?.[section.key]?.font === 'serif' ? 'font-serif' : 
                              (content.styles as any)?.[section.key]?.font === 'space' ? 'font-space' : 
                              (content.styles as any)?.[section.key]?.font === 'outfit' ? 'font-outfit' : 
                              (content.styles as any)?.[section.key]?.font === 'mono' ? 'font-mono' : 'font-sans',
                              (content.styles as any)?.[section.key]?.bgColor === 'teal' ? 'bg-brand-teal' :
                              (content.styles as any)?.[section.key]?.bgColor === 'rose' ? 'bg-brand-rose' :
                              (content.styles as any)?.[section.key]?.bgColor === 'gold' ? 'bg-brand-gold' :
                              (content.styles as any)?.[section.key]?.bgColor === 'blue' ? 'bg-brand-blue' :
                              (content.styles as any)?.[section.key]?.bgColor === 'slate' ? 'bg-slate-900' : 'bg-brand-teal',
                              (content.styles as any)?.[section.key]?.textColor === 'white' ? 'text-white' : 
                              (content.styles as any)?.[section.key]?.textColor === 'blue' ? 'text-brand-blue' : 'text-white'
                            )}>
                              Action Button
                            </div>
                          )}
                          {section.isSection && (
                            <div className="space-y-4">
                              <h4 className={cn(
                                "text-2xl font-black",
                                (content.styles as any)?.[section.key]?.font === 'serif' ? 'font-serif' : 
                                (content.styles as any)?.[section.key]?.font === 'space' ? 'font-space' : 
                                (content.styles as any)?.[section.key]?.font === 'outfit' ? 'font-outfit' : 
                                (content.styles as any)?.[section.key]?.font === 'mono' ? 'font-mono' : 'font-sans',
                                (content.styles as any)?.[section.key]?.titleColor === 'teal' ? 'text-brand-teal' :
                                (content.styles as any)?.[section.key]?.titleColor === 'rose' ? 'text-brand-rose' :
                                (content.styles as any)?.[section.key]?.titleColor === 'gold' ? 'text-brand-gold' :
                                (content.styles as any)?.[section.key]?.titleColor === 'blue' ? 'text-brand-blue' : 'text-slate-900'
                              )}>
                                Section Title
                              </h4>
                              <div className={cn(
                                "px-6 py-3 rounded-lg font-black text-[10px] uppercase tracking-widest mx-auto max-w-max",
                                (content.styles as any)?.[section.key]?.buttonBgColor === 'teal' ? 'bg-brand-teal' :
                                (content.styles as any)?.[section.key]?.buttonBgColor === 'rose' ? 'bg-brand-rose' :
                                (content.styles as any)?.[section.key]?.buttonBgColor === 'gold' ? 'bg-brand-gold' :
                                (content.styles as any)?.[section.key]?.buttonBgColor === 'blue' ? 'bg-brand-blue' : 'bg-slate-900',
                                (content.styles as any)?.[section.key]?.buttonTextColor === 'white' ? 'text-white' : 'text-white'
                              )}>
                                Call to Action
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'assistants' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <SectionHeader 
                title="AI Intelligent Assistants" 
                icon={Bot} 
                description="Manage your AI workforce. You can have multiple assistants with unique personas and roles."
                onAdd={() => {
                  const newAsst = {
                    id: `asst_${Date.now()}`,
                    name: 'New Assistant',
                    role: 'Specialist',
                    photoUrl: '',
                    systemPrompt: 'You are a helpful assistant for WorkinEU...',
                    isActive: true,
                    color: '#020617'
                  };
                  setContent({ ...content, assistants: [...(content.assistants || []), newAsst] });
                }}
              />
              
              <div className="grid grid-cols-1 gap-6">
                {(!content.assistants || content.assistants.length === 0) ? (
                  <div className="text-center py-20 bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200">
                    <Bot size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 font-bold">No assistants configured. Use "Seed Defaults" or "Add New" to get started.</p>
                  </div>
                ) : (
                  content.assistants.map((asst, i) => (
                    <div key={asst.id} className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 relative group">
                      <div className="absolute top-8 right-8 flex items-center gap-4">
                        <button
                          onClick={() => {
                            const newList = [...content.assistants!];
                            newList[i].isActive = !newList[i].isActive;
                            setContent({ ...content, assistants: newList });
                          }}
                          className={cn(
                            "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                            asst.isActive 
                              ? "bg-green-50 text-green-600 border-green-100 shadow-sm" 
                              : "bg-gray-100 text-gray-400 border-gray-200"
                          )}
                        >
                          {asst.isActive ? 'Active' : 'Inactive'}
                        </button>
                        <button 
                          onClick={() => setContent({ ...content, assistants: content.assistants!.filter(a => a.id !== asst.id) })}
                          className="w-10 h-10 bg-white text-red-400 rounded-xl shadow-sm border border-gray-100 flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Preview Icon */}
                        <div className="lg:col-span-2 flex flex-col items-center justify-center gap-4">
                          <div className={cn(
                            "w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-xl overflow-hidden relative group/img",
                            asst.isActive ? "bg-brand-blue" : "bg-gray-400"
                          )} style={{ backgroundColor: asst.isActive ? asst.color : undefined }}>
                            {asst.photoUrl ? (
                              <img src={asst.photoUrl} alt={asst.name} className="w-full h-full object-cover" />
                            ) : (
                              <Bot size={40} />
                            )}
                            <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer">
                              {uploading === `asst_photo_${i}` ? <Loader2 className="animate-spin text-white" /> : <Upload className="text-white" size={24} />}
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*" 
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  setUploading(`asst_photo_${i}`);
                                  try {
                                    const storage = getStorage();
                                    const storageRef = ref(storage, `assistants/photo-${Date.now()}`);
                                    await uploadBytes(storageRef, file);
                                    const url = await getDownloadURL(storageRef);
                                    const newList = [...content.assistants!];
                                    newList[i].photoUrl = url;
                                    setContent({ ...content, assistants: newList });
                                    toast.success('Photo uploaded');
                                  } catch (err) {
                                    toast.error('Upload failed');
                                  } finally {
                                    setUploading(null);
                                  }
                                }} 
                              />
                            </label>
                          </div>
                          <div className="flex gap-2">
                            {['#020617', '#1e293b', '#0f172a', '#0d9488', '#ea580c'].map(c => (
                              <button 
                                key={c}
                                onClick={() => {
                                  const newList = [...content.assistants!];
                                  newList[i].color = c;
                                  setContent({ ...content, assistants: newList });
                                }}
                                className={cn(
                                  "w-6 h-6 rounded-full border-2",
                                  asst.color === c ? "border-brand-gold scale-125 shadow-lg" : "border-transparent"
                                )}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Config Fields */}
                        <div className="lg:col-span-10 space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Assistant Name</label>
                              <input 
                                className="w-full px-6 py-4 rounded-2xl border border-gray-200 outline-none focus:border-brand-gold bg-white font-bold text-brand-blue"
                                value={asst.name}
                                onChange={(e) => {
                                  const newList = [...content.assistants!];
                                  newList[i].name = e.target.value;
                                  setContent({ ...content, assistants: newList });
                                }}
                                placeholder="Assistant Name (e.g. Raj)"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Role/Task Title</label>
                              <input 
                                className="w-full px-6 py-4 rounded-2xl border border-gray-200 outline-none focus:border-brand-gold bg-white font-bold text-slate-500"
                                value={asst.role}
                                onChange={(e) => {
                                  const newList = [...content.assistants!];
                                  newList[i].role = e.target.value;
                                  setContent({ ...content, assistants: newList });
                                }}
                                placeholder="Role (e.g. Senior HR Consultant)"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Photo URL (Optional)</label>
                            <input 
                              className="w-full px-6 py-4 rounded-2xl border border-gray-200 outline-none focus:border-brand-gold bg-white text-sm"
                              value={asst.photoUrl || ''}
                              onChange={(e) => {
                                const newList = [...content.assistants!];
                                newList[i].photoUrl = e.target.value;
                                setContent({ ...content, assistants: newList });
                              }}
                              placeholder="Image URL or use the upload button on the left"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">AI Behavior / System Prompt (Assistant ko kaam)</label>
                            <textarea 
                              rows={4}
                              className="w-full px-6 py-4 rounded-2xl border border-gray-200 outline-none focus:border-brand-gold bg-white text-sm leading-relaxed"
                              value={asst.systemPrompt}
                              onChange={(e) => {
                                const newList = [...content.assistants!];
                                newList[i].systemPrompt = e.target.value;
                                setContent({ ...content, assistants: newList });
                              }}
                              placeholder="Describe the assistant's personality and instructions. What should it do?"
                            />
                            <p className="mt-2 text-[10px] text-gray-400 font-medium">
                              This defines how the AI behaves. Be specific about its task (HR, Documentation, etc.)
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  </div>
</div>
  );
}
