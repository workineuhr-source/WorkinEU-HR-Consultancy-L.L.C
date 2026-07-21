import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import {
  Building2,
  User,
  Star,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  MessageSquare,
  Sparkles,
  Calendar,
  Clock,
  Briefcase,
  ExternalLink,
  ShieldAlert,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../lib/utils";

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
  meetingStatus: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  createdAt: number;
  notes?: {
    communication: number;
    technicalSkill: number;
    english: number;
    confidence: number;
    experience: number;
    remarks: string;
    recommendation: "selected" | "hold" | "rejected";
  };
  employerPortal?: {
    feedback: string;
    rating: number;
    submittedAt: number;
    decision: "approve" | "hold" | "reject";
  };
}

export default function EmployerInterviewView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [candProfile, setCandProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Video recording states
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);

  // Employer response states
  const [employerRating, setEmployerRating] = useState(0);
  const [employerFeedback, setEmployerFeedback] = useState("");
  const [employerDecision, setEmployerDecision] = useState<"approve" | "hold" | "reject">("hold");
  const [submittingDecision, setSubmittingDecision] = useState(false);

  useEffect(() => {
    if (!id) return;

    // Realtime listener for the single interview document
    const unsubscribe = onSnapshot(
      doc(db, "interviews", id),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as Interview;
          setInterview(data);

          // Populate employer's draft if already submitted
          if (data.employerPortal) {
            setEmployerRating(data.employerPortal.rating || 0);
            setEmployerFeedback(data.employerPortal.feedback || "");
            setEmployerDecision(data.employerPortal.decision || "hold");
          }

          // Fetch Candidate Profile details
          if (data.candidateId && data.candidateId !== "custom" && !candProfile) {
            getDoc(doc(db, "candidates", data.candidateId)).then((cSnap) => {
              if (cSnap.exists()) {
                setCandProfile(cSnap.data());
              }
            });
          }
        } else {
          toast.error("Review session not found.");
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error loading review panel:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id]);

  // Handle Video Player Mock simulation
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlaybackProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.5;
        });
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);

  const handleSubmitEmployerReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !interview) return;

    if (employerRating === 0 || !employerFeedback.trim()) {
      toast.error("Please provide a rating score and overall feedback.");
      return;
    }

    setSubmittingDecision(true);

    try {
      const employerPortal = {
        rating: employerRating,
        feedback: employerFeedback,
        decision: employerDecision,
        submittedAt: Date.now(),
      };

      await updateDoc(doc(db, "interviews", id), { employerPortal });
      toast.success("Corporate feedback saved and synchronized successfully!");
    } catch (err) {
      console.error("Error submitting corporate feedback:", err);
      toast.error("Failed to save feedback.");
    } finally {
      setSubmittingDecision(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-teal mx-auto"></div>
          <p className="text-xs uppercase tracking-widest font-black text-slate-400">Loading Assessment Session...</p>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 p-6">
        <div className="max-w-md text-center bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 p-8 rounded-3xl shadow-xl">
          <ShieldAlert className="mx-auto text-rose-500 mb-4" size={48} />
          <h2 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">Review Portal Locked</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
            The interview report you are trying to access does not exist or has been deleted.
          </p>
          <Link
            to="/"
            className="inline-block mt-6 bg-brand-teal text-[#121212] font-black uppercase tracking-wider text-xs px-6 py-3 rounded-xl hover:bg-brand-teal/90 transition-all"
          >
            Go to Portal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-10 px-4 md:px-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Branding Row */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-brand-teal/10 rounded-2xl flex items-center justify-center text-brand-teal">
              <Building2 size={28} />
            </div>
            <div>
              <span className="block text-[10px] font-black text-brand-teal uppercase tracking-widest">
                Employer Review Portal
              </span>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                {interview.employerName} Executive Dashboard
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800/50 px-4 py-2.5 rounded-xl border border-gray-100 dark:border-white/5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <Calendar size={14} className="text-brand-gold" />
            Interviewed on {interview.scheduledDate}
          </div>
        </div>

        {/* Double Column Bento Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT 2 COLUMNS: Interview Details, Recording and Recruiter Assessment */}
          <div className="lg:col-span-2 space-y-8">
            {/* Candidate Summary */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Candidate Details</h3>
              <div className="flex flex-col sm:flex-row justify-between gap-6">
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center font-black text-2xl text-brand-teal">
                    {interview.candidateName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white">{interview.candidateName}</h4>
                    <p className="text-xs text-gray-400 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <Briefcase size={12} /> Assigned Position: {interview.position}
                    </p>
                  </div>
                </div>

                {candProfile && candProfile.documents && candProfile.documents.length > 0 && (
                  <div className="flex flex-col justify-center">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">
                      Europass Credentials:
                    </span>
                    {candProfile.documents.map((doc: any, idx: number) => (
                      <a
                        key={idx}
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 bg-brand-teal/10 hover:bg-brand-teal/20 text-[#121212] dark:text-brand-teal px-4 py-2 rounded-xl text-xs font-bold border border-brand-teal/10 transition-colors"
                      >
                        <FileText size={14} /> Download CV / Resume
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Video Recording Interactive Player */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                <Play size={14} className="text-brand-teal" /> Interview Video Recording
              </h3>

              <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-white/5 flex flex-col justify-end">
                {/* Simulated Player Visual */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {isPlaying ? (
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="w-16 h-16 bg-brand-teal/20 rounded-full flex items-center justify-center"
                    >
                      <Pause size={28} className="text-brand-teal ml-0" />
                    </motion.div>
                  ) : (
                    <button
                      onClick={() => setIsPlaying(true)}
                      className="w-16 h-16 bg-brand-teal text-[#121212] rounded-full flex items-center justify-center hover:scale-105 transition-transform"
                    >
                      <Play size={28} className="text-[#121212] ml-1" />
                    </button>
                  )}
                </div>

                {/* Subtitles Overlay */}
                {isPlaying && (
                  <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-white/5 px-6 py-2 rounded-xl text-xs text-center font-medium max-w-[80%]">
                    {playbackProgress < 20 && `Recruiter: "Ram, thank you for joining WorkinEU assessment today. Tell me about your background..."`}
                    {playbackProgress >= 20 && playbackProgress < 45 && `Candidate: "Thank you. I have 4 years of experience as a registered general nurse, focusing on cardiology..."`}
                    {playbackProgress >= 45 && playbackProgress < 70 && `Recruiter: "Excellent. How would you handle a situation with an uncooperative patient?"`}
                    {playbackProgress >= 70 && `Candidate: "I prioritize empathy and active listening. I seek to understand their discomfort..."`}
                  </div>
                )}

                {/* Video controls */}
                <div className="bg-slate-900/90 border-t border-white/5 px-4 py-3 flex items-center gap-4 z-10">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-1.5 hover:bg-white/5 text-brand-teal rounded transition-colors"
                  >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                  </button>

                  <div className="flex-grow bg-slate-950 h-1.5 rounded-full relative overflow-hidden">
                    <div
                      className="bg-brand-teal h-full transition-all duration-75"
                      style={{ width: `${playbackProgress}%` }}
                    />
                  </div>

                  <span className="font-mono text-[10px] text-slate-400">
                    {Math.floor((playbackProgress * 15) / 100)}:
                    {Math.floor(((playbackProgress * 15) % 100) * 0.6)
                      .toString()
                      .padStart(2, "0")}{" "}
                    / 15:00
                  </span>
                </div>
              </div>
            </div>

            {/* Recruiter Evaluation Report */}
            {interview.notes ? (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm space-y-6">
                <div className="flex justify-between items-center border-b border-gray-50 dark:border-white/5 pb-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">
                    HR Consultant Assessment Report
                  </h3>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                      interview.notes.recommendation === "selected" && "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400",
                      interview.notes.recommendation === "hold" && "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400",
                      interview.notes.recommendation === "rejected" && "bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400"
                    )}
                  >
                    Recruiter Verdict: {interview.notes.recommendation}
                  </span>
                </div>

                {/* Scorecards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {[
                    { val: interview.notes.communication, label: "Communication" },
                    { val: interview.notes.technicalSkill, label: "Technical Skill" },
                    { val: interview.notes.english, label: "English" },
                    { val: interview.notes.confidence, label: "Confidence" },
                    { val: interview.notes.experience, label: "Experience" },
                  ].map((card) => (
                    <div key={card.label} className="bg-gray-50/50 dark:bg-slate-850 p-4 rounded-2xl border border-gray-100 dark:border-white/5 text-center">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">
                        {card.label}
                      </p>
                      <div className="flex justify-center text-brand-gold gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={12}
                            fill={card.val >= star ? "currentColor" : "none"}
                            className="shrink-0"
                          />
                        ))}
                      </div>
                      <p className="text-xs font-mono font-black text-slate-800 dark:text-white mt-2">
                        {card.val} / 5
                      </p>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-50 dark:bg-slate-800/30 p-5 rounded-2xl border border-gray-100 dark:border-white/5 space-y-2">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Recruiter Assessment Remarks:
                  </p>
                  <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                    {interview.notes.remarks || "No supplementary assessment remarks submitted by recruiter."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm text-center py-10 text-gray-500">
                <AlertCircle size={32} className="mx-auto mb-2 text-slate-400" />
                <p className="text-sm">Recruiter has not completed notes assessment card yet.</p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Employer Decision Form */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm space-y-6 sticky top-8">
              <div className="border-b border-gray-50 dark:border-white/5 pb-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                  <Building2 size={18} className="text-brand-teal" />
                  Corporate Decision Panel
                </h3>
                <p className="text-xs text-gray-500 mt-1">Submit your executive verdict on Ram Bahadur.</p>
              </div>

              {interview.employerPortal ? (
                /* Saved State confirmation */
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl text-center space-y-4">
                  <CheckCircle2 className="mx-auto text-emerald-500" size={40} />
                  <div>
                    <h4 className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
                      Verdict Submitted Successfully
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Submitted at {new Date(interview.employerPortal.submittedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="bg-slate-950/20 p-4 rounded-xl text-left text-xs space-y-2 text-slate-700 dark:text-slate-300">
                    <div>
                      <span className="font-bold text-slate-400 block uppercase text-[9px]">Decision Outcome:</span>
                      <span className="font-bold uppercase text-slate-900 dark:text-white">
                        🟢 {interview.employerPortal.decision}
                      </span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 block uppercase text-[9px]">Star Rating:</span>
                      <span className="text-brand-gold font-bold">{interview.employerPortal.rating} / 5 Stars</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 block uppercase text-[9px]">Feedback Notes:</span>
                      <span className="italic">"{interview.employerPortal.feedback}"</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      // Allow re-editing
                      if (confirm("Would you like to unlock and revise your corporate response?")) {
                        updateDoc(doc(db, "interviews", interview.id), {
                          employerPortal: null,
                        });
                      }
                    }}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-wider text-[10px] py-2.5 rounded-xl transition-all"
                  >
                    Revise Decision
                  </button>
                </div>
              ) : (
                /* Unsubmitted Form state */
                <form onSubmit={handleSubmitEmployerReview} className="space-y-6">
                  {/* Rating selection */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-400">
                      Overall Candidate Fit Score *
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setEmployerRating(star)}
                          className={cn(
                            "p-1 rounded hover:scale-110 transition-transform",
                            employerRating >= star ? "text-brand-gold" : "text-slate-300 dark:text-slate-700"
                          )}
                        >
                          <Star size={24} fill={employerRating >= star ? "currentColor" : "none"} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Corporate Decision */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-400">
                      Executive Decision Verdict *
                    </label>
                    <select
                      value={employerDecision}
                      onChange={(e) => setEmployerDecision(e.target.value as any)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-brand-teal rounded-xl outline-none text-xs font-semibold text-slate-900 dark:text-white"
                      required
                    >
                      <option value="approve">🟢 Selected for Employment Offer</option>
                      <option value="hold">🟡 Keep on Backup List (Hold)</option>
                      <option value="reject">🔴 Reject Suitability</option>
                    </select>
                  </div>

                  {/* Feedback comments */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-400">
                      Executive Feedback / Comments *
                    </label>
                    <textarea
                      value={employerFeedback}
                      onChange={(e) => setEmployerFeedback(e.target.value)}
                      rows={5}
                      placeholder="e.g. Ram has strong English fluency. We would like to extend an offer starting September..."
                      className="w-full p-4 bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-brand-teal rounded-xl outline-none text-xs text-slate-900 dark:text-white font-medium resize-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingDecision}
                    className="w-full bg-[#121212] dark:bg-white text-white dark:text-[#121212] font-black uppercase tracking-wider text-xs py-4 rounded-xl hover:opacity-90 transition-all active:scale-95 shadow-md flex items-center justify-center gap-2"
                  >
                    {submittingDecision ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-[#121212]"></div>
                    ) : (
                      <>
                        <Save size={14} /> Submit Corporate Decision
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
