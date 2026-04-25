import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { CandidateProfile } from '../types';
import { toast } from 'sonner';
import { 
  User, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Calendar, 
  Download, 
  History, 
  Award, 
  Languages,
  Printer,
  ChevronLeft,
  Loader2,
  FileText,
  Sparkles,
  MessageCircle,
  ShieldCheck,
  CheckCircle2,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import EuropassCV from '../components/EuropassCV';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';

export default function CandidateProfilePage() {
  const { uid } = useParams<{ uid: string }>();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<'classic' | 'modern' | 'professional' | 'elegant'>('classic');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!uid) return;
      try {
        const docRef = doc(db, 'candidates', uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as CandidateProfile;
          setProfile(data);
          if (data.cvTemplate) {
            setSelectedTheme(data.cvTemplate as any);
          }
          setIsOwner(auth.currentUser?.uid === uid);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [uid]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async (theme: 'classic' | 'modern' | 'professional' | 'elegant') => {
    if (!profile) return;
    setIsGenerating(true);
    setSelectedTheme(theme);
    
    // We'll use a small timeout to let the hidden EuropassCV render with the right theme
    setTimeout(async () => {
      try {
        const targetId = 'europass-cv-download-template';
        const element = document.getElementById(targetId);
        if (!element) throw new Error("Template not found");

        // --- PAGINATION AUTO-ADJUST LOGIC ---
        const elemWidth = element.offsetWidth;
        const mmToPx = elemWidth / 210; // A4 width is 210mm
        
        const topMarginMm = 10;
        const bottomMarginMm = 15;
        
        const firstPageContentPx = (297 - bottomMarginMm) * mmToPx;
        const otherPageContentPx = (297 - topMarginMm - bottomMarginMm) * mmToPx;
        
        const getPageForOffset = (y: number) => {
          if (y < firstPageContentPx) return 0;
          return 1 + Math.floor((y - firstPageContentPx) / otherPageContentPx);
        };
        
        const getPageStartPx = (page: number) => {
          if (page === 0) return 0;
          return firstPageContentPx + (page - 1) * otherPageContentPx;
        };
        
        const avoidBreakElements = element.querySelectorAll('.page-break-inside-avoid');
        
        // Reset any previous modifications
        avoidBreakElements.forEach((el) => {
          (el as HTMLElement).style.marginTop = '0px';
        });

        // Iteratively shift elements that straddle a page boundary
        avoidBreakElements.forEach((el) => {
          const htmlEl = el as HTMLElement;
          const rect = htmlEl.getBoundingClientRect();
          const docRect = element.getBoundingClientRect();
          
          const topInDoc = rect.top - docRect.top;
          const bottomInDoc = topInDoc + rect.height;
          
          const startPage = getPageForOffset(topInDoc + 5); 
          const endPage = getPageForOffset(bottomInDoc - 5); 
          
          // If the element crosses a page boundary
          if (endPage > startPage && startPage >= 0) {
            const targetTop = getPageStartPx(startPage + 1);
            const shiftAmount = targetTop - topInDoc;
            const currentMargin = parseFloat(window.getComputedStyle(htmlEl).marginTop) || 0;
            
            // Push element to the start of the next page with a generous padding
            htmlEl.style.marginTop = `${currentMargin + shiftAmount + (20 * mmToPx)}px`;
          }
        });

        // Allow the browser to repaint layout before capturing
        await new Promise(resolve => setTimeout(resolve, 50));
        // ------------------------------------

        // Capture image
        const imgData = await toPng(element, {
           quality: 1.0,
           pixelRatio: 3, // For HD quality
           backgroundColor: '#ffffff',
           style: {
             transform: 'scale(1)',
             transformOrigin: 'top left'
           }
        });
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        
        // Re-calculate height as the element might have grown from the margins
        const finalHeight = element.offsetHeight;
        
        // Ratio of PDF mm per DOM pixel
        const ratio = pdfWidth / elemWidth; 
        const imgHeightInPdf = finalHeight * ratio;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeightInPdf, undefined, 'FAST');
        
        const drawFooter = () => {
           pdf.setFillColor(255, 255, 255);
           pdf.rect(0, pageHeight - bottomMarginMm, pdfWidth, bottomMarginMm, 'F');
           pdf.setFontSize(8);
           pdf.setTextColor(150, 150, 150);
           const footerText = `GENERATED VIA WORKINEU HR EUROPASS PROTOCOL ${theme.toUpperCase()} DESIGN`;
           pdf.text(footerText, pdfWidth / 2, pageHeight - 6, { align: 'center' });
        };
        
        drawFooter();

        let heightRenderedInMm = pageHeight - bottomMarginMm;
        let heightLeftMm = imgHeightInPdf - heightRenderedInMm;

        // Slice into more pages if needed
        while (heightLeftMm > 5) {
          pdf.addPage();
          
          const yPos = topMarginMm - heightRenderedInMm;
          pdf.addImage(imgData, 'PNG', 0, yPos, pdfWidth, imgHeightInPdf, undefined, 'FAST');
          
          // Cover top margin
          pdf.setFillColor(255, 255, 255);
          pdf.rect(0, 0, pdfWidth, topMarginMm, 'F');
          
          drawFooter();
          
          heightRenderedInMm += (pageHeight - topMarginMm - bottomMarginMm);
          heightLeftMm = imgHeightInPdf - heightRenderedInMm;
        }

        pdf.save(`Europass_CV_${profile.fullName.replace(/\s+/g, '_')}_${theme}.pdf`);
      } catch (error) {
        console.error("PDF Generation Error:", error);
      } finally {
        setIsGenerating(false);
      }
    }, 600);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-brand-blue" size={48} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
        <div className="text-center bg-white p-12 rounded-3xl shadow-xl max-w-md border border-gray-100">
          <User className="mx-auto text-gray-300 mb-6" size={64} />
          <h2 className="text-2xl font-bold text-brand-blue mb-4">Profile Not Found</h2>
          <Link to="/" className="text-brand-gold font-bold hover:underline">Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white pb-20 pt-28 font-sans">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        
        {/* Header Actions & Theme Selector */}
        <div className="mb-8 print:hidden flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative z-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-blue rounded-xl flex items-center justify-center text-white shadow-lg">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-brand-blue uppercase tracking-tight">CV Designer</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select a theme to update your CV</p>
            </div>
          </div>
          
          <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            {[
              { id: 'classic', name: 'Classic Professional' },
              { id: 'modern', name: 'Modern Tech' },
              { id: 'professional', name: 'Executive Blue' },
              { id: 'elegant', name: 'Premium Elegant' }
            ].map(themeOption => (
              <button 
                key={themeOption.id}
                onClick={async () => {
                  setSelectedTheme(themeOption.id as any);
                  if (profile && profile.uid) {
                    try {
                      await updateDoc(doc(db, 'candidates', profile.uid), { cvTemplate: themeOption.id });
                      setProfile({ ...profile, cvTemplate: themeOption.id });
                      toast.success(`${themeOption.name} selected`);
                    } catch (e) {
                      console.error("Failed to save template", e);
                    }
                  }
                }}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                  selectedTheme === themeOption.id 
                    ? "bg-brand-blue text-white shadow-md" 
                    : "bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-brand-blue"
                )}
              >
                {themeOption.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => handleDownload(selectedTheme)}
              disabled={isGenerating}
              className="bg-[#004494] text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-800 transition-all shadow-md flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
              {isGenerating ? 'Generating...' : 'Download HD PDF'}
            </button>
          </div>
        </div>

        {/* Live CV Prewview */}
        <motion.div 
          key="cv-designer"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-gold text-brand-blue px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg z-10 text-center flex items-center justify-center gap-2 print:hidden">
            <Sparkles size={12} />
            Live 4K HD Preview (Click text to edit)
          </div>
          
          <div className="bg-white rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] overflow-hidden border border-gray-100 mt-4 print:shadow-none print:border-none print:rounded-none">
            <div className="transform origin-top scale-[1.0] transition-transform duration-500">
               <EuropassCV id="europass-cv-live-preview" candidate={profile} theme={selectedTheme} />
            </div>
          </div>
        </motion.div>

        {/* Hidden CV For Download Generation */}
        <div className="fixed -left-[10000px] top-0 pointer-events-none">
          <EuropassCV id="europass-cv-download-template" candidate={profile} theme={selectedTheme} />
        </div>

        {/* Floating Call to Action */}
        {isOwner && (
           <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-[#0a192f] text-white px-8 py-4 rounded-full shadow-2xl z-50 print:hidden hover:scale-105 transition-transform duration-300">
             <div className="flex items-center gap-3 pr-4 border-r border-white/20">
               <div className="w-10 h-10 bg-brand-gold rounded-full flex items-center justify-center text-brand-blue">
                 <User size={20} />
               </div>
               <div>
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Control Panel</p>
                 <p className="text-xs font-bold">This is your live profile</p>
               </div>
             </div>
             <Link 
               to="/candidate/dashboard" 
               className="flex items-center gap-2 text-brand-gold font-bold text-xs uppercase tracking-widest hover:text-white transition-colors"
             >
               Edit Your Data <ChevronLeft size={16} className="rotate-180" />
             </Link>
           </div>
        )}
      </div>
    </div>
  );
}
