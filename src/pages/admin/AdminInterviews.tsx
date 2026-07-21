import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  doc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  where,
} from "firebase/firestore";
import { db } from "../../firebase";
import {
  Calendar,
  Clock,
  Video,
  Users,
  Search,
  Filter,
  Plus,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  FileText,
  Briefcase,
  Building2,
  Star,
  CheckCircle2,
  X,
  Share2,
  Pencil,
  Phone,
  Globe,
  HelpCircle,
  MessageSquare,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../lib/utils";

interface Candidate {
  uid: string;
  fullName: string;
  email: string;
  phone?: string;
  experience?: string;
  education?: string;
}

interface Client {
  id: string;
  companyName: string;
}

interface Interview {
  id: string;
  interviewCode: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  employerId: string;
  employerName: string;
  recruiterId: string;
  recruiterName: string;
  position: string;
  meetingStatus: "scheduled" | "completed" | "cancelled" | "missed";
  meetingLink: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number; // in minutes
  createdAt: number;
  isAllDay?: boolean;
  description?: string;
  countryTime?: string;
  baseTimezone?: string;
  customTimezoneLabel?: string;
  customTimezoneOffset?: number;
  notes?: {
    communication: number;
    technicalSkill: number;
    english: number;
    confidence: number;
    experience: number;
    remarks: string;
    recommendation: "selected" | "hold" | "rejected";
  };
}

export const TIMEZONE_PRESETS = [
  { id: "CET", label: "Croatia / Poland / Germany (CET/CEST - UTC+1/+2)", offset: (isDST: boolean) => isDST ? 2 : 1 },
  { id: "EET", label: "Romania / Greece / Bulgaria (EET/EEST - UTC+2/+3)", offset: (isDST: boolean) => isDST ? 3 : 2 },
  { id: "GMT", label: "United Kingdom / Ireland (GMT/BST - UTC+0/+1)", offset: (isDST: boolean) => isDST ? 1 : 0 },
  { id: "NPT", label: "Nepal (NPT - UTC+5:45)", offset: () => 5.75 },
  { id: "IST", label: "India (IST - UTC+5:30)", offset: () => 5.5 },
  { id: "BST", label: "Bangladesh (BST - UTC+6:00)", offset: () => 6 },
  { id: "SLST", label: "Sri Lanka (SLST - UTC+5:30)", offset: () => 5.5 },
  { id: "PKT", label: "Pakistan (PKT - UTC+5:00)", offset: () => 5 },
  { id: "PH", label: "Philippines (PST - UTC+8:00)", offset: () => 8 },
  { id: "UAE", label: "UAE (GST - UTC+4:00)", offset: () => 4 },
  { id: "SA", label: "Saudi Arabia (AST - UTC+3:00)", offset: () => 3 },
  { id: "EGY", label: "Egypt (EET - UTC+2:00)", offset: () => 2 },
  { id: "QAT", label: "Qatar (AST - UTC+3:00)", offset: () => 3 },
  { id: "KWT", label: "Kuwait (AST - UTC+3:00)", offset: () => 3 },
  { id: "VET", label: "Vietnam (ICT - UTC+7:00)", offset: () => 7 },
  { id: "SGT", label: "Singapore / Malaysia (SGT/MYT - UTC+8:00)", offset: () => 8 },
];

function calculateCountryTimes(
  dateStr: string,
  timeStr: string,
  baseTz: string,
  customLabel?: string,
  customOffset?: number
) {
  if (!dateStr || !timeStr || timeStr === "All Day") return "";
  try {
    const [hours, minutes] = timeStr.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) return "";
    
    const month = dateStr ? new Date(dateStr).getMonth() : new Date().getMonth();
    const isDST = month >= 2 && month <= 9; // March to October standard European Daylight Saving
    
    let croatiaOffset = isDST ? 2 : 1;
    let romaniaOffset = isDST ? 3 : 2;
    let polandOffset = isDST ? 2 : 1;
    let nepalOffset = 5.75; // UTC + 5:45
    
    let baseOffset = 1; // default CET non-DST
    
    const preset = TIMEZONE_PRESETS.find(p => p.id === baseTz);
    if (preset) {
      baseOffset = preset.offset(isDST);
    } else if (baseTz === "custom" && customOffset !== undefined) {
      baseOffset = customOffset;
    } else {
      // Fallbacks
      if (baseTz === "CET") baseOffset = isDST ? 2 : 1;
      else if (baseTz === "NPT") baseOffset = 5.75;
      else baseOffset = isDST ? 2 : 1;
    }
    
    // calculate UTC time of scheduled event in minutes
    const baseTotalMinutes = hours * 60 + minutes;
    const utcTotalMinutes = baseTotalMinutes - (baseOffset * 60);
    
    const formatTime = (totalMinutes: number) => {
      const normalized = (totalMinutes + 24 * 60) % (24 * 60);
      const h = Math.floor(normalized / 60);
      const m = normalized % 60;
      const ampm = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 || 12;
      return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
    };
    
    const croatiaTime = formatTime(utcTotalMinutes + croatiaOffset * 60);
    const polandTime = formatTime(utcTotalMinutes + polandOffset * 60);
    const romaniaTime = formatTime(utcTotalMinutes + romaniaOffset * 60);
    const nepalTime = formatTime(utcTotalMinutes + nepalOffset * 60);
    
    let info = `Croatia/Poland: ${croatiaTime} CEST | Romania: ${romaniaTime} EEST | Nepal: ${nepalTime} NPT`;
    
    // If the selected timezone base is not Croatia (CET) or Nepal (NPT), append its local time to the calculated times string.
    if (baseTz !== "CET" && baseTz !== "NPT") {
      let bLabel = "";
      if (baseTz === "custom") {
        bLabel = customLabel || "Custom Time";
      } else if (preset) {
        bLabel = preset.label.split(" (")[0];
      }
      
      if (bLabel) {
        const baseTimeFormatted = formatTime(baseTotalMinutes);
        info += ` | ${bLabel}: ${baseTimeFormatted}`;
      }
    }
    
    return info;
  } catch (e) {
    return "";
  }
}

export default function AdminInterviews() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [employers, setEmployers] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Google Meet layout states
  const [activeSidebarTab, setActiveSidebarTab] = useState<"meetings" | "calls">("meetings");
  const [showNewMeetingMenu, setShowNewMeetingMenu] = useState(false);
  const [meetCodeInput, setMeetCodeInput] = useState("");
  const [instantMeetingLink, setInstantMeetingLink] = useState<string | null>(null);
  const [showInstantMeetingModal, setShowInstantMeetingModal] = useState(false);

  // Share / Invitation modal states
  const [createdMeetingDetails, setCreatedMeetingDetails] = useState<Interview | null>(null);
  const [showCreatedModal, setShowCreatedModal] = useState(false);

  // Timezone form states
  const [baseTimezone, setBaseTimezone] = useState<string>("CET");
  const [customTimezoneLabel, setCustomTimezoneLabel] = useState<string>("");
  const [customTimezoneOffset, setCustomTimezoneOffset] = useState<number>(1);

  // Form states
  const [formCandidate, setFormCandidate] = useState("");
  const [formEmployer, setFormEmployer] = useState("");
  const [formPosition, setFormPosition] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formRecruiter, setFormRecruiter] = useState("WorkinEU Admin");
  const [formDuration, setFormDuration] = useState(45);
  const [customCandidateName, setCustomCandidateName] = useState("");
  const [customCandidateEmail, setCustomCandidateEmail] = useState("");
  const [customEmployerName, setCustomEmployerName] = useState("");

  const [editingInterviewId, setEditingInterviewId] = useState<string | null>(null);
  const [isAllDay, setIsAllDay] = useState(false);
  const [formDescription, setFormDescription] = useState("");

  useEffect(() => {
    // Run an initial cleanup of completed interviews older than 1 hour on load
    const runCleanup = async () => {
      try {
        const qCompleted = query(collection(db, "interviews"), where("meetingStatus", "==", "completed"));
        const snap = await getDocs(qCompleted);
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        for (const d of snap.docs) {
          const data = d.data();
          const finishedTime = data.completedAt || data.createdAt || now;
          if (now - finishedTime > oneHour) {
            await deleteDoc(doc(db, "interviews", d.id));
          }
        }
      } catch (err) {
        console.error("Error during initial interview cleanup:", err);
      }
    };
    runCleanup();

    // Read real-time interviews list
    const q = query(collection(db, "interviews"), orderBy("createdAt", "desc"));
    const unsubscribeInterviews = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Interview[];
        setInterviews(list);
        setLoading(false);
      },
      (error) => {
        console.error("Error subscribing to interviews:", error);
        toast.error("Failed to load interviews.");
        setLoading(false);
      }
    );

    // Fetch Candidates & Employers for dropdowns
    const fetchDropdownData = async () => {
      try {
        const candidatesSnap = await getDocs(collection(db, "candidates"));
        const candidatesList = candidatesSnap.docs.map((doc) => ({
          uid: doc.id,
          fullName: doc.data().fullName || "Unnamed Candidate",
          email: doc.data().email || "",
          phone: doc.data().phone || "",
        })) as Candidate[];
        setCandidates(candidatesList);

        const clientsSnap = await getDocs(collection(db, "clients"));
        const clientsList = clientsSnap.docs.map((doc) => ({
          id: doc.id,
          companyName: doc.data().companyName || "Unnamed Company",
        })) as Client[];
        setEmployers(clientsList);
      } catch (err) {
        console.error("Error loading helper lists:", err);
      }
    };

    fetchDropdownData();

    return () => unsubscribeInterviews();
  }, []);

  const handleCreateInterview = async (e: React.FormEvent) => {
    e.preventDefault();

    let selectedCandidateName = "";
    let selectedCandidateEmail = "";
    let selectedCandidateId = formCandidate || "custom";
    let selectedCandidatePhone = "";

    if (selectedCandidateId === "custom") {
      selectedCandidateName = customCandidateName || "Instant Candidate";
      selectedCandidateEmail = customCandidateEmail || "candidate@workineu.com";
    } else {
      const cand = candidates.find((c) => c.uid === selectedCandidateId);
      if (cand) {
        selectedCandidateName = cand.fullName;
        selectedCandidateEmail = cand.email;
        selectedCandidatePhone = cand.phone || "";
      }
    }

    let selectedEmployerName = "";
    let selectedEmployerId = formEmployer || "custom";
    if (selectedEmployerId === "custom") {
      selectedEmployerName = customEmployerName || "Instant Employer Panel";
    } else {
      const emp = employers.find((e) => e.id === selectedEmployerId);
      if (emp) {
        selectedEmployerName = emp.companyName;
      }
    }

    if (!formPosition || !formDate || (!isAllDay && !formTime)) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const calculatedCountryTimes = calculateCountryTimes(
      formDate,
      formTime,
      baseTimezone,
      customTimezoneLabel,
      customTimezoneOffset
    );

    if (editingInterviewId) {
      try {
        const updatedData = {
          candidateId: selectedCandidateId,
          candidateName: selectedCandidateName,
          candidateEmail: selectedCandidateEmail,
          candidatePhone: selectedCandidatePhone,
          employerId: selectedEmployerId,
          employerName: selectedEmployerName,
          recruiterName: formRecruiter,
          position: formPosition,
          scheduledDate: formDate,
          scheduledTime: isAllDay ? "All Day" : formTime,
          duration: isAllDay ? 1440 : Number(formDuration),
          isAllDay,
          description: formDescription,
          countryTime: calculatedCountryTimes,
          baseTimezone,
          customTimezoneLabel,
          customTimezoneOffset,
        };

        await updateDoc(doc(db, "interviews", editingInterviewId), updatedData);
        
        // Find existing record to preserve system-generated fields in our state
        const original = interviews.find((i) => i.id === editingInterviewId);
        
        // Handle sync with Candidate profile
        if (original && original.candidateId && original.candidateId !== "custom" && original.candidateId !== selectedCandidateId) {
          try {
            await updateDoc(doc(db, "candidates", original.candidateId), {
              interviewLink: null,
              interviewDate: null,
              interviewTime: null,
              interviewPosition: null,
              interviewCountry: null,
            });
          } catch (e) {
            console.error("Failed to clear old candidate fields:", e);
          }
        }

        if (selectedCandidateId !== "custom") {
          try {
            await updateDoc(doc(db, "candidates", selectedCandidateId), {
              interviewLink: original?.meetingLink || `/interview/join/${original?.interviewCode || "WE-UPDATE"}`,
              interviewDate: formDate,
              interviewTime: isAllDay ? "All Day" : formTime,
              interviewPosition: formPosition,
              interviewCountry: selectedEmployerName || "Croatia / Germany / Europe",
            });
          } catch (e) {
            console.error("Failed to update candidate fields:", e);
          }
        }

        const fullUpdated = {
          id: editingInterviewId,
          interviewCode: original?.interviewCode || "WE-UPDATE",
          meetingLink: original?.meetingLink || "",
          meetingStatus: original?.meetingStatus || "scheduled",
          createdAt: original?.createdAt || Date.now(),
          ...updatedData,
        } as Interview;

        setCreatedMeetingDetails(fullUpdated);
        setShowCreatedModal(true);
        toast.success("Interview updated successfully!");
        setShowScheduleModal(false);
        resetForm();
      } catch (err) {
        console.error("Error updating interview:", err);
        toast.error("Failed to update interview.");
      }
    } else {
      // Generate secure interview code (e.g. WE12AB34)
      const randomChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let code = "WE";
      for (let i = 0; i < 6; i++) {
        code += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
      }

      const meetingLink = `/interview/join/${code}`;

      const newInterview = {
        interviewCode: code,
        candidateId: selectedCandidateId,
        candidateName: selectedCandidateName,
        candidateEmail: selectedCandidateEmail,
        candidatePhone: selectedCandidatePhone,
        employerId: selectedEmployerId,
        employerName: selectedEmployerName,
        recruiterId: "admin",
        recruiterName: formRecruiter,
        position: formPosition,
        meetingStatus: "scheduled" as const,
        meetingLink,
        scheduledDate: formDate,
        scheduledTime: isAllDay ? "All Day" : formTime,
        duration: isAllDay ? 1440 : Number(formDuration),
        isAllDay,
        description: formDescription,
        countryTime: calculatedCountryTimes,
        baseTimezone,
        customTimezoneLabel,
        customTimezoneOffset,
        createdAt: Date.now(),
        notes: {
          communication: 0,
          technicalSkill: 0,
          english: 0,
          confidence: 0,
          experience: 0,
          remarks: "",
          recommendation: "hold" as const,
        },
      };

      try {
        const docRef = await addDoc(collection(db, "interviews"), newInterview);

        // Sync with candidate profile if real candidate
        if (selectedCandidateId !== "custom") {
          try {
            await updateDoc(doc(db, "candidates", selectedCandidateId), {
              interviewLink: meetingLink,
              interviewDate: formDate,
              interviewTime: isAllDay ? "All Day" : formTime,
              interviewPosition: formPosition,
              interviewCountry: selectedEmployerName || "Croatia / Germany / Europe",
            });
          } catch (e) {
            console.error("Failed to update candidate fields on creation:", e);
          }
        }

        const fullCreated = { id: docRef.id, ...newInterview };
        setCreatedMeetingDetails(fullCreated);
        setShowCreatedModal(true);
        toast.success("Interview scheduled successfully!");
        setShowScheduleModal(false);
        resetForm();
      } catch (err) {
        console.error("Error creating interview:", err);
        toast.error("Failed to schedule interview.");
      }
    }
  };

  const [currentMeetTime, setCurrentMeetTime] = useState("");
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format: 3:29 PM • Mon, Jul 20
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
      setCurrentMeetTime(`${timeStr} • ${dateStr}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateInstantMeeting = async () => {
    // Generates a quick instant meeting
    const randomChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "MEET";
    for (let i = 0; i < 6; i++) {
      code += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
    }

    const meetingLink = `/interview/join/${code}`;
    const today = new Date().toISOString().split("T")[0];
    const nowTime = new Date().toTimeString().split(" ")[0].slice(0, 5);

    const newInterview = {
      interviewCode: code,
      candidateId: "custom",
      candidateName: "Instant Candidate",
      candidateEmail: "candidate@workineu.com",
      employerId: "custom",
      employerName: "Instant Employer Panel",
      recruiterId: "admin",
      recruiterName: "WorkinEU Admin",
      position: "Instant HR Evaluation Call",
      meetingStatus: "scheduled" as const,
      meetingLink,
      scheduledDate: today,
      scheduledTime: nowTime,
      duration: 60,
      isAllDay: false,
      description: "Instant meeting generated via WorkInEU Meet.",
      countryTime: `Croatia/Poland: ${nowTime} | Nepal: Direct Call`,
      createdAt: Date.now(),
      notes: {
        communication: 0,
        technicalSkill: 0,
        english: 0,
        confidence: 0,
        experience: 0,
        remarks: "Instant quick-evaluation assessment",
        recommendation: "hold" as const,
      },
    };

    try {
      const docRef = await addDoc(collection(db, "interviews"), newInterview);
      const savedItem = { id: docRef.id, ...newInterview };
      
      setCreatedMeetingDetails(savedItem);
      setShowCreatedModal(true);
      setShowNewMeetingMenu(false);
      toast.success("Instant meeting created successfully!");
    } catch (err) {
      console.error("Error creating instant meeting:", err);
      toast.error("Failed to create instant meeting.");
    }
  };

  const handleStartEdit = (item: Interview) => {
    setEditingInterviewId(item.id);
    setFormCandidate(item.candidateId);
    setCustomCandidateName(item.candidateId === "custom" ? item.candidateName : "");
    setCustomCandidateEmail(item.candidateId === "custom" ? item.candidateEmail : "");
    setFormEmployer(item.employerId);
    setCustomEmployerName(item.employerId === "custom" ? item.employerName : "");
    setFormPosition(item.position);
    setFormRecruiter(item.recruiterName);
    setFormDate(item.scheduledDate);
    
    const isAD = item.scheduledTime === "All Day" || !!item.isAllDay;
    setIsAllDay(isAD);
    setFormTime(isAD ? "" : item.scheduledTime);
    setFormDuration(item.duration);
    setFormDescription(item.description || "");
    
    setBaseTimezone(item.baseTimezone || "CET");
    setCustomTimezoneLabel(item.customTimezoneLabel || "");
    setCustomTimezoneOffset(item.customTimezoneOffset !== undefined ? item.customTimezoneOffset : 1);
    
    setShowScheduleModal(true);
  };

  const resetForm = () => {
    setFormCandidate("");
    setFormEmployer("");
    setFormPosition("");
    setFormDate("");
    setFormTime("");
    setFormRecruiter("WorkinEU Admin");
    setFormDuration(45);
    setCustomCandidateName("");
    setCustomCandidateEmail("");
    setCustomEmployerName("");
    setEditingInterviewId(null);
    setIsAllDay(false);
    setFormDescription("");
    setBaseTimezone("CET");
    setCustomTimezoneLabel("");
    setCustomTimezoneOffset(1);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleUpdateStatus = async (id: string, newStatus: "scheduled" | "completed" | "cancelled" | "missed") => {
    try {
      const updates: any = { meetingStatus: newStatus };
      if (newStatus === "completed") {
        updates.completedAt = Date.now();
      } else {
        updates.completedAt = null;
      }
      await updateDoc(doc(db, "interviews", id), updates);
      toast.success(`Interview marked as ${newStatus}`);
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error("Failed to update status.");
    }
  };

  const handleDeleteInterview = async (id: string) => {
    try {
      const toDelete = interviews.find((i) => i.id === id);
      if (toDelete && toDelete.candidateId && toDelete.candidateId !== "custom") {
        try {
          await updateDoc(doc(db, "candidates", toDelete.candidateId), {
            interviewLink: null,
            interviewDate: null,
            interviewTime: null,
            interviewPosition: null,
            interviewCountry: null,
          });
        } catch (candErr) {
          console.error("Failed to clear candidate dashboard fields on delete:", candErr);
        }
      }
      await deleteDoc(doc(db, "interviews", id));
      toast.success("Interview deleted successfully.");
    } catch (err) {
      console.error("Error deleting interview:", err);
      toast.error("Failed to delete interview.");
    }
  };

  // Filters and calculations
  const todayStr = new Date().toISOString().split("T")[0];
  const todayInterviews = interviews.filter((i) => i.scheduledDate === todayStr);
  const upcomingInterviews = interviews.filter((i) => i.scheduledDate > todayStr && i.meetingStatus === "scheduled");
  const liveInterviews = interviews.filter((i) => i.meetingStatus === "scheduled" && i.scheduledDate === todayStr);

  const filtered = interviews.filter((i) => {
    const matchesSearch =
      i.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.employerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.interviewCode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "all" ? true : i.meetingStatus === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getInviteText = (item: Interview | null) => {
    if (!item) return "";
    const joinUrl = `${window.location.origin}/interview/join/${item.interviewCode}`;
    const timesInfo =
      item.countryTime ||
      calculateCountryTimes(
        item.scheduledDate,
        item.scheduledTime,
        item.baseTimezone || baseTimezone,
        item.customTimezoneLabel,
        item.customTimezoneOffset
      );
    
    let inviteText = `📅 INTERVIEW INVITATION: ${item.position.toUpperCase()}
-----------------------------------------
Position: ${item.position}
`;
    if (item.employerName) {
      inviteText += `Employer: ${item.employerName}\n`;
    }
    if (item.candidateName) {
      inviteText += `Candidate: ${item.candidateName}\n`;
    }
    inviteText += `Date: ${item.scheduledDate}
Time: ${item.scheduledTime} (Base Time)

🌐 Country-wise Interview Times:
${timesInfo ? timesInfo : "Croatia/Poland: " + item.scheduledTime}

🔗 Join Meeting Link:
${joinUrl}

📝 Description:
${item.description || "Please join 5 minutes early."}
-----------------------------------------
WorkInEU Assessment Team
`;
    return inviteText;
  };

  return (
    <div className="space-y-6 animate-fade-in p-2">
      {/* Top Google Meet style Bar */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1 cursor-pointer p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded">
            <div className="w-5 h-0.5 bg-gray-600 dark:bg-gray-400"></div>
            <div className="w-5 h-0.5 bg-gray-600 dark:bg-gray-400"></div>
            <div className="w-5 h-0.5 bg-gray-600 dark:bg-gray-400"></div>
          </div>
          <div className="flex items-center gap-2">
            <Video className="text-[#1a73e8] dark:text-brand-teal" size={24} />
            <span className="font-sans text-lg font-bold text-gray-800 dark:text-white">
              WorkinEU <span className="text-[#1a73e8] dark:text-brand-teal font-black">Meet</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold text-gray-500 dark:text-slate-400">
          <span className="font-mono bg-gray-100 dark:bg-slate-800 px-3 py-1.5 rounded-full text-slate-700 dark:text-slate-300">
            {currentMeetTime || "Loading..."}
          </span>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors" title="Help"><HelpCircle size={18} /></button>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors" title="Feedback"><MessageSquare size={18} /></button>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors" title="Settings"><Settings size={18} /></button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar */}
        <div className="md:col-span-2 flex flex-row md:flex-col gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
          <button
            onClick={() => setActiveSidebarTab("meetings")}
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all w-full",
              activeSidebarTab === "meetings" ? "bg-blue-50 text-[#1a73e8] dark:bg-brand-teal/10 dark:text-brand-teal shadow-inner" : "text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800"
            )}
          >
            <Calendar size={15} /> Meetings
          </button>
          <button
            onClick={() => setActiveSidebarTab("calls")}
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all w-full",
              activeSidebarTab === "calls" ? "bg-blue-50 text-[#1a73e8] dark:bg-brand-teal/10 dark:text-brand-teal shadow-inner" : "text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800"
            )}
          >
            <Phone size={15} /> Calls Log
          </button>
        </div>

        {/* Workspace content */}
        <div className="md:col-span-10">
          {activeSidebarTab === "meetings" ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-4">
              {/* Meet main section */}
              <div className="lg:col-span-7 space-y-5">
                <h1 className="text-4xl lg:text-5xl font-sans tracking-tight leading-tight text-gray-900 dark:text-white font-light">
                  Video calls and meetings for <span className="font-semibold text-[#1a73e8] dark:text-brand-teal">everyone</span>
                </h1>
                <p className="text-base text-gray-500 dark:text-slate-400 font-light max-w-lg">
                  Connect, collaborate, and assess candidates from anywhere with WorkinEU Meet portal.
                </p>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                  <div className="relative">
                    <button
                      onClick={() => setShowNewMeetingMenu(!showNewMeetingMenu)}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#1a73e8] hover:bg-blue-700 text-white font-semibold text-sm px-5 py-3 rounded-lg shadow transition-all"
                    >
                      <Video size={16} /> New meeting
                    </button>
                    {showNewMeetingMenu && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowNewMeetingMenu(false)}></div>
                        <div className="absolute left-0 mt-2 w-60 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-100 dark:border-white/10 p-1.5 z-20">
                          <button
                            onClick={handleCreateInstantMeeting}
                            className="w-full text-left px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 transition-colors"
                          >
                            <Plus size={15} /> Create instant meeting
                          </button>
                          <button
                            onClick={() => { setShowScheduleModal(true); setShowNewMeetingMenu(false); }}
                            className="w-full text-left px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 transition-colors"
                          >
                            <Calendar size={15} /> Schedule a meeting
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-grow sm:max-w-xs border border-gray-300 dark:border-white/10 rounded-lg px-3 bg-white dark:bg-slate-900 focus-within:border-[#1a73e8] transition-all">
                    <Clock size={15} className="text-gray-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Enter a code or link"
                      value={meetCodeInput}
                      onChange={(e) => setMeetCodeInput(e.target.value)}
                      className="w-full bg-transparent outline-none border-none py-2.5 text-xs text-slate-800 dark:text-white"
                    />
                    <button
                      disabled={!meetCodeInput.trim()}
                      onClick={() => {
                        const clean = meetCodeInput.replace(/.*\/join\//, "").trim();
                        window.open(`/interview/join/${clean}`, "_blank");
                      }}
                      className={cn("text-xs font-semibold shrink-0", meetCodeInput.trim() ? "text-[#1a73e8] dark:text-brand-teal font-black" : "text-gray-400")}
                    >
                      Join
                    </button>
                  </div>
                </div>

                <div className="h-[1px] bg-gray-200 dark:bg-white/10 my-4"></div>

                <div className="bg-slate-50 dark:bg-slate-950/40 border border-gray-100 dark:border-white/5 rounded-2xl p-5">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">Do more with WorkInEU Meet</h3>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 leading-relaxed font-light">
                    WorkInEU HR Rooms include candidate grading metrics, automatic translation offsets, resume visualizers, and direct assessment score reports generated right inside the call panel.
                  </p>
                </div>
              </div>

              {/* Right Column: Scheduled list */}
              <div className="lg:col-span-5 self-start">
                <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-3xl p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-50 dark:border-white/5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                      <Calendar size={13} className="text-brand-gold" />
                      Upcoming ({interviews.filter(i => i.meetingStatus === "scheduled").length})
                    </span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase">Today: {todayStr}</span>
                  </div>

                  {loading ? (
                    <div className="py-8 flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-brand-teal"></div></div>
                  ) : interviews.filter(i => i.meetingStatus === "scheduled").length === 0 ? (
                    <div className="py-8 text-center text-gray-400 space-y-1">
                      <Calendar size={28} className="mx-auto text-gray-300" />
                      <p className="text-xs font-bold">Nothing scheduled yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                      {interviews
                        .filter((item) => item.meetingStatus === "scheduled")
                        .map((item) => (
                          <div key={item.id} className="border border-gray-100 dark:border-white/5 rounded-2xl p-3 bg-gray-50/50 dark:bg-slate-950/20 hover:bg-white transition-all space-y-2 group relative">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-[10px] font-black text-[#1a73e8] dark:text-brand-teal">{item.scheduledTime}</span>
                                <h4 className="text-xs font-bold text-slate-800 dark:text-white mt-0.5">{item.position}</h4>
                                <p className="text-[10px] text-gray-500">Client: {item.employerName} • Candidate: {item.candidateName}</p>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleStartEdit(item)} className="p-1 text-slate-400 hover:text-brand-gold rounded" title="Edit"><Pencil size={11} /></button>
                                <button onClick={() => setDeleteConfirmId(item.id)} className="p-1 text-slate-400 hover:text-rose-500 rounded" title="Delete"><Trash2 size={11} /></button>
                              </div>
                            </div>

                            {item.countryTime && (
                              <div className="text-[9px] bg-white dark:bg-slate-900 p-1.5 rounded text-slate-500 border border-gray-100 font-mono truncate">{item.countryTime}</div>
                            )}

                            <div className="pt-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                              <span className="text-[9px] font-mono text-brand-gold">Code: {item.interviewCode}</span>
                              <div className="flex items-center gap-1.5">
                                <button onClick={() => { setCreatedMeetingDetails(item); setShowCreatedModal(true); }} className="p-1 bg-gray-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300" title="Share"><Share2 size={11} /></button>
                                <Link to={`/interview/join/${item.interviewCode}?role=host`} target="_blank" className="bg-[#1a73e8] text-white font-bold text-[9px] px-2.5 py-1 rounded">Host Call</Link>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Calls Tab: Past Log */
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 p-5 shadow-sm space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Phone size={15} /> Completed Assessments & Calls Log
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-slate-400 uppercase tracking-wider text-[9px]">
                      <th className="py-2 px-3">Candidate / Position</th>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Employer</th>
                      <th className="py-2 px-3 text-center">Recommendation</th>
                      <th className="py-2 px-3 text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {interviews
                      .filter((item) => item.meetingStatus !== "scheduled")
                      .map((item) => (
                        <tr key={item.id} className="border-b border-gray-50 dark:border-white/5 text-[11px]">
                          <td className="py-3 px-3"><span className="font-bold">{item.candidateName}</span><p className="text-[9px] text-gray-400">{item.position}</p></td>
                          <td className="py-3 px-3">{item.scheduledDate}</td>
                          <td className="py-3 px-3">{item.employerName}</td>
                          <td className="py-3 px-3 text-center">
                            <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold uppercase", item.notes?.recommendation === "selected" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800")}>
                              {item.notes?.recommendation || "hold"}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button onClick={() => setDeleteConfirmId(item.id)} className="p-1 text-slate-400 hover:text-rose-500 rounded"><Trash2 size={12} /></button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Share / Invitation success modal */}
      <AnimatePresence>
        {showCreatedModal && createdMeetingDetails && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-5 border border-gray-100 shadow-2xl space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span className="text-xs font-black uppercase text-brand-teal">🎉 Invitation Details Ready!</span>
                <button onClick={() => setShowCreatedModal(false)} className="text-gray-400 hover:text-slate-800"><X size={16} /></button>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Invitation Preview:</h3>
                <pre className="text-[10px] bg-gray-50 dark:bg-slate-950 p-3 rounded-lg overflow-x-auto max-h-[160px] whitespace-pre-wrap font-mono text-slate-700 dark:text-slate-300">
                  {getInviteText(createdMeetingDetails)}
                </pre>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => copyToClipboard(getInviteText(createdMeetingDetails), "invite-clip")}
                  className="w-full bg-[#1a73e8] text-white py-2.5 rounded-lg text-xs font-bold hover:bg-blue-600 transition-all flex items-center justify-center gap-1.5"
                >
                  <Copy size={13} /> Copy Invite
                </button>
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(getInviteText(createdMeetingDetails))}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-emerald-600 text-white py-2.5 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5"
                >
                  <Phone size={13} /> WhatsApp
                </a>
              </div>
              <button
                onClick={() => setShowCreatedModal(false)}
                className="w-full border border-gray-200 text-slate-500 py-2 rounded-lg text-xs font-bold hover:bg-gray-50 transition-all"
              >
                Close Window
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Calendar Style Scheduler Modal */}
      <AnimatePresence>
        {showScheduleModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl border border-gray-100 overflow-hidden shadow-2xl">
              <div className="flex justify-between items-center px-5 py-3 bg-gray-50 border-b border-gray-100">
                <span className="text-xs font-black uppercase text-slate-800">{editingInterviewId ? "Edit Live Interview" : "Schedule Live Interview"}</span>
                <button onClick={() => setShowScheduleModal(false)} className="text-gray-400 hover:text-slate-800"><X size={16} /></button>
              </div>

              <form onSubmit={handleCreateInterview} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400">Date *</label>
                    <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg text-xs outline-none" required />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400">Start Time *</label>
                    <input type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg text-xs outline-none" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400">Timezone Base</label>
                    <select
                      value={baseTimezone}
                      onChange={(e) => setBaseTimezone(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-xs outline-none dark:bg-slate-800 dark:border-white/10 dark:text-white"
                    >
                      {TIMEZONE_PRESETS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                      <option value="custom">✍️ Custom Timezone / Manual Input</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400">Duration (Minutes)</label>
                    <input
                      type="number"
                      value={formDuration}
                      onChange={(e) => setFormDuration(Number(e.target.value))}
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-xs outline-none dark:bg-slate-800 dark:border-white/10 dark:text-white"
                    />
                  </div>
                </div>

                {baseTimezone === "custom" && (
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-slate-950/40 p-3 rounded-lg border border-dashed border-gray-200 dark:border-white/10">
                    <div>
                      <label className="text-[9px] font-black uppercase text-gray-400">Manual Timezone Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Japan (JST) or Germany"
                        value={customTimezoneLabel}
                        onChange={(e) => setCustomTimezoneLabel(e.target.value)}
                        className="w-full mt-1 px-3 py-2 border rounded-lg text-xs outline-none dark:bg-slate-800 dark:border-white/10 dark:text-white bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-gray-400">UTC Offset (Hours, e.g. +9 or -5)</label>
                      <input
                        type="number"
                        step="0.25"
                        placeholder="e.g. 9 or -5 or 5.5"
                        value={customTimezoneOffset}
                        onChange={(e) => setCustomTimezoneOffset(Number(e.target.value))}
                        className="w-full mt-1 px-3 py-2 border rounded-lg text-xs outline-none dark:bg-slate-800 dark:border-white/10 dark:text-white bg-white"
                        required
                      />
                    </div>
                  </div>
                )}

                {formDate && formTime && (
                  <div className="bg-blue-50 dark:bg-slate-950 p-2.5 rounded-lg border border-blue-100 text-[10px] font-mono text-blue-800 dark:text-blue-300">
                    <span className="font-bold">Calculated country times:</span>
                    <p className="mt-0.5">
                      {calculateCountryTimes(
                        formDate,
                        formTime,
                        baseTimezone,
                        customTimezoneLabel,
                        customTimezoneOffset
                      )}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400">Candidate *</label>
                    <select
                      value={formCandidate}
                      onChange={(e) => setFormCandidate(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-xs outline-none dark:bg-slate-800 dark:border-white/10 dark:text-white"
                      required
                    >
                      <option value="">Select Candidate Database</option>
                      {candidates.map((c) => (
                        <option key={c.uid} value={c.uid}>
                          {c.fullName}
                        </option>
                      ))}
                      <option value="custom">✍️ Manual Input</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400">Company Partner *</label>
                    <select
                      value={formEmployer}
                      onChange={(e) => setFormEmployer(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-xs outline-none dark:bg-slate-800 dark:border-white/10 dark:text-white"
                      required
                    >
                      <option value="">Select Company</option>
                      {employers.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.companyName}
                        </option>
                      ))}
                      <option value="custom">✍️ Manual Input</option>
                    </select>
                  </div>
                </div>

                {formCandidate === "custom" && (
                  <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-slate-950/40 p-3 rounded-lg border border-dashed border-gray-200 dark:border-white/10">
                    <input
                      type="text"
                      placeholder="Candidate Name"
                      value={customCandidateName}
                      onChange={(e) => setCustomCandidateName(e.target.value)}
                      className="px-3 py-2 border rounded text-xs bg-white dark:bg-slate-800 dark:border-white/10 dark:text-white"
                      required
                    />
                    <input
                      type="email"
                      placeholder="Candidate Email"
                      value={customCandidateEmail}
                      onChange={(e) => setCustomCandidateEmail(e.target.value)}
                      className="px-3 py-2 border rounded text-xs bg-white dark:bg-slate-800 dark:border-white/10 dark:text-white"
                    />
                  </div>
                )}

                {formEmployer === "custom" && (
                  <div className="bg-gray-50 dark:bg-slate-950/40 p-3 rounded-lg border border-dashed border-gray-200 dark:border-white/10">
                    <input
                      type="text"
                      placeholder="Company Name"
                      value={customEmployerName}
                      onChange={(e) => setCustomEmployerName(e.target.value)}
                      className="w-full px-3 py-2 border rounded text-xs bg-white dark:bg-slate-800 dark:border-white/10 dark:text-white"
                      required
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400">Position *</label>
                    <input type="text" value={formPosition} onChange={(e) => setFormPosition(e.target.value)} placeholder="e.g. Nurse / Specialist" className="w-full mt-1 px-3 py-2 border rounded-lg text-xs outline-none" required />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400">Host Recruiter</label>
                    <input type="text" value={formRecruiter} onChange={(e) => setFormRecruiter(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg text-xs outline-none" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400">Instructions / Description</label>
                  <textarea rows={2} value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Guidelines..." className="w-full mt-1 px-3 py-2 border rounded-lg text-xs outline-none resize-none" />
                </div>

                <div className="pt-3 border-t flex justify-end gap-2">
                  <button type="button" onClick={() => setShowScheduleModal(false)} className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-500">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-[#1a73e8] text-white rounded-lg text-xs font-semibold hover:bg-blue-600">Save & Generate Link</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              onClick={() => setDeleteConfirmId(null)}
            ></motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md relative z-10 p-8 text-center"
            >
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={40} />
              </div>
              <h3 className="text-2xl font-bold text-brand-blue mb-4">
                Delete Interview?
              </h3>
              <p className="text-gray-500 dark:text-gray-300 mb-8 leading-relaxed">
                Are you sure you want to delete this interview record? This action
                cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-grow px-6 py-3 rounded-xl font-bold text-gray-500 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleDeleteInterview(deleteConfirmId);
                    setDeleteConfirmId(null);
                  }}
                  className="flex-grow px-6 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                >
                  Delete Interview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
