import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  doc,
  onSnapshot,
  updateDoc,
  getDoc,
  arrayUnion,
  collection,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "../../firebase";
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Send,
  Users,
  Settings,
  X,
  User,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
  Phone,
  Monitor,
  Hand,
  Volume2,
  Lock,
  MessageSquare,
  ShieldAlert,
  Download,
  Star,
  FileText,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../lib/utils";

interface ChatMessage {
  sender: string;
  text: string;
  timestamp: number;
}

interface Participant {
  name: string;
  role: "host" | "candidate" | "employer";
  joinedAt: number;
  raisedHand?: boolean;
  audioEnabled?: boolean;
  videoEnabled?: boolean;
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
  meetingStatus: "scheduled" | "completed" | "cancelled" | "missed" | "live";
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  createdAt: number;
  waitingRoom?: (string | { name: string; country: string; joinedAt: number })[]; // list of candidate names or objects waiting
  admittedCandidates?: string[]; // list of candidate names admitted by the host
  activeParticipants?: Participant[];
  chat?: ChatMessage[];
  webRtcOffer?: any;
  webRtcAnswer?: any;
  iceCandidatesCandidate?: any[];
  iceCandidatesHost?: any[];
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

const SIMULATED_HOST_QUESTIONS = [
  "Hello! Welcome to your WorkinEU interview. I am your HR Coordinator. Can you please introduce yourself and tell me your full name?",
  "Thank you. What position are you applying for, and what is your level of experience in this field?",
  "Great. Working in the EU requires adapting to a new culture. How do you feel about moving to Croatia or Germany, and how is your English or local language fluency?",
  "Can you describe a challenging scenario you faced with a patient or teammate, and how you resolved it professionally?",
  "Excellent response. Do you have any questions for us regarding the relocation process, visa support, or the workplace?",
  "Thank you so much for your time today! We will review your diagnostics and update your dashboard within 48 hours. Have a great day!"
];

const SIMULATED_CANDIDATE_ANSWERS = [
  "Hello, thank you for having me! My name is Bahadur Thapa, and I'm very excited for this interview today.",
  "I am applying for the Specialist Nurse position. I have over 5 years of experience working in general medicine and ICU wards in Kathmandu.",
  "I am highly motivated to move to Europe! I have been taking intensive English and German lessons, and I am confident I can communicate effectively with patients and staff.",
  "Once, we had an extremely anxious patient refusing medication. I sat down with them, listened to their concerns patiently, and explained the benefits gently. They eventually cooperated.",
  "Yes, I would like to know about the onboarding program for international nurses and if housing is provided initially.",
  "Thank you so much! I look forward to hearing from you. Have a wonderful day!"
];

const getWaitingRoomItem = (item: any) => {
  if (!item) return { name: "", country: "" };
  if (typeof item === "string") {
    return { name: item, country: "" };
  }
  return { name: item.name || "", country: item.country || "" };
};

export default function CandidateInterviewJoin() {
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Role: host or candidate (defaults to candidate)
  const isHost = searchParams.get("role") === "host";

  // State managers
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"name" | "test" | "waiting" | "call">("name");
  const [displayName, setDisplayName] = useState("");

  // User Authentication states for restriction matching
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser && !displayName) {
      setDisplayName(currentUser.displayName || interview?.candidateName || "");
    }
  }, [currentUser, interview, displayName]);

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success("Successfully signed in with Google!");
    } catch (err) {
      console.error("Google sign in failed:", err);
      toast.error("Google sign-in failed. Please try again.");
    }
  };

  const handleSignOutAndSwitch = async () => {
    try {
      await signOut(auth);
      toast.info("Signed out. Please sign in with the correct account.");
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  // Media streams & settings
  const [currentCountry, setCurrentCountry] = useState("");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [micLevel, setMicLevel] = useState(0);

  // Live call states
  const [chatOpen, setChatOpen] = useState(false);
  const [showDocs, setShowDocs] = useState(true);
  const [chatMessage, setChatMessage] = useState("");
  const [raisedHand, setRaisedHand] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);
  const [simTextIndex, setSimTextIndex] = useState(0);
  const [simSubtitles, setSimSubtitles] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Recruiter assessment state
  const [notes, setNotes] = useState({
    communication: 0,
    technicalSkill: 0,
    english: 0,
    confidence: 0,
    experience: 0,
    remarks: "",
    recommendation: "hold" as "selected" | "hold" | "rejected",
  });

  // Candidate DB Profile Cache (for panel check)
  const [candProfile, setCandProfile] = useState<any>(null);

  // Refs for WebRTC & Audio
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const micIntervalRef = useRef<any>(null);

  const displayNameRef = useRef(displayName);
  const prevWaitingCount = useRef(0);

  useEffect(() => {
    displayNameRef.current = displayName;
  }, [displayName]);

  // Google Meet-style soft electronic notification chime
  const playLobbyChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const now = ctx.currentTime;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      // Dual frequencies for a warm electronic sound
      osc.frequency.setValueAtTime(440, now); // A4
      osc.frequency.setValueAtTime(554.37, now + 0.1); // C#5
      
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {
      console.warn("Chime playback failed (re-interact with page):", e);
    }
  };

  // 1. Fetch Interview and subscribe to real-time changes
  useEffect(() => {
    if (!code) return;

    // Find interview by code
    const fetchAndSubscribe = async () => {
      try {
        const snap = await getDoc(doc(db, "interviews", "placeholder")); // We query collection instead of single document because code is NOT Firestore ID
      } catch (e) {}
    };

    // Since code is unique, we query collection and set up real-time listener
    const unsubscribe = onSnapshot(
      doc(db, "interviews", "placeholder"), // will search collection in fetch
      () => {}
    );

    // Dynamic query helper
    let resolvedDocId = "";
    let cancelSubscription: (() => void) | null = null;

    const setupRealtimeDb = async () => {
      try {
        const interviewsSnap = await getDocs(collection(db, "interviews")); // simple fetch to locate document ID
        const match = interviewsSnap.docs.find(
          (d) => d.data().interviewCode === code
        );

        if (match) {
          resolvedDocId = match.id;
          setDisplayName(isHost ? match.data().recruiterName : match.data().candidateName);

          // If Host, we skip device test and go straight to call or active meeting
          if (isHost) {
            setStep("call");
            // Set up host active participant
            joinActiveCall(match.id, match.data().recruiterName, "host");
          }

          // Realtime Document subscription
          cancelSubscription = onSnapshot(doc(db, "interviews", match.id), (docSnapshot) => {
            if (docSnapshot.exists()) {
              const data = { id: docSnapshot.id, ...docSnapshot.data() } as Interview;
              setInterview(data);

              // Auto-fill recruiter notes if editing as host
              if (isHost && data.notes) {
                setNotes({
                  communication: data.notes.communication || 0,
                  technicalSkill: data.notes.technicalSkill || 0,
                  english: data.notes.english || 0,
                  confidence: data.notes.confidence || 0,
                  experience: data.notes.experience || 0,
                  remarks: data.notes.remarks || "",
                  recommendation: data.notes.recommendation || "hold",
                });
              }

              // Candidate Profile lookup for host sidebar
              if (isHost && data.candidateId && data.candidateId !== "custom" && !candProfile) {
                getDoc(doc(db, "candidates", data.candidateId)).then((cDoc) => {
                  if (cDoc.exists()) {
                    setCandProfile(cDoc.data());
                  }
                });
              }

              // Host chime when a new candidate requests to join
              if (isHost && data.waitingRoom) {
                const currentCount = data.waitingRoom.length;
                if (currentCount > prevWaitingCount.current) {
                  playLobbyChime();
                  const lastItem = data.waitingRoom[currentCount - 1];
                  const { name: latestName, country: latestCountry } = getWaitingRoomItem(lastItem);
                  toast.info(`🔔 ${latestName} ${latestCountry ? `(${latestCountry})` : ""} is waiting in the lobby.`, {
                    action: {
                      label: "Admit",
                      onClick: () => handleApproveCandidate(latestName),
                    },
                    duration: 8000,
                  });
                }
                prevWaitingCount.current = currentCount;
              }

              // Realtime Transition: If Candidate is waiting and they are admitted
              const nameToCheck = displayNameRef.current || data.candidateName;
              const isAdmitted = data.admittedCandidates?.includes(nameToCheck) || 
                                 (data.meetingStatus === "live" && (!data.admittedCandidates || data.admittedCandidates.length === 0));

              if (!isHost && step === "waiting" && isAdmitted) {
                setStep("call");
                joinActiveCall(match.id, nameToCheck, "candidate", currentCountry);
              }

              // Realtime Transition: If Candidate is active in call but gets kicked/removed by host
              if (!isHost && step === "call" && data.admittedCandidates && !data.admittedCandidates.includes(nameToCheck)) {
                setStep("waiting");
                if (localStream) {
                  localStream.getTracks().forEach((track) => track.stop());
                }
                setLocalStream(null);
                toast.error("You have been moved back to the waiting room by the host.");
              }
            } else {
              // Handle interview document deletion
              toast.error("This meeting has been deleted or ended by the host.");
              setInterview(null);
              setStep("name");
              if (localStream) {
                localStream.getTracks().forEach((track) => track.stop());
              }
              setLocalStream(null);
            }
            setLoading(false);
          });
        } else {
          setLoading(false);
          toast.error("Interview code not found.");
        }
      } catch (err) {
        console.error("Error fetching interview details:", err);
        setLoading(false);
      }
    };

    setupRealtimeDb();

    return () => {
      if (cancelSubscription) cancelSubscription();
    };
  }, [code, isHost]);

  // 2. Track Timer Duration
  useEffect(() => {
    if (step !== "call") return;
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  // Auto-Save Notes for Host (Autosave every 5 seconds or on content change)
  const saveNotesTimeout = useRef<any>(null);
  useEffect(() => {
    if (!isHost || !interview) return;

    if (saveNotesTimeout.current) clearTimeout(saveNotesTimeout.current);

    saveNotesTimeout.current = setTimeout(async () => {
      try {
        await updateDoc(doc(db, "interviews", interview.id), { notes });
      } catch (err) {
        console.error("Autosave notes failed:", err);
      }
    }, 2000);

    return () => clearTimeout(saveNotesTimeout.current);
  }, [notes, isHost, interview]);

  // 3. Setup Camera/Microphone stream for testing
  const startDevices = async () => {
    try {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: cameraOn,
        audio: true,
      });

      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Mic level simulation
      if (stream.getAudioTracks().length > 0) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 512;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        micIntervalRef.current = setInterval(() => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const avg = sum / bufferLength;
          setMicLevel(Math.min(100, Math.round((avg / 128) * 100)));
        }, 100);
      }
    } catch (err) {
      console.error("Failed to access camera/mic:", err);
      toast.error("Could not access camera or microphone. Please allow permissions.");
    }
  };

  useEffect(() => {
    if (step === "test" || step === "waiting") {
      startDevices();
    }
    return () => {
      if (micIntervalRef.current) clearInterval(micIntervalRef.current);
    };
  }, [step, cameraOn]);

  // Listen for Host muting actions in activeParticipants list
  useEffect(() => {
    if (isHost || step !== "call" || !interview || !displayName) return;
    
    const myParticipant = interview.activeParticipants?.find(
      (p) => p.name === displayName
    );
    
    if (myParticipant) {
      // Audio Muted remotely
      if (myParticipant.audioEnabled === false && micOn) {
        setMicOn(false);
        if (localStream) {
          localStream.getAudioTracks().forEach((track) => {
            track.enabled = false;
          });
        }
        toast.info("The host has muted your microphone.");
      }
      
      // Video Disabled remotely
      if (myParticipant.videoEnabled === false && cameraOn) {
        setCameraOn(false);
        if (localStream) {
          localStream.getVideoTracks().forEach((track) => {
            track.enabled = false;
          });
        }
        toast.info("The host has turned off your video feed.");
      }
    }
  }, [interview?.activeParticipants, isHost, step, displayName, micOn, cameraOn, localStream]);

  const updateParticipantStatus = async (audio: boolean, video: boolean, hand: boolean) => {
    if (!interview || !displayName) return;
    try {
      const interviewRef = doc(db, "interviews", interview.id);
      const docSnap = await getDoc(interviewRef);
      if (docSnap.exists()) {
        const currentParticipants = docSnap.data().activeParticipants || [];
        const updated = currentParticipants.map((p: any) => {
          if (p.name === displayName) {
            return { ...p, audioEnabled: audio, videoEnabled: video, raisedHand: hand };
          }
          return p;
        });
        await updateDoc(interviewRef, {
          activeParticipants: updated,
        });
      }
    } catch (e) {
      console.error("Failed to update participant status in Firestore:", e);
    }
  };

  const toggleCamera = async () => {
    const nextVal = !cameraOn;
    setCameraOn(nextVal);
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = nextVal;
      });
    }
    if (step === "call") {
      await updateParticipantStatus(micOn, nextVal, raisedHand);
    }
  };

  const toggleMic = async () => {
    const nextVal = !micOn;
    setMicOn(nextVal);
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = nextVal;
      });
    }
    if (step === "call") {
      await updateParticipantStatus(nextVal, cameraOn, raisedHand);
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        setScreenStream(stream);
        setIsScreenSharing(true);
        
        // Listen for screen share stop (from browser toolbar)
        stream.getVideoTracks()[0].onended = () => {
          stopScreenShare(stream);
        };
        
        if (peerConnectionRef.current) {
          const senders = peerConnectionRef.current.getSenders();
          const videoSender = senders.find((s) => s.track?.kind === "video");
          if (videoSender) {
            videoSender.replaceTrack(stream.getVideoTracks()[0]);
          }
        }
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        toast.success("Screen sharing started!");
      } catch (err) {
        console.error("Screen share failed:", err);
        toast.error("Screen sharing was cancelled or failed.");
      }
    } else {
      if (screenStream) {
        stopScreenShare(screenStream);
      }
    }
  };

  const stopScreenShare = (stream: MediaStream) => {
    stream.getTracks().forEach((track) => track.stop());
    setScreenStream(null);
    setIsScreenSharing(false);
    
    if (peerConnectionRef.current && localStream) {
      const senders = peerConnectionRef.current.getSenders();
      const videoSender = senders.find((s) => s.track?.kind === "video");
      if (videoSender && localStream.getVideoTracks().length > 0) {
        videoSender.replaceTrack(localStream.getVideoTracks()[0]);
      }
    }
    
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
    
    toast.info("Screen sharing ended.");
  };

  // Demo simulator system
  const startSimulation = () => {
    setIsSimulated(true);
    setSimTextIndex(0);
    const initialText = isHost 
      ? "Hello, thank you for having me! My name is Bahadur Thapa, and I'm very excited for this interview today." 
      : "Hello! Welcome to your WorkinEU interview. I am your HR Coordinator. Can you please introduce yourself and tell me your full name?";
    speakText(initialText);
  };

  const speakText = (text: string) => {
    setSimSubtitles(text);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.lang.startsWith("en") && v.name.includes("Google"));
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      window.speechSynthesis.speak(utterance);
    } else {
      setIsSpeaking(true);
      setTimeout(() => setIsSpeaking(false), 3000);
    }
  };

  const nextSimStep = () => {
    const list = isHost ? SIMULATED_CANDIDATE_ANSWERS : SIMULATED_HOST_QUESTIONS;
    const nextIndex = simTextIndex + 1;
    if (nextIndex < list.length) {
      setSimTextIndex(nextIndex);
      speakText(list[nextIndex]);
    } else {
      toast.info("Simulation completed!");
      setIsSimulated(false);
      setSimSubtitles("");
    }
  };

  // 4. Join Active Call Room
  const joinActiveCall = async (docId: string, name: string, role: "host" | "candidate" | "employer", country?: string) => {
    try {
      // Start/Verify media stream for the live session
      let stream = localStream;
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        }).catch(() => null);
        if (stream) {
          setLocalStream(stream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        }
      }

      // Add to active participants list in Firestore
      const newParticipant: Participant = {
        name,
        role,
        joinedAt: Date.now(),
        audioEnabled: micOn,
        videoEnabled: cameraOn,
        ...(country ? { country } : {}),
      };

      const interviewRef = doc(db, "interviews", docId);
      const docSnap = await getDoc(interviewRef);
      const currentParticipants = docSnap.data()?.activeParticipants || [];

      // Avoid duplicates
      const updatedParticipants = [
        ...currentParticipants.filter((p: Participant) => p.name !== name),
        newParticipant,
      ];

      await updateDoc(interviewRef, {
        activeParticipants: updatedParticipants,
        ...(role === "host" ? { meetingStatus: "live" } : {}),
      });

      // Initialize WebRTC Peer connection for realistic P2P video/audio signaling!
      setupWebRtcSignaling(docId, role);
    } catch (err) {
      console.error("Error joining live room:", err);
    }
  };

  // WebRTC Peer-to-Peer setup
  const setupWebRtcSignaling = async (docId: string, role: "host" | "candidate" | "employer") => {
    const configuration = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    };
    const pc = new RTCPeerConnection(configuration);
    peerConnectionRef.current = pc;

    // Add local media tracks to peer connection
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream!);
      });
    }

    // Capture remote video stream
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    const docRef = doc(db, "interviews", docId);

    // Host creates offer
    if (role === "host") {
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          updateDoc(docRef, {
            iceCandidatesHost: arrayUnion(event.candidate.toJSON()),
          });
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await updateDoc(docRef, {
        webRtcOffer: { type: offer.type, sdp: offer.sdp },
        iceCandidatesHost: [],
      });

      // Listen for Candidate's answer
      onSnapshot(docRef, (snap) => {
        const data = snap.data();
        if (data?.webRtcAnswer && !pc.currentRemoteDescription) {
          pc.setRemoteDescription(new RTCSessionDescription(data.webRtcAnswer));
        }
        if (data?.iceCandidatesCandidate) {
          data.iceCandidatesCandidate.forEach((cand: any) => {
            pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
          });
        }
      });
    } else if (role === "candidate") {
      // Candidate answers host offer
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          updateDoc(docRef, {
            iceCandidatesCandidate: arrayUnion(event.candidate.toJSON()),
          });
        }
      };

      // Poll/Listen for offer
      onSnapshot(docRef, async (snap) => {
        const data = snap.data();
        if (data?.webRtcOffer && !pc.currentRemoteDescription) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.webRtcOffer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await updateDoc(docRef, {
            webRtcAnswer: { type: answer.type, sdp: answer.sdp },
            iceCandidatesCandidate: [],
          });
        }
        if (data?.iceCandidatesHost) {
          data.iceCandidatesHost.forEach((cand: any) => {
            pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
          });
        }
      });
    }
  };

  // 5. Submit Waiting Room Form
  const handleRequestJoin = async () => {
    if (!displayName.trim()) {
      toast.error("Please enter your name to proceed.");
      return;
    }
    if (!currentCountry.trim()) {
      toast.error("Please enter your current country.");
      return;
    }

    if (!interview) return;

    try {
      // Add candidate name and country to waitingRoom array in DB
      await updateDoc(doc(db, "interviews", interview.id), {
        waitingRoom: arrayUnion({
          name: displayName.trim(),
          country: currentCountry.trim(),
          joinedAt: Date.now()
        }),
      });
      setStep("waiting");
      toast.success("Request sent. Please wait in the lobby.");
    } catch (err) {
      console.error("Waiting room entry failed:", err);
      toast.error("Failed to register. Please try again.");
    }
  };

  // 6. Recruiter: Approve Candidate from Waiting Room
  const handleApproveCandidate = async (candName: string) => {
    if (!interview) return;
    try {
      const currentAdmitted = interview.admittedCandidates || [];
      const updatedAdmitted = [...currentAdmitted.filter((n) => n !== candName), candName];
      const updatedWaiting = interview.waitingRoom?.filter((item) => {
        const itemInfo = typeof item === 'string' ? { name: item } : item;
        return itemInfo.name !== candName;
      }) || [];

      // Set meeting status to "live" and admit candidate
      await updateDoc(doc(db, "interviews", interview.id), {
        meetingStatus: "live",
        admittedCandidates: updatedAdmitted,
        waitingRoom: updatedWaiting,
      });
      toast.success(`${candName} is entering the active call.`);
    } catch (err) {
      toast.error("Approval failed.");
    }
  };

  // 6.1 Recruiter: Decline Candidate admission request
  const handleDeclineCandidate = async (candName: string) => {
    if (!interview) return;
    try {
      const updatedWaiting = interview.waitingRoom?.filter((item) => {
        const itemInfo = typeof item === 'string' ? { name: item } : item;
        return itemInfo.name !== candName;
      }) || [];
      await updateDoc(doc(db, "interviews", interview.id), {
        waitingRoom: updatedWaiting,
      });
      toast.info(`Declined lobby request for ${candName}.`);
    } catch (err) {
      toast.error("Decline action failed.");
    }
  };

  // 6.2 Recruiter: Remove/Kick participant from live meeting
  const handleRemoveParticipant = async (candName: string) => {
    if (!interview) return;
    try {
      const updatedActive = interview.activeParticipants?.filter((p) => p.name !== candName) || [];
      const updatedAdmitted = interview.admittedCandidates?.filter((n) => n !== candName) || [];

      await updateDoc(doc(db, "interviews", interview.id), {
        activeParticipants: updatedActive,
        admittedCandidates: updatedAdmitted,
      });
      toast.info(`${candName} has been removed from the call.`);
    } catch (err) {
      toast.error("Could not remove participant.");
    }
  };

  // 6.3 Recruiter: Toggle participant mic remotely
  const handleToggleParticipantAudio = async (candName: string, currentStatus: boolean) => {
    if (!interview) return;
    try {
      const updated = interview.activeParticipants?.map((p) => {
        if (p.name === candName) {
          return { ...p, audioEnabled: !currentStatus };
        }
        return p;
      }) || [];
      await updateDoc(doc(db, "interviews", interview.id), {
        activeParticipants: updated,
      });
      toast.success(`Participant ${candName} microphone has been ${currentStatus ? "muted" : "unmuted"}.`);
    } catch (err) {
      toast.error("Mute toggle failed.");
    }
  };

  // 6.4 Recruiter: Toggle participant video feed remotely
  const handleToggleParticipantVideo = async (candName: string, currentStatus: boolean) => {
    if (!interview) return;
    try {
      const updated = interview.activeParticipants?.map((p) => {
        if (p.name === candName) {
          return { ...p, videoEnabled: !currentStatus };
        }
        return p;
      }) || [];
      await updateDoc(doc(db, "interviews", interview.id), {
        activeParticipants: updated,
      });
      toast.success(`Participant ${candName} camera has been ${currentStatus ? "disabled" : "enabled"}.`);
    } catch (err) {
      toast.error("Camera toggle failed.");
    }
  };

  // 6.5 Recruiter: Lower participant hand remotely
  const handleLowerParticipantHand = async (candName: string) => {
    if (!interview) return;
    try {
      const updated = interview.activeParticipants?.map((p) => {
        if (p.name === candName) {
          return { ...p, raisedHand: false };
        }
        return p;
      }) || [];
      await updateDoc(doc(db, "interviews", interview.id), {
        activeParticipants: updated,
      });
      toast.success(`Lowered hand for ${candName}`);
    } catch (err) {
      toast.error("Lower hand failed.");
    }
  };

  // 7. Chat messages
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !interview) return;

    const newMessage: ChatMessage = {
      sender: displayName || (isHost ? "Host" : "Candidate"),
      text: chatMessage,
      timestamp: Date.now(),
    };

    try {
      await updateDoc(doc(db, "interviews", interview.id), {
        chat: arrayUnion(newMessage),
      });
      setChatMessage("");
    } catch (err) {
      toast.error("Message delivery failed.");
    }
  };

  // 8. End Call & Status transition
  const handleEndCall = async () => {
    if (!interview) return;

    try {
      // Clear local stream
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }

      // Update DB
      const updates: any = {
        meetingStatus: isHost ? "completed" : "scheduled",
        activeParticipants: interview.activeParticipants?.filter((p) => p.name !== displayName) || [],
      };
      if (isHost) {
        updates.completedAt = Date.now();
      }
      await updateDoc(doc(db, "interviews", interview.id), updates);

      toast.success("Call disconnected.");
      navigate(isHost ? "/admin/interviews" : "/");
    } catch (err) {
      navigate("/");
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-teal mx-auto"></div>
          <p className="text-xs uppercase tracking-widest font-black text-slate-400">Loading Secure Portal...</p>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6">
        <div className="max-w-md text-center bg-slate-900 border border-white/5 p-8 rounded-3xl">
          <ShieldAlert className="mx-auto text-rose-500 mb-4" size={48} />
          <h2 className="text-lg font-black uppercase tracking-tight">Access Denied</h2>
          <p className="text-sm text-slate-400 mt-2">
            The interview session does not exist, or your token code has expired.
          </p>
          <Link
            to="/"
            className="inline-block mt-6 bg-brand-teal text-[#121212] font-black uppercase tracking-wider text-xs px-6 py-3 rounded-xl hover:bg-brand-teal/90 transition-all"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // --- RENDERING VARIOUS STEPS ---

  // STEP 1: ENTER NAME
  if (step === "name") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/50 backdrop-blur-md border border-white/5 w-full max-w-md p-8 rounded-3xl shadow-2xl"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-brand-teal/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Video className="text-brand-teal" size={32} />
            </div>
            <h2 className="text-xl font-black tracking-tight text-white">Secure Video Lobby</h2>
            <p className="text-xs text-slate-400 mt-1">Please enter your legal name as shown on your passport.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                Your Full Name *
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Bahadur Thapa"
                className="w-full px-4 py-3 bg-slate-800 border border-white/5 rounded-xl outline-none focus:border-brand-teal text-white text-sm font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                Current Country *
              </label>
              <input
                type="text"
                value={currentCountry}
                onChange={(e) => setCurrentCountry(e.target.value)}
                placeholder="e.g. Nepal"
                className="w-full px-4 py-3 bg-slate-800 border border-white/5 rounded-xl outline-none focus:border-brand-teal text-white text-sm font-medium"
              />
            </div>

            <button
              onClick={() => {
                if (!displayName.trim()) {
                  toast.error("Please enter your full name.");
                  return;
                }
                if (!currentCountry.trim()) {
                  toast.error("Please enter your current country.");
                  return;
                }
                setStep("test");
              }}
              className="w-full bg-brand-teal text-[#121212] font-black uppercase tracking-wider text-xs py-4 rounded-xl hover:bg-brand-teal/90 transition-all active:scale-95 shadow-lg shadow-brand-teal/10 mt-2"
            >
              Verify Media Devices
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // STEP 2: DEVICE DIAGNOSTICS & HARDWARE TEST
  if (step === "test") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 border border-white/5 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
            <h3 className="text-sm font-black uppercase tracking-tight text-white flex items-center gap-2">
              <Settings className="text-brand-teal" size={18} />
              Audio & Video Diagnostic Check
            </h3>
            <span className="text-[10px] font-mono bg-brand-teal/10 text-brand-teal px-2 py-1 rounded">
              Pillars of Integrity
            </span>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Live camera feed */}
            <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center">
              {cameraOn ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
              ) : (
                <div className="text-center text-slate-500">
                  <VideoOff size={40} className="mx-auto mb-2 text-slate-600" />
                  <p className="text-xs">Camera Feed Blocked</p>
                </div>
              )}

              {/* Float Overlay Toolbar */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/5 flex gap-3 shadow-xl">
                <button
                  onClick={toggleCamera}
                  className={cn(
                    "p-2.5 rounded-full transition-all",
                    cameraOn ? "bg-white/10 text-white hover:bg-white/25" : "bg-rose-500 text-white hover:bg-rose-600"
                  )}
                >
                  {cameraOn ? <Video size={16} /> : <VideoOff size={16} />}
                </button>
                <button
                  onClick={toggleMic}
                  className={cn(
                    "p-2.5 rounded-full transition-all",
                    micOn ? "bg-white/10 text-white hover:bg-white/25" : "bg-rose-500 text-white hover:bg-rose-600"
                  )}
                >
                  {micOn ? <Mic size={16} /> : <MicOff size={16} />}
                </button>
              </div>
            </div>

            {/* Right Column: Signal indicators */}
            <div className="flex flex-col justify-between">
              <div className="space-y-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-white/5">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                    Microphone Input Signal
                  </p>
                  <div className="flex items-center gap-3">
                    <Mic className="text-brand-gold shrink-0 animate-pulse" size={16} />
                    <div className="flex-grow bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-brand-gold h-full transition-all duration-75"
                        style={{ width: `${micOn ? micLevel : 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-400">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="text-brand-teal shrink-0 mt-0.5" size={14} />
                    <span>HTTPS secure audio/video channel active.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="text-brand-teal shrink-0 mt-0.5" size={14} />
                    <span>Background noise filters ready.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="text-brand-teal shrink-0 mt-0.5" size={14} />
                    <span>Europass credentials linked securely.</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t border-white/5">
                <button
                  onClick={() => setStep("name")}
                  className="px-4 py-3 border border-white/5 rounded-xl text-xs font-black uppercase tracking-wider text-slate-400 hover:bg-white/5 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleRequestJoin}
                  className="flex-grow bg-brand-teal text-[#121212] font-black uppercase tracking-wider text-xs py-3 rounded-xl hover:bg-brand-teal/90 transition-all text-center"
                >
                  Join Waiting Lobby
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // STEP 3: WAITING ROOM / LOBBY (Realtime update check)
  if (step === "waiting") {
    const lobbyQueueIndex = interview.waitingRoom?.findIndex((item: any) => {
      const itemInfo = typeof item === 'string' ? { name: item } : item;
      return itemInfo.name === displayName;
    }) ?? -1;
    const queueText = lobbyQueueIndex > 0 ? `${lobbyQueueIndex} candidates ahead of you` : "You are next in line!";
    const lobbyCount = interview.waitingRoom?.length || 0;

    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-4xl bg-slate-900 border border-white/5 rounded-3xl overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-2"
        >
          {/* Left Side: Live camera self preview */}
          <div className="p-6 bg-slate-950/40 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/5 min-h-[300px]">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-brand-teal bg-brand-teal/10 px-2.5 py-1 rounded-full">
                Self Mirror Preview
              </span>
              <p className="text-[11px] text-slate-400 mt-2">Check your lighting and microphone level before entering.</p>
            </div>

            <div className="relative aspect-video w-full bg-slate-950 rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center my-4">
              {cameraOn ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
              ) : (
                <div className="text-center text-slate-500">
                  <VideoOff size={40} className="mx-auto mb-2 text-slate-600" />
                  <p className="text-xs">Camera Feed Muted</p>
                </div>
              )}

              {/* Floating microphone indicator on preview */}
              {micOn && (
                <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1.5 text-[9px] font-mono text-brand-gold">
                  <Mic size={10} className="animate-pulse" />
                  <div className="w-12 bg-slate-950 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-brand-gold h-full" style={{ width: `${micLevel}%` }} />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Toggle Controls */}
            <div className="flex justify-center gap-3">
              <button
                onClick={toggleCamera}
                className={cn(
                  "p-3 rounded-full transition-all active:scale-95",
                  cameraOn ? "bg-white/5 hover:bg-white/10 text-white" : "bg-rose-500 text-white"
                )}
                title={cameraOn ? "Turn Camera Off" : "Turn Camera On"}
              >
                {cameraOn ? <Video size={16} /> : <VideoOff size={16} />}
              </button>
              <button
                onClick={toggleMic}
                className={cn(
                  "p-3 rounded-full transition-all active:scale-95",
                  micOn ? "bg-white/5 hover:bg-white/10 text-white" : "bg-rose-500 text-white"
                )}
                title={micOn ? "Mute Mic" : "Unmute Mic"}
              >
                {micOn ? <Mic size={16} /> : <MicOff size={16} />}
              </button>
            </div>
          </div>

          {/* Right Side: Google Meet Queue Details */}
          <div className="p-8 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center">
                  <Lock className="text-brand-gold animate-pulse" size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-black uppercase tracking-wider text-slate-300">Admission Queue</h2>
                  <p className="text-[10px] text-slate-500 font-mono">Code: {interview.interviewCode}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-slate-400">Joining as</p>
                <h3 className="text-lg font-black text-white">{displayName}</h3>
                <span className="inline-block px-2 py-0.5 bg-white/5 rounded text-[10px] font-bold text-slate-400">
                  Candidate
                </span>
              </div>

              {/* Real-time Lobby Info Box */}
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-white/5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-brand-gold uppercase tracking-wider">
                  <Clock size={14} className="animate-spin duration-1000" /> Waiting to be let in...
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The meeting host will let you join the live assessment call shortly. Please remain on this screen.
                </p>

                <div className="pt-2 border-t border-white/5 flex justify-between items-center text-[11px]">
                  <span className="text-slate-400 font-bold">Queue Position:</span>
                  <span className="text-brand-teal font-black uppercase tracking-wider font-mono">
                    {queueText}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400 font-bold">Total Arrived:</span>
                  <span className="text-slate-200 font-mono">{lobbyCount} candidates waiting</span>
                </div>
              </div>
            </div>

            {/* Bottom active telemetry */}
            <div className="flex items-center gap-2 mt-6 pt-6 border-t border-white/5 justify-center md:justify-start">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
              <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest font-black">
                Connected • Live Lobby Updates
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // STEP 4: LIVE VIDEO CALL SCREEN (Recruiter & Candidate Combined with adaptive layouts!)
  const formattedDuration = `${Math.floor(callDuration / 60)
    .toString()
    .padStart(2, "0")}:${(callDuration % 60).toString().padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col h-screen overflow-hidden">
      {/* Top Header Row */}
      <header className="h-16 border-b border-white/5 px-6 flex items-center justify-between bg-slate-900/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-brand-teal/10 text-brand-teal rounded-lg">
            <Video size={16} />
          </div>
          <div>
            <h1 className="text-xs font-black uppercase tracking-wider text-white">Live Assessments</h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-tight">
              {interview.position} / {interview.employerName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-950 border border-white/5 rounded-full text-[10px] font-mono tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {formattedDuration}
          </span>

          <span className="text-[10px] bg-white/5 border border-white/10 px-3 py-1 rounded-full text-slate-300 font-black uppercase tracking-wider">
            {isHost ? "Host View" : "Candidate"}
          </span>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-grow flex min-h-0 relative">
        {/* Left Side: Video feeds */}
        <div className="flex-grow p-6 flex flex-col gap-4 relative justify-center bg-slate-950 min-w-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full max-h-[75vh]">
            {/* Local Feed */}
            <div className="relative bg-slate-900 border border-white/5 rounded-2xl overflow-hidden aspect-video">
              {(cameraOn || isScreenSharing) ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={cn(
                    "w-full h-full object-cover",
                    !isScreenSharing && "transform -scale-x-100"
                  )}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-500 bg-slate-950">
                  <div className="text-center">
                    <VideoOff size={40} className="mx-auto mb-2 text-slate-600 animate-pulse" />
                    <p className="text-xs text-slate-400 font-medium">Camera Disabled</p>
                  </div>
                </div>
              )}

              {/* Floating indicators */}
              <div className="absolute top-4 right-4 flex gap-2">
                {!micOn && (
                  <span className="p-1.5 bg-rose-600/90 text-white rounded-lg text-xs" title="You are muted">
                    <MicOff size={12} />
                  </span>
                )}
                {raisedHand && (
                  <span className="p-1.5 bg-brand-gold/90 text-[#121212] rounded-lg text-xs animate-bounce" title="Hand raised">
                    <Hand size={12} fill="currentColor" />
                  </span>
                )}
              </div>

              <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5 text-[10px] font-bold tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-brand-teal rounded-full animate-ping"></span>
                {displayName} (You)
              </div>
            </div>

            {/* Remote Feed */}
            <div className="relative bg-slate-900 border border-white/5 rounded-2xl overflow-hidden aspect-video">
              {isSimulated ? (
                <div className="absolute inset-0 bg-slate-950 flex flex-col justify-between p-6">
                  {/* Top indicators */}
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] uppercase tracking-wider font-mono font-black text-brand-teal bg-brand-teal/10 px-2.5 py-1 rounded">
                      🤖 Demo Simulator Active
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">
                      {isHost ? "Simulated Candidate" : "Simulated HR Recruiter"}
                    </span>
                  </div>

                  {/* Pulsating Glowing Waveform */}
                  <div className="flex items-center justify-center gap-1.5 my-4">
                    {[...Array(9)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={isSpeaking ? {
                          height: [12, i % 2 === 0 ? 36 : 48, 12]
                        } : {
                          height: [8, 8, 8]
                        }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: i * 0.05
                        }}
                        className="w-1 bg-brand-teal rounded-full"
                        style={{ height: "12px" }}
                      />
                    ))}
                  </div>

                  {/* Subtitles Overlay */}
                  <div className="bg-slate-900/80 border border-white/5 rounded-xl p-3 text-center text-xs font-medium leading-relaxed max-h-[100px] overflow-y-auto">
                    <p className="text-slate-200">"{simSubtitles}"</p>
                  </div>

                  {/* Controls at the bottom of the feed */}
                  <div className="flex justify-center gap-2 mt-2 shrink-0">
                    <button
                      onClick={nextSimStep}
                      className="bg-brand-teal text-[#121212] font-black uppercase tracking-wider text-[10px] px-4 py-2 rounded-xl hover:bg-brand-teal/90 transition-all flex items-center gap-1"
                    >
                      <span>Next Prompt</span>
                    </button>
                    <button
                      onClick={() => {
                        if ("speechSynthesis" in window) window.speechSynthesis.cancel();
                        setIsSimulated(false);
                        setSimSubtitles("");
                      }}
                      className="bg-rose-500/10 text-rose-400 border border-rose-500/20 font-black uppercase tracking-wider text-[10px] px-3 py-2 rounded-xl hover:bg-rose-500 hover:text-white transition-all"
                    >
                      Exit Demo
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Real remote participant video or placeholder */}
                  {interview.activeParticipants?.find((p) => p.name !== displayName)?.videoEnabled !== false && interview.activeParticipants?.some((p) => p.name !== displayName) ? (
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-slate-950 flex items-center justify-center text-slate-500">
                      <div className="text-center space-y-2 px-6">
                        <User size={48} className="mx-auto text-slate-600" />
                        <p className="text-xs text-slate-400 font-medium">
                          {interview.activeParticipants?.some((p) => p.name !== displayName) 
                            ? `${interview.activeParticipants?.find((p) => p.name !== displayName)?.name}'s Video Off` 
                            : "Waiting for connection stream..."}
                        </p>
                        {!interview.activeParticipants?.some((p) => p.name !== displayName) && (
                          <div className="pt-2">
                            <button
                              onClick={startSimulation}
                              className="bg-brand-teal/20 text-brand-teal hover:bg-brand-teal hover:text-[#121212] border border-brand-teal/30 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                            >
                              🚀 Start Demo Simulation
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Remote Status Overlays */}
                  {interview.activeParticipants?.find((p) => p.name !== displayName) && (
                    <div className="absolute top-4 right-4 flex gap-2">
                      {interview.activeParticipants?.find((p) => p.name !== displayName)?.audioEnabled === false && (
                        <span className="p-1.5 bg-rose-600/90 text-white rounded-lg text-xs" title="Participant is muted">
                          <MicOff size={12} />
                        </span>
                      )}
                      {interview.activeParticipants?.find((p) => p.name !== displayName)?.raisedHand && (
                        <span className="p-1.5 bg-brand-gold/90 text-[#121212] rounded-lg text-xs animate-bounce" title="Participant raised hand">
                          <Hand size={12} fill="currentColor" />
                        </span>
                      )}
                    </div>
                  )}

                  <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5 text-[10px] font-bold tracking-wider">
                    {interview.activeParticipants?.find((p) => p.name !== displayName)?.name || (isHost ? interview.candidateName : "HR Consultant")} (Remote)
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Call Controls Floating Bar */}
          <div className="flex justify-center gap-4 py-4 mt-2 shrink-0">
            <button
              onClick={toggleCamera}
              className={cn(
                "p-4 rounded-xl transition-all shadow-lg active:scale-95",
                cameraOn ? "bg-slate-800 text-white hover:bg-slate-700 border border-white/10" : "bg-rose-600 text-white hover:bg-rose-700"
              )}
              title="Camera On/Off"
            >
              {cameraOn ? <Video size={20} /> : <VideoOff size={20} />}
            </button>

            <button
              onClick={toggleMic}
              className={cn(
                "p-4 rounded-xl transition-all shadow-lg active:scale-95",
                micOn ? "bg-slate-800 text-white hover:bg-slate-700 border border-white/10" : "bg-rose-600 text-white hover:bg-rose-700"
              )}
              title="Mic On/Off"
            >
              {micOn ? <Mic size={20} /> : <MicOff size={20} />}
            </button>

            <button
              onClick={async () => {
                const newVal = !raisedHand;
                setRaisedHand(newVal);
                if (step === "call") {
                  await updateParticipantStatus(micOn, cameraOn, newVal);
                }
                toast.success(newVal ? "Hand raised" : "Hand lowered");
              }}
              className={cn(
                "p-4 rounded-xl transition-all shadow-lg border border-white/10 active:scale-95",
                raisedHand ? "bg-brand-gold text-[#121212]" : "bg-slate-800 text-white hover:bg-slate-700"
              )}
              title="Raise Hand"
            >
              <Hand size={20} />
            </button>

            <button
              onClick={toggleScreenShare}
              className={cn(
                "p-4 rounded-xl transition-all shadow-lg border border-white/10 active:scale-95",
                isScreenSharing ? "bg-emerald-500 text-white animate-pulse" : "bg-slate-800 text-white hover:bg-slate-700"
              )}
              title="Share Screen"
            >
              <Monitor size={20} />
            </button>

            <button
              onClick={() => setChatOpen((p) => !p)}
              className={cn(
                "p-4 rounded-xl transition-all shadow-lg border border-white/10 active:scale-95 relative",
                chatOpen ? "bg-brand-gold text-slate-950" : "bg-slate-800 text-white hover:bg-slate-700"
              )}
              title="Open Chat"
            >
              <MessageSquare size={20} />
              {interview.chat && interview.chat.length > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full"></span>
              )}
            </button>

            <button
              onClick={handleEndCall}
              className="p-4 rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-all shadow-lg active:scale-95"
              title="End Meeting"
            >
              <Phone size={20} className="transform rotate-135" />
            </button>
          </div>
        </div>

        {/* Right Side Panel: Host Admin controls OR Chat box */}
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 350, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-white/5 bg-slate-900 flex flex-col h-full shrink-0 overflow-hidden"
            >
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-950/40">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">Call Chat Messenger</h3>
                <button
                  onClick={() => setChatOpen(false)}
                  className="p-1 hover:bg-white/5 text-slate-500 hover:text-white rounded"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Chat messages */}
              <div className="flex-grow p-4 overflow-y-auto space-y-4">
                {interview.chat && interview.chat.length > 0 ? (
                  interview.chat.map((msg, idx) => {
                    const self = msg.sender === displayName;
                    return (
                      <div key={idx} className={cn("max-w-[85%] flex flex-col", self ? "ml-auto text-right" : "mr-auto text-left")}>
                        <span className="text-[9px] text-slate-400 font-bold mb-1">{msg.sender}</span>
                        <div
                          className={cn(
                            "px-3.5 py-2 rounded-2xl text-xs leading-relaxed break-words",
                            self ? "bg-brand-teal text-[#121212] rounded-tr-none" : "bg-slate-800 text-white rounded-tl-none"
                          )}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-20 text-slate-500">
                    <MessageSquare size={32} className="mx-auto mb-2 opacity-35" />
                    <p className="text-xs">No call messages yet.</p>
                  </div>
                )}
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 flex gap-2">
                <input
                  type="text"
                  placeholder="Send a secure chat..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="flex-grow px-3 py-2 bg-slate-950 border border-white/5 rounded-xl outline-none text-xs text-white"
                />
                <button
                  type="submit"
                  className="p-2.5 bg-brand-teal text-[#121212] rounded-xl hover:bg-brand-teal/90 transition-all"
                >
                  <Send size={14} />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HOST SPECIAL MODULE: Candidate Profile, Waiting lobby approval and HR Assessment Form! */}
        {isHost && (
          <div className="w-[450px] border-l border-white/5 bg-slate-900 flex flex-col h-full shrink-0">
            {/* Tab selection */}
            <div className="flex bg-slate-950/40 border-b border-white/5">
              <button
                onClick={() => setShowDocs(true)}
                className={cn(
                  "flex-1 py-3 text-[10px] font-black uppercase tracking-wider transition-all border-b-2",
                  showDocs ? "text-brand-teal border-brand-teal" : "text-slate-400 border-transparent hover:text-white"
                )}
              >
                Candidate Info & Lobby
              </button>
              <button
                onClick={() => setShowDocs(false)}
                className={cn(
                  "flex-1 py-3 text-[10px] font-black uppercase tracking-wider transition-all border-b-2",
                  !showDocs ? "text-brand-teal border-brand-teal" : "text-slate-400 border-transparent hover:text-white"
                )}
              >
                Assessment Notes
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-6 scrollbar-hide space-y-6">
              {showDocs ? (
                <>
                  {/* Lobby Approval Section */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Users size={12} /> Lobby Waiting Room ({interview.waitingRoom?.length || 0})
                    </h3>
                    
                    {interview.waitingRoom && interview.waitingRoom.length > 0 ? (
                      <div className="bg-brand-gold/10 border border-brand-gold/20 p-4 rounded-2xl space-y-3">
                        <p className="text-[10px] text-brand-gold uppercase tracking-widest font-bold animate-pulse">
                          ⚠️ Candidate Admission Request
                        </p>
                        {interview.waitingRoom.map((item, idx) => {
                          const { name, country } = getWaitingRoomItem(item);
                          return (
                            <div key={idx} className="flex justify-between items-center bg-slate-950/50 p-3 rounded-xl border border-white/5 gap-2">
                              <div className="flex items-center gap-2 min-w-0 flex-grow">
                                <div className="w-6 h-6 rounded bg-slate-800 text-[10px] font-bold text-slate-300 flex items-center justify-center shrink-0">
                                  {name.charAt(0)}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-bold text-white truncate max-w-[120px]">{name}</span>
                                  {country && (
                                    <span className="text-[9px] font-bold text-brand-teal uppercase tracking-wider truncate">
                                      📍 {country}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-1.5 shrink-0">
                                <button
                                  onClick={() => handleApproveCandidate(name)}
                                  className="bg-emerald-500 text-white font-black uppercase tracking-wider text-[9px] px-2.5 py-1.5 rounded-lg hover:bg-emerald-600 transition-all"
                                >
                                  Admit
                                </button>
                                <button
                                  onClick={() => handleDeclineCandidate(name)}
                                  className="bg-rose-500/10 text-rose-400 border border-rose-500/20 font-black uppercase tracking-wider text-[9px] px-2 py-1.5 rounded-lg hover:bg-rose-500 hover:text-white transition-all"
                                  title="Decline Request"
                                >
                                  Decline
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bg-slate-950 p-4 rounded-xl border border-white/5 text-center text-xs text-slate-500">
                        No candidates currently waiting in the lobby.
                      </div>
                    )}
                  </div>

                  {/* Active Call Participants & Meeting Controls (Google Meet style) */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Video size={12} /> Active In Meeting ({interview.activeParticipants?.length || 0})
                    </h3>
                    
                    <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 space-y-3">
                      {interview.activeParticipants && interview.activeParticipants.length > 0 ? (
                        interview.activeParticipants.map((p, index) => {
                          const isMe = p.name === displayName;
                          const isCand = p.role === "candidate";
                          return (
                            <div key={index} className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-white/5">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-brand-teal/10 flex items-center justify-center text-brand-teal font-bold text-xs shrink-0">
                                  {p.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-xs font-bold text-white truncate">{p.name}</h4>
                                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-mono">
                                    {p.role === "host" ? "👑 Host" : "Candidate"}
                                  </span>
                                </div>
                              </div>

                              {/* Host can control other active participants */}
                              {!isMe && isCand && (
                                <div className="flex gap-1 items-center shrink-0">
                                  {/* Mic Control */}
                                  <button
                                    onClick={() => handleToggleParticipantAudio(p.name, p.audioEnabled !== false)}
                                    className={cn(
                                      "p-1.5 rounded hover:bg-white/5 transition-colors",
                                      p.audioEnabled !== false ? "text-slate-400 hover:text-white" : "text-rose-500"
                                    )}
                                    title={p.audioEnabled !== false ? "Mute Microphone remotely" : "Unmute Microphone"}
                                  >
                                    {p.audioEnabled !== false ? <Mic size={14} /> : <MicOff size={14} />}
                                  </button>

                                  {/* Camera Control */}
                                  <button
                                    onClick={() => handleToggleParticipantVideo(p.name, p.videoEnabled !== false)}
                                    className={cn(
                                      "p-1.5 rounded hover:bg-white/5 transition-colors",
                                      p.videoEnabled !== false ? "text-slate-400 hover:text-white" : "text-rose-500"
                                    )}
                                    title={p.videoEnabled !== false ? "Disable Video feed" : "Enable Video feed"}
                                  >
                                    {p.videoEnabled !== false ? <Video size={14} /> : <VideoOff size={14} />}
                                  </button>

                                  {/* Raised Hand Lowering Action */}
                                  {p.raisedHand && (
                                    <button
                                      onClick={() => handleLowerParticipantHand(p.name)}
                                      className="p-1.5 rounded bg-brand-gold/10 text-brand-gold animate-pulse hover:bg-brand-gold hover:text-[#121212] transition-all"
                                      title="Click to lower participant hand remotely"
                                    >
                                      <Hand size={14} fill="currentColor" />
                                    </button>
                                  )}

                                  {/* Remove / Kick Button */}
                                  <button
                                    onClick={() => handleRemoveParticipant(p.name)}
                                    className="p-1.5 rounded hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-all ml-1"
                                    title="Remove participant from call"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-2 text-xs text-slate-500">
                          Waiting for participants to join...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Candidate Overview Profile panel */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Candidate Dossier</h3>
                    <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 space-y-4">
                      <div className="flex gap-3 items-center">
                        <div className="w-12 h-12 bg-brand-blue/20 rounded-xl flex items-center justify-center font-bold text-lg text-brand-teal">
                          {interview.candidateName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">{interview.candidateName}</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">{interview.candidateEmail}</p>
                          {interview.candidatePhone && <p className="text-[10px] text-slate-500 mt-0.5">{interview.candidatePhone}</p>}
                        </div>
                      </div>

                      <div className="h-px bg-white/5" />

                      {candProfile ? (
                        <div className="space-y-3 text-xs">
                          <div>
                            <span className="text-slate-400 font-bold block">Passport Number:</span>
                            <span className="text-white">{candProfile.passportNumber || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold block">Nationality / Country:</span>
                            <span className="text-white">{candProfile.nationality || "Nepal"}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold block">Total Work Experience:</span>
                            <span className="text-white">{candProfile.experience || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold block">Education Qualification:</span>
                            <span className="text-white">{candProfile.education || "N/A"}</span>
                          </div>

                          {candProfile.documents && candProfile.documents.length > 0 && (
                            <div>
                              <span className="text-slate-400 font-bold block mb-2">Uploaded Files:</span>
                              <div className="space-y-1">
                                {candProfile.documents.map((doc: any, index: number) => (
                                  <a
                                    key={index}
                                    href={doc.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 bg-white/5 p-2 rounded-lg border border-white/5 hover:bg-white/10 transition-colors text-brand-teal text-[10px]"
                                  >
                                    <FileText size={12} />
                                    <span className="truncate">{doc.name}</span>
                                    <Download size={10} className="ml-auto text-slate-400" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 text-center py-4">
                          Custom candidate scheduled. Profile document files not linked.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                /* Phase 9 Assessment Notes with Auto-Save visual indicator */
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Assessment Grades</h3>
                    <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Auto-Saving...
                    </span>
                  </div>

                  <div className="bg-slate-950 p-5 rounded-2xl border border-white/5 space-y-5">
                    {/* Scores sliders */}
                    {[
                      { key: "communication", label: "Communication Skill" },
                      { key: "technicalSkill", label: "Technical Competence" },
                      { key: "english", label: "English Fluency" },
                      { key: "confidence", label: "Confidence & Delivery" },
                      { key: "experience", label: "Experience & Readiness" },
                    ].map((item) => (
                      <div key={item.key} className="space-y-2">
                        <div className="flex justify-between text-xs font-bold text-slate-400">
                          <span>{item.label}</span>
                          <span className="text-brand-teal">{(notes as any)[item.key]} / 5 stars</span>
                        </div>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setNotes((prev) => ({ ...prev, [item.key]: star }))}
                              className={cn(
                                "p-1 rounded hover:scale-110 transition-transform",
                                (notes as any)[item.key] >= star ? "text-brand-gold" : "text-slate-600"
                              )}
                            >
                              <Star size={18} fill={(notes as any)[item.key] >= star ? "currentColor" : "none"} />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}

                    <div className="h-px bg-white/5" />

                    {/* Recommendation Select */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-400">Recruiter Recommendation</label>
                      <select
                        value={notes.recommendation}
                        onChange={(e) =>
                          setNotes((p) => ({ ...p, recommendation: e.target.value as any }))
                        }
                        className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl outline-none text-xs text-white"
                      >
                        <option value="selected">🟢 Selected (Approve Candidate)</option>
                        <option value="hold">🟡 On Hold / Under Consideration</option>
                        <option value="rejected">🔴 Rejected</option>
                      </select>
                    </div>

                    {/* Remarks Area */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-400">Overall Assessment Remarks</label>
                      <textarea
                        value={notes.remarks}
                        onChange={(e) => setNotes((p) => ({ ...p, remarks: e.target.value }))}
                        rows={4}
                        placeholder="Input details on candidate performance, key strengths, weaknesses..."
                        className="w-full p-4 bg-slate-900 border border-white/10 rounded-xl outline-none text-xs text-white resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
