import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Job, Application, SiteContent, CandidateProfile } from "../types";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import {
  Upload,
  X,
  FileText,
  CheckCircle2,
  User,
  ArrowRight,
  Sparkles,
  Plus,
  Trash2,
  Award,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  COUNTRIES,
  JOB_POSITIONS as DEFAULT_JOB_POSITIONS,
} from "../constants";
import { cn } from "../lib/utils";

const schema = z.object({
  fullName: z.string().min(3, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number is required"),
  passportNumber: z.string().min(5, "Passport number is required"),
  nationality: z.string().min(2, "Nationality is required"),
  experience: z.string().min(1, "Experience is required"),
  education: z.string().min(1, "Education is required"),
  appliedPosition: z.string().min(2, "Position is required"),
  appliedCountry: z.string().min(2, "Country is required"),
  coverLetter: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface ApplicationFormProps {
  job: Job;
  onSuccess: () => void;
  autoFillIntent?: boolean;
}

const EDUCATION_LEVELS = [
  "High School",
  "Diploma",
  "Bachelor's Degree",
  "Master's Degree",
  "PhD",
  "Vocational Training",
  "Other",
];

const PROFICIENCY_LEVELS = [
  "Beginner",
  "Intermediate",
  "Expert",
  "Fluent",
  "Native",
];

const COMMON_SKILLS = [
  "English",
  "Driving",
  "Forklift Operation",
  "Customer Service",
  "First Aid",
  "Microsoft Office",
  "Welding",
  "Security",
  "Cooking",
  "Cleaning",
  "Inventory Management",
  "Quality Control",
];

export default function ApplicationForm({
  job,
  onSuccess,
  autoFillIntent,
}: ApplicationFormProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<
    { name: string; type: string; url: string }[]
  >([]);
  const [skills, setSkills] = useState<{ name: string; level: string }[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [newLevel, setNewLevel] = useState("Intermediate");
  const [submitted, setSubmitted] = useState(false);
  const [countries, setCountries] = useState<string[]>(COUNTRIES);
  const [jobPositions, setJobPositions] = useState<string[]>(
    DEFAULT_JOB_POSITIONS,
  );
  const [candidateProfile, setCandidateProfile] =
    useState<CandidateProfile | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    trigger,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      appliedPosition: job.title,
      appliedCountry: job.country,
    },
  });

  const nextStep = async () => {
    let fieldsToValidate: (keyof FormData)[] = [];
    if (step === 1) {
      fieldsToValidate = [
        "fullName",
        "email",
        "phone",
        "passportNumber",
        "nationality",
      ];
    } else if (step === 2) {
      fieldsToValidate = [
        "experience",
        "education",
        "appliedPosition",
        "appliedCountry",
      ];
    }

    const isStepValid = await trigger(fieldsToValidate);
    if (isStepValid) {
      setStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    setStep((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const docSnap = await getDoc(doc(db, "candidates", user.uid));
          if (docSnap.exists()) {
            const profile = {
              uid: docSnap.id,
              ...docSnap.data(),
            } as CandidateProfile;
            setCandidateProfile(profile);
          }
        } catch (error) {
          console.error("Error fetching candidate profile:", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Handle auto-fill if intent was specified and profile is loaded
  useEffect(() => {
    if (autoFillIntent && candidateProfile && step === 1 && auth.currentUser) {
      applyProfileData();
    }
  }, [candidateProfile, autoFillIntent, step]);

  const applyProfileData = async () => {
    if (!candidateProfile) return;

    if (candidateProfile.fullName)
      setValue("fullName", candidateProfile.fullName);
    if (candidateProfile.email) setValue("email", candidateProfile.email);
    if (candidateProfile.phone) setValue("phone", candidateProfile.phone);
    if (candidateProfile.passportNumber)
      setValue("passportNumber", candidateProfile.passportNumber);
    if (candidateProfile.nationality)
      setValue("nationality", candidateProfile.nationality);
    if (candidateProfile.experience)
      setValue("experience", candidateProfile.experience);
    if (candidateProfile.education)
      setValue("education", candidateProfile.education);

    if (candidateProfile.skills?.length) {
      setSkills(candidateProfile.skills);
    }

    if (candidateProfile.documents?.length > 0) {
      const profileDocs = candidateProfile.documents.map((d) => ({
        name: d.name,
        type: d.type,
        url: d.url,
      }));
      setFiles(profileDocs);
    }

    // Trigger validation for the fields we just set
    await trigger([
      "fullName",
      "email",
      "phone",
      "passportNumber",
      "nationality",
      "experience",
      "education",
    ]);

    toast.success("Form pre-filled successfully!", {
      description: "We've applied the information from your saved profile.",
    });
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "siteContent");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as SiteContent;
          if (data.countries?.length) {
            setCountries(data.countries);
          }
          if (data.jobPositions?.length) {
            setJobPositions(data.jobPositions);
          }
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    fetchSettings();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file), // Mock URL for demo
      }));
      setFiles([...files, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const addSkill = () => {
    if (!newSkill.trim()) return;
    if (skills.some((s) => s.name.toLowerCase() === newSkill.toLowerCase())) {
      toast.error("Skill already added");
      return;
    }
    setSkills([...skills, { name: newSkill.trim(), level: newLevel }]);
    setNewSkill("");
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const application: Partial<Application> = {
        jobId: job.id,
        jobTitle: data.appliedPosition,
        appliedCountry: data.appliedCountry,
        originalCountry: data.appliedCountry,
        targetCountry: data.appliedCountry,
        ...data,
        documents: files,
        skills,
        status: "pending",
        createdAt: Date.now(),
        candidateUid: auth.currentUser?.uid,
      };

      await addDoc(collection(db, "applications"), application);
      setSubmitted(true);
      toast.success("Application submitted successfully!");
      setTimeout(() => {
        onSuccess();
      }, 3000);
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-20">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-32 h-32 bg-green-50 dark:bg-green-500/10 text-green-500 rounded-[3rem] flex items-center justify-center mx-auto mb-10 shadow-inner"
        >
          <CheckCircle2 size={64} />
        </motion.div>
        <h2 className="text-5xl font-bold text-slate-900 dark:text-white mb-6 tracking-tighter">
          Application Received!
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-xl font-light mb-12 max-w-lg mx-auto leading-relaxed">
          Thank you for applying for the{" "}
          <span className="text-brand-gold font-bold">{job.title}</span>{" "}
          position. Our HR team will review your profile and get back to you
          soon.
        </p>
        <div className="bg-slate-50 dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 text-sm text-slate-400 font-medium max-w-md mx-auto">
          A confirmation email has been sent to your registered email address.
        </div>
      </div>
    );
  }

  const steps = [
    { id: 1, title: "Personal", icon: <User size={20} /> },
    { id: 2, title: "Professional", icon: <FileText size={20} /> },
    { id: 3, title: "Documents", icon: <Upload size={20} /> },
  ];

  return (
    <div className="relative">
      {/* Progress Bar */}
      <div className="mb-16">
        <div className="flex justify-between items-center mb-8">
          {steps.map((s) => (
            <div
              key={s.id}
              className="flex flex-col items-center gap-3 relative z-10"
            >
              <div
                className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg",
                  step >= s.id
                    ? "bg-slate-900 dark:bg-brand-gold text-brand-gold dark:text-brand-blue scale-110"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500",
                )}
              >
                {step > s.id ? <CheckCircle2 size={24} /> : s.icon}
              </div>
              <span
                className={cn(
                  "text-[10px] font-bold uppercase tracking-[0.2em]",
                  step >= s.id
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-400 dark:text-slate-500",
                )}
              >
                {s.title}
              </span>
            </div>
          ))}
          {/* Progress Line */}
          <div className="absolute top-7 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800 -z-0 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
              className="h-full bg-brand-gold"
            />
          </div>
        </div>
      </div>

      <div className="mb-12">
        <motion.h2
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tighter"
        >
          {step === 1 && "Personal Information"}
          {step === 2 && "Professional Details"}
          {step === 3 && "Documents & Cover Letter"}
        </motion.h2>
        <p className="text-slate-400 dark:text-slate-500 text-lg font-light">
          Step {step} of {steps.length}: Please provide your details accurately.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {candidateProfile && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-brand-gold/20 to-brand-gold/5 dark:from-brand-gold/10 dark:to-brand-gold/5 p-8 rounded-[2.5rem] border-2 border-brand-gold/30 dark:border-brand-gold/20 flex flex-col md:flex-row items-center justify-between gap-8 mb-12 relative overflow-hidden group shadow-xl"
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/10 rounded-full -mr-32 -mt-32 blur-3xl transition-all group-hover:bg-brand-gold/20"></div>
                  <div className="flex items-center gap-6 relative z-10">
                    <div className="w-20 h-20 bg-brand-gold text-slate-900 dark:text-white rounded-3xl flex items-center justify-center shadow-2xl group-hover:rotate-12 transition-transform duration-500">
                      <Sparkles size={40} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                        Apply Faster with Your Profile
                      </p>
                      <p className="text-base text-slate-600 dark:text-slate-400 font-medium">
                        We found your saved information. Click to pre-fill the
                        form instantly.
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={applyProfileData}
                    className="px-12 py-5 bg-slate-900 dark:bg-brand-gold text-white dark:text-brand-blue rounded-2xl font-bold text-lg hover:bg-brand-gold dark:hover:bg-white hover:text-slate-900 transition-all shadow-[0_20px_40px_-10px_rgba(15,23,42,0.3)] dark:shadow-brand-gold/10 whitespace-nowrap relative z-10 flex items-center gap-4 group/btn"
                  >
                    <User
                      size={24}
                      className="text-brand-gold dark:text-brand-blue group-hover/btn:text-slate-900 transition-colors"
                    />
                    Apply with Profile
                  </motion.button>
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-6">
                    Full Name
                  </label>
                  <input
                    {...register("fullName")}
                    className="w-full px-10 py-6 rounded-[2rem] border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-brand-gold focus:ring-8 focus:ring-brand-gold/5 transition-all duration-500 text-slate-900 dark:text-white font-bold shadow-inner text-lg"
                    placeholder="Enter your full name"
                  />
                  {errors.fullName && (
                    <p className="text-red-500 text-xs mt-2 font-bold ml-6 uppercase tracking-tighter">
                      {errors.fullName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-6">
                    Email Address
                  </label>
                  <input
                    {...register("email")}
                    className="w-full px-10 py-6 rounded-[2rem] border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-brand-gold focus:ring-8 focus:ring-brand-gold/5 transition-all duration-500 text-slate-900 dark:text-white font-bold shadow-inner text-lg"
                    placeholder="john@example.com"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-2 font-bold ml-6 uppercase tracking-tighter">
                      {errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-6">
                    Phone Number
                  </label>
                  <input
                    {...register("phone")}
                    className="w-full px-10 py-6 rounded-[2rem] border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-brand-gold focus:ring-8 focus:ring-brand-gold/5 transition-all duration-500 text-slate-900 dark:text-white font-bold shadow-inner text-lg"
                    placeholder="+971 ..."
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-2 font-bold ml-6 uppercase tracking-tighter">
                      {errors.phone.message}
                    </p>
                  )}
                </div>
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-6">
                    Passport Number
                  </label>
                  <input
                    {...register("passportNumber")}
                    className="w-full px-10 py-6 rounded-[2rem] border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-brand-gold focus:ring-8 focus:ring-brand-gold/5 transition-all duration-500 text-slate-900 dark:text-white font-bold shadow-inner text-lg"
                    placeholder="Enter passport number"
                  />
                  {errors.passportNumber && (
                    <p className="text-red-500 text-xs mt-2 font-bold ml-6 uppercase tracking-tighter">
                      {errors.passportNumber.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-6">
                  Nationality
                </label>
                <input
                  {...register("nationality")}
                  list="applicant-countries"
                  className="w-full px-10 py-6 rounded-[2rem] border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-brand-gold focus:ring-8 focus:ring-brand-gold/5 transition-all duration-500 text-slate-900 dark:text-white font-bold shadow-inner text-lg"
                  placeholder="e.g. Nepal"
                />
                <datalist id="applicant-countries">
                  {countries.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
                {errors.nationality && (
                  <p className="text-red-500 text-xs mt-2 font-bold ml-6 uppercase tracking-tighter">
                    {errors.nationality.message}
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-6">
                    Years of Experience
                  </label>
                  <select
                    {...register("experience")}
                    className="w-full px-10 py-6 rounded-[2rem] border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-brand-gold focus:ring-8 focus:ring-brand-gold/5 transition-all duration-500 text-slate-900 dark:text-white font-bold shadow-inner appearance-none cursor-pointer text-lg"
                  >
                    <option value="" className="dark:bg-slate-800">
                      Select Experience
                    </option>
                    <option value="Entry Level" className="dark:bg-slate-800">
                      Entry Level
                    </option>
                    <option value="1-3 Years" className="dark:bg-slate-800">
                      1-3 Years
                    </option>
                    <option value="3-5 Years" className="dark:bg-slate-800">
                      3-5 Years
                    </option>
                    <option value="5-10 Years" className="dark:bg-slate-800">
                      5-10 Years
                    </option>
                    <option value="10+ Years" className="dark:bg-slate-800">
                      10+ Years
                    </option>
                  </select>
                  {errors.experience && (
                    <p className="text-red-500 text-xs mt-2 font-bold ml-6 uppercase tracking-tighter">
                      {errors.experience.message}
                    </p>
                  )}
                </div>
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-6">
                    Highest Education
                  </label>
                  <input
                    {...register("education")}
                    list="education-levels"
                    className="w-full px-10 py-6 rounded-[2rem] border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-brand-gold focus:ring-8 focus:ring-brand-gold/5 transition-all duration-500 text-slate-900 dark:text-white font-bold shadow-inner text-lg"
                    placeholder="e.g. Bachelor's in CS"
                  />
                  <datalist id="education-levels">
                    {EDUCATION_LEVELS.map((level) => (
                      <option key={level} value={level} />
                    ))}
                  </datalist>
                  {errors.education && (
                    <p className="text-red-500 text-xs mt-2 font-bold ml-6 uppercase tracking-tighter">
                      {errors.education.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-6">
                    Position Applied For
                  </label>
                  <input
                    {...register("appliedPosition")}
                    list="job-positions-list"
                    className="w-full px-10 py-6 rounded-[2rem] border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-brand-gold focus:ring-8 focus:ring-brand-gold/5 transition-all duration-500 text-slate-900 dark:text-white font-bold shadow-inner text-lg"
                    placeholder="Select or type position"
                  />
                  <datalist id="job-positions-list">
                    <option value={job.title} />
                    {jobPositions.map((p) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                  {errors.appliedPosition && (
                    <p className="text-red-500 text-xs mt-2 font-bold ml-6 uppercase tracking-tighter">
                      {errors.appliedPosition.message}
                    </p>
                  )}
                </div>
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-6">
                    Country Applied For
                  </label>
                  <input
                    {...register("appliedCountry")}
                    list="applied-countries-list"
                    className="w-full px-10 py-6 rounded-[2rem] border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-brand-gold focus:ring-8 focus:ring-brand-gold/5 transition-all duration-500 text-slate-900 dark:text-white font-bold shadow-inner text-lg"
                    placeholder="Select or type country"
                  />
                  <datalist id="applied-countries-list">
                    <option value={job.country} />
                    {countries.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                  {errors.appliedCountry && (
                    <p className="text-red-500 text-xs mt-2 font-bold ml-6 uppercase tracking-tighter">
                      {errors.appliedCountry.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Skills Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 ml-6 mb-2">
                  <Award size={20} className="text-brand-gold" />
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Key Skills & Proficiency
                  </label>
                </div>

                <div className="bg-slate-50 dark:bg-white/5 p-8 rounded-[3rem] border border-slate-100 dark:border-white/10 space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-grow">
                      <input
                        list="common-skills"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        className="w-full px-6 py-4 rounded-2xl border border-slate-200 dark:border-white/10 outline-none focus:border-brand-gold bg-white dark:bg-slate-700 text-sm dark:text-white font-bold"
                        placeholder="Add a skill (e.g. Welding, English...)"
                        onKeyDown={(e) =>
                          e.key === "Enter" && (e.preventDefault(), addSkill())
                        }
                      />
                      <datalist id="common-skills">
                        {COMMON_SKILLS.map((s) => (
                          <option key={s} value={s} />
                        ))}
                      </datalist>
                    </div>
                    <select
                      value={newLevel}
                      onChange={(e) => setNewLevel(e.target.value)}
                      className="px-6 py-4 rounded-2xl border border-slate-200 dark:border-white/10 outline-none focus:border-brand-gold bg-white dark:bg-slate-700 text-sm dark:text-white font-bold appearance-none cursor-pointer"
                    >
                      {PROFICIENCY_LEVELS.map((l) => (
                        <option key={l} value={l} className="dark:bg-slate-800">
                          {l}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={addSkill}
                      className="bg-slate-900 dark:bg-brand-gold text-brand-gold dark:text-brand-blue p-4 rounded-2xl hover:bg-brand-gold dark:hover:bg-white hover:text-slate-900 transition-all shadow-lg flex items-center justify-center min-w-[56px]"
                    >
                      <Plus size={24} />
                    </button>
                  </div>

                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-3 pt-4">
                      {skills.map((skill, index) => (
                        <motion.div
                          key={index}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="flex items-center gap-3 bg-white dark:bg-slate-700 pl-5 pr-2 py-2 rounded-full border border-slate-200 dark:border-white/10 shadow-sm group hover:border-brand-gold transition-all"
                        >
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {skill.name}
                          </span>
                          <span className="text-[10px] font-black uppercase text-brand-gold bg-brand-gold/10 px-3 py-1 rounded-full">
                            {skill.level}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeSkill(index)}
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-6">
                  Cover Letter (Optional)
                </label>
                <textarea
                  {...register("coverLetter")}
                  rows={6}
                  className="w-full px-10 py-8 rounded-[3rem] border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-brand-gold focus:ring-8 focus:ring-brand-gold/5 transition-all duration-500 text-slate-900 dark:text-white font-medium shadow-inner resize-none text-lg"
                  placeholder="Tell us why you are a good fit for this role..."
                ></textarea>
              </div>

              <div className="space-y-6">
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-6">
                  Upload Documents (Passport, CV, Certificates)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {files.map((file, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center justify-between bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-white/10 shadow-sm group hover:border-brand-gold transition-all"
                    >
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className="w-12 h-12 bg-slate-50 dark:bg-slate-700 text-slate-400 dark:text-slate-500 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-brand-gold group-hover:text-white transition-all">
                          <FileText size={24} />
                        </div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {file.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="w-10 h-10 rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-300 hover:text-red-500 transition-all flex items-center justify-center"
                      >
                        <X size={20} />
                      </button>
                    </motion.div>
                  ))}
                </div>

                <label className="flex flex-col items-center justify-center w-full h-56 border-4 border-dashed border-slate-100 dark:border-white/5 rounded-[4rem] cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 hover:border-brand-gold transition-all duration-700 group relative overflow-hidden">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 relative z-10">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-700 text-slate-300 dark:text-slate-500 rounded-3xl flex items-center justify-center mb-6 group-hover:bg-brand-gold group-hover:text-white transition-all duration-700 shadow-inner group-hover:rotate-12 group-hover:scale-110">
                      <Upload size={36} />
                    </div>
                    <p className="text-sm text-slate-400 dark:text-slate-500 font-bold uppercase tracking-[0.3em] mb-2">
                      Upload Files
                    </p>
                    <p className="text-xs text-slate-300 dark:text-slate-500 font-medium">
                      PDF, PNG, JPG (Max 5MB each)
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    onChange={handleFileChange}
                    accept=".pdf,.png,.jpg,.jpeg"
                  />
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-6 pt-10 border-t border-slate-100 dark:border-white/5">
          {step > 1 && (
            <motion.button
              whileHover={{ scale: 1.02, x: -5 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={prevStep}
              className="flex-1 px-10 py-6 rounded-[2rem] font-bold text-lg border border-slate-100 dark:border-white/10 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:border-slate-900 dark:hover:border-white/20 transition-all duration-500"
            >
              Back
            </motion.button>
          )}

          {step < 3 ? (
            <motion.button
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={nextStep}
              className="flex-[2] bg-brand-blue dark:bg-brand-gold text-white dark:text-brand-blue py-6 rounded-[2rem] font-bold text-xl shadow-2xl flex items-center justify-center gap-4 hover:bg-brand-gold dark:hover:bg-white hover:text-brand-blue dark:hover:text-brand-blue transition-all duration-500"
            >
              Next Step
              <ArrowRight size={24} />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] btn-premium bg-brand-blue dark:bg-brand-gold text-white dark:text-brand-blue py-6 rounded-[2rem] font-bold text-xl shadow-2xl flex items-center justify-center gap-4 disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  Submit Application
                  <CheckCircle2 size={24} />
                </>
              )}
            </motion.button>
          )}
        </div>
      </form>
    </div>
  );
}
