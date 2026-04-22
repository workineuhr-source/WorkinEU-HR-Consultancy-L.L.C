import { CandidateProfile } from '../types';
import { Mail, Phone, MapPin, Globe, Calendar, User, Sparkles, ShieldCheck, Briefcase, MessageCircle, CreditCard } from 'lucide-react';
import { cn } from '../lib/utils';

interface EuropassCVProps {
  candidate: CandidateProfile;
  id: string;
  theme?: 'classic' | 'modern' | 'professional' | 'elegant';
}

export default function EuropassCV({ candidate, id, theme = 'classic' }: EuropassCVProps) {
  const getThemeStyles = () => {
    switch (theme) {
      case 'modern':
        return {
          container: "bg-white p-14 text-slate-900 font-sans shadow-none border border-slate-100",
          header: "border-b-4 border-slate-900 pb-12 mb-12 flex items-center gap-10",
          sidebar: "bg-slate-50 p-10 rounded-[3rem] border border-slate-100",
          accentText: "text-slate-900",
          accentBg: "bg-slate-900",
          heading: "text-slate-900 border-l-[10px] border-slate-900 pl-6 font-black uppercase tracking-[0.2em] text-[11px]",
          badge: "bg-slate-900 text-white px-3 py-1.5 rounded-xl",
          photo: "w-48 h-48 rounded-[2.5rem] object-cover border-4 border-slate-900 shadow-2xl"
        };
      case 'professional':
        return {
          container: "bg-white p-14 text-gray-900 font-sans shadow-none",
          header: "bg-[#004494] text-white p-12 -mx-14 -mt-14 mb-14 rounded-b-[4rem] flex justify-between items-center",
          sidebar: "border-r-2 border-slate-100 pr-10",
          accentText: "text-[#004494]",
          accentBg: "bg-[#004494]",
          heading: "text-[#004494] border-b-2 border-slate-100 pb-3 font-black uppercase tracking-widest text-[11px]",
          badge: "bg-[#004494]/5 text-[#004494] border border-[#004494]/10 px-3 py-1.5 rounded-xl font-bold",
          photo: "w-44 h-44 rounded-full object-cover border-8 border-white/20 shadow-2xl"
        };
      case 'elegant':
        return {
          container: "bg-white p-14 text-stone-900 font-serif shadow-none",
          header: "border-b border-stone-200 pb-12 mb-14 text-center flex flex-col items-center",
          sidebar: "space-y-14 p-4",
          accentText: "text-stone-900",
          accentBg: "bg-stone-900",
          heading: "text-stone-900 text-[12px] font-black uppercase tracking-[0.3em] border-b border-stone-100 pb-3",
          badge: "bg-stone-50 border border-stone-200 text-stone-600 font-sans text-[10px] px-3 py-1.5 rounded-lg",
          photo: "w-40 h-40 rounded-3xl object-cover border border-stone-100 shadow-xl mb-6"
        };
      default: // classic (Official Europass Standard)
        return {
          container: "bg-white p-14 text-[#2d3e50] font-sans shadow-none relative",
          header: "border-b-[6px] border-[#004494] pb-12 mb-12 flex items-center gap-12",
          sidebar: "bg-[#f5f7f9] p-10 rounded-[2.5rem] border border-[#e1e8ed]",
          accentText: "text-[#004494]",
          accentBg: "bg-[#004494]",
          heading: "text-[#004494] font-black uppercase tracking-[0.2em] border-b-2 border-[#e1e8ed] pb-2 text-[11px]",
          badge: "bg-white border border-[#e1e8ed] text-slate-600 px-3 py-1 shadow-sm",
          photo: "w-48 h-48 rounded-3xl object-cover border-[6px] border-[#004494] shadow-2xl shrink-0"
        };
    }
  };

  const styles = getThemeStyles();

  const photoStyleClass = candidate.cvPhotoStyle === 'round' 
    ? 'rounded-full' 
    : (candidate.cvPhotoStyle === 'square' ? 'rounded-none' : styles.photo);

  return (
    <div 
      id={id} 
      className={cn(
        "bg-white leading-relaxed print:p-0", 
        // A4 conversion: 210mm wide. At 96dpi, that's ~794px.
        "w-[794px] min-h-[1123px] mx-auto relative shadow-none border-none",
        // Standard Printing Margins (20mm = ~75px)
        "p-[20mm] box-border overflow-hidden",
        styles.container
      )}
    >
      <style>{`
        @media print {
          #${id} {
            padding: 20mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
          }
        }
      `}</style>

      {/* Official Europass Header - Photo & Job Title Top Centered */}
      <div className={cn(styles.header, "pt-4")}>
        {/* Photo Section */}
        {(theme === 'classic' || theme === 'modern' || theme === 'professional') && (
           <div className={cn("shrink-0", theme === 'professional' ? 'order-last' : '')}>
             {candidate.photoUrl ? (
                <img src={candidate.photoUrl} alt={candidate.fullName} className={cn(styles.photo, photoStyleClass)} referrerPolicy="no-referrer" />
             ) : (
                <div className={cn(styles.photo, photoStyleClass, "bg-brand-blue flex items-center justify-center text-white text-6xl font-black")}>
                   {candidate.fullName.charAt(0)}
                </div>
             )}
           </div>
        )}

        <div className={cn("flex-grow", theme === 'elegant' ? 'w-full' : '')}>
          {theme === 'elegant' && (
             <div className="mb-8 flex justify-center">
               {candidate.photoUrl ? (
                  <img src={candidate.photoUrl} alt={candidate.fullName} className={cn(styles.photo, photoStyleClass)} referrerPolicy="no-referrer" />
               ) : (
                  <div className={cn(styles.photo, photoStyleClass, "bg-stone-100 flex items-center justify-center text-stone-300 text-5xl font-black")}>
                    {candidate.fullName.charAt(0)}
                  </div>
               )}
             </div>
          )}
          <h1 className={cn(
            "text-6xl font-black mb-3 uppercase tracking-tight leading-none", 
            theme === 'professional' ? 'text-white' : styles.accentText
          )}>
            {candidate.fullName}
          </h1>
          <div className="flex flex-col gap-1">
            <p className={cn("text-2xl font-black py-1 rounded-lg inline-block uppercase tracking-widest", theme === 'professional' ? 'text-blue-100' : 'text-[#004494]')}>
              {candidate.experience || 'Professional Candidate'}
            </p>
            {/* Direct Contact info under Title for better flow */}
            <div className={cn("flex flex-wrap gap-x-6 gap-y-3 mt-4", theme === 'professional' ? 'text-blue-50' : 'text-slate-500 font-bold text-sm')}>
               <div className="flex items-center gap-2">
                 <Mail size={16} className={theme === 'professional' ? 'text-white' : styles.accentText} />
                 <span>{candidate.email}</span>
               </div>
               <div className="flex items-center gap-2">
                 <Phone size={16} className={theme === 'professional' ? 'text-white' : styles.accentText} />
                 <span>{candidate.phone}</span>
               </div>
               {candidate.whatsapp && (
                 <div className="flex items-center gap-2">
                   <MessageCircle size={16} className="text-emerald-500" />
                   <span>WA: {candidate.whatsapp}</span>
                 </div>
               )}
               {candidate.address && (
                 <div className="flex items-center gap-2">
                   <MapPin size={16} className={theme === 'professional' ? 'text-white' : styles.accentText} />
                   <span>{candidate.address}</span>
                 </div>
               )}
               {candidate.nationality && (
                 <div className="flex items-center gap-2">
                   <Globe size={16} className={theme === 'professional' ? 'text-white' : styles.accentText} />
                   <span>{candidate.nationality}</span>
                 </div>
               )}
               {candidate.homeCountry && (
                 <div className="flex items-center gap-2">
                   <Globe size={16} className="text-brand-gold" />
                   <span>Origin: {candidate.homeCountry}</span>
                 </div>
               )}
               {candidate.currentCountry && (
                 <div className="flex items-center gap-2 border-l-2 border-slate-200 pl-4 ml-2">
                   <MapPin size={16} className="text-brand-teal" />
                   <span>Currently in: {candidate.currentCountry}</span>
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>

      {theme === 'elegant' && null}

      <div className="grid grid-cols-12 gap-12">
        {/* Left Column - Skills, Languages, Statuses */}
        <div className={cn("col-span-4", styles.sidebar)}>
          {/* Status Indicators */}
          <section className="space-y-6">
            <h3 className={cn("text-[10px] font-black uppercase tracking-[0.2em] mb-4 shadow-sm inline-block px-3 py-1 bg-white rounded-lg border border-slate-100", styles.heading)}>
              Verification Intel
            </h3>
            
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><ShieldCheck size={10} className="text-brand-blue" /> Profile Intel</p>
              <p className="text-xs font-black text-brand-blue leading-tight uppercase">{candidate.profileIntel || 'Fully Verified candidate'}</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm border-l-4 border-l-brand-gold">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Briefcase size={10} className="text-brand-gold" /> Work Permit</p>
              <p className="text-[10px] font-black uppercase text-brand-gold">
                {candidate.workPermitStatus || 'Review Pending'}
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm border-l-4 border-l-blue-600">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Globe size={10} className="text-blue-600" /> Visa Status</p>
              <p className="text-[10px] font-black uppercase text-blue-600">
                {candidate.globalVisaStatus || 'Review Pending'}
              </p>
            </div>
          </section>

          {/* Languages */}
          {candidate.languages && candidate.languages.length > 0 && (
            <section className="pt-6">
              <h3 className={cn("text-[10px] font-black uppercase tracking-[0.2em] mb-4", styles.heading)}>Languages</h3>
              <div className="space-y-5">
                {candidate.languages.map((lang, i) => (
                  <div key={i} className="text-sm">
                    <div className="flex justify-between items-end mb-1.5">
                      <p className="font-black text-slate-800 uppercase tracking-tight text-xs">{lang.language}</p>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(star => (
                          <div 
                            key={star} 
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              (lang.proficiency || (lang.level.includes('Native') ? 100 : lang.level.includes('Fluent') ? 80 : lang.level.includes('Advanced') ? 70 : 40)) >= star * 20 
                                ? styles.accentBg 
                                : "bg-slate-200"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="w-full bg-white h-1.5 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                      <div 
                        className={cn("h-full transition-all duration-500", styles.accentBg)} 
                        style={{ 
                          width: `${lang.proficiency || (
                            lang.level.includes('Native') ? 100 : 
                            lang.level.includes('Fluent') ? 80 : 
                            lang.level.includes('Advanced') ? 70 : 
                            lang.level.includes('Intermediate') ? 50 : 
                            30
                          )}%` 
                        }} 
                      />
                    </div>
                    <p className={cn("text-[8px] mt-1.5 uppercase font-black tracking-widest opacity-70", styles.accentText)}>
                      {lang.level} {lang.proficiency ? `(${lang.proficiency}%)` : ''}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Skills */}
          {candidate.skills && candidate.skills.length > 0 && (
            <section className="pt-6">
              <h3 className={cn("text-[10px] font-black uppercase tracking-[0.2em] mb-4", styles.heading)}>Key Skills</h3>
              <div className="flex flex-wrap gap-2">
                {candidate.skills.map((skill, i) => (
                  <span key={i} className={cn("text-[9px] font-bold px-2 py-1 rounded uppercase tracking-wider", styles.badge)}>
                    {skill.name}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Personal Info */}
          <section className="pt-6">
            <h3 className={cn("text-[10px] font-black uppercase tracking-[0.2em] mb-4", styles.heading)}>Identity & Family</h3>
            <div className="space-y-4 text-sm">
              <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-tiny">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Birth & Identity</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar size={10} className="text-brand-gold" />
                    <span className="text-[10px] font-bold">DOB: {candidate.dateOfBirth || 'Not Specified'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <User size={10} className="text-brand-gold" />
                    <span className="text-[10px] font-bold">Gender: {candidate.gender || 'Not Specified'}</span>
                  </div>
                </div>
              </div>

              {(candidate.passportNumber || candidate.passportIssueDate) && (
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-tiny">
                  <p className="text-[8px] font-black text-[#004494] uppercase tracking-widest mb-1">Passport Dossier</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-600">
                      <CreditCard size={10} className="text-[#004494]" />
                      <span className="text-[10px] font-black text-[#004494] uppercase">{candidate.passportNumber || 'N/A'}</span>
                    </div>
                    {candidate.passportIssueCountry && (
                      <div className="text-[9px] font-bold text-slate-500 flex items-center gap-1.5 ml-0.5">
                        <Globe size={10} className="text-slate-400" /> Issued by: {candidate.passportIssueCountry}
                      </div>
                    )}
                    <div className="flex flex-col gap-1 ml-0.5 pt-1 border-t border-slate-50">
                      {candidate.passportIssueDate && (
                        <p className="text-[8px] font-bold text-slate-400">Issue: <span className="text-slate-600">{candidate.passportIssueDate}</span></p>
                      )}
                      {candidate.passportExpiryDate && (
                        <p className="text-[8px] font-bold text-slate-400">Expiry: <span className="text-red-500">{candidate.passportExpiryDate}</span></p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {(candidate.fatherName || candidate.motherName) && (
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-tiny">
                  <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1">Family Relations</p>
                  <div className="space-y-2">
                    {candidate.fatherName && (
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.1em]">Father's Name</span>
                        <span className="text-[10px] font-bold text-slate-700">{candidate.fatherName}</span>
                      </div>
                    )}
                    {candidate.motherName && (
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.1em]">Mother's Name</span>
                        <span className="text-[10px] font-bold text-slate-700">{candidate.motherName}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column - About Me, Work & Education */}
        <div className="col-span-8 space-y-12">
          {/* About Me Section */}
          <section className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
            <h3 className={cn("text-[10px] font-black uppercase tracking-[0.2em] mb-4", styles.heading)}>Professional Profile</h3>
            <p className={cn("text-sm leading-relaxed", theme === 'elegant' ? 'italic text-stone-600' : 'text-slate-700')}>
              {candidate.aboutMe || 'Professional talent seeking opportunities with WorkinEU HR Consultancy. Experienced in collaborating across diverse teams and delivering high-quality results.'}
            </p>
          </section>

          {/* Work Experience */}
          <section>
            <h3 className={cn("text-[10px] font-black uppercase tracking-[0.2em] mb-10", styles.heading)}>Professional Experience</h3>
            <div className="space-y-12">
              {candidate.workHistory && candidate.workHistory.length > 0 ? (
                candidate.workHistory.map((work, i) => (
                  <div key={i} className="relative pl-10 border-l-[3px] border-slate-100 pb-2 group">
                    <div className={cn("absolute -left-[9.5px] top-0 w-4 h-4 rounded-full border-4 border-white shadow-md", styles.accentBg)}></div>
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-black text-slate-900 text-xl tracking-tight leading-none uppercase">{work.position}</h4>
                      <div className="text-right">
                        <span className="text-[11px] font-black text-white bg-[#004494] px-4 py-1.5 rounded-xl shadow-lg shadow-[#004494]/20 tracking-widest whitespace-nowrap">
                          {work.startDate} — {work.endDate || 'PRESENT'}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm font-black text-brand-gold mb-5 flex items-center gap-2 uppercase tracking-[0.1em] bg-brand-gold/5 px-3 py-1 rounded-lg border border-brand-gold/10 inline-flex">
                      <Briefcase size={12} /> {work.company}
                    </p>
                    <p className="text-sm text-slate-700 leading-[1.8] text-justify font-medium">{work.description}</p>
                  </div>
                ))
              ) : (
                <div className="bg-slate-50 p-10 rounded-[3rem] border-2 border-dashed border-slate-200">
                  <p className="text-sm text-slate-400 font-bold italic text-center uppercase tracking-widest">Formal professional dossier available upon invitation.</p>
                </div>
              )}
            </div>
          </section>

          {/* Education */}
          <section>
            <h3 className={cn("text-[10px] font-black uppercase tracking-[0.2em] mb-8", styles.heading)}>Academic Background</h3>
            <div className="space-y-10">
              {candidate.educationHistory && candidate.educationHistory.length > 0 ? (
                candidate.educationHistory.map((edu, i) => (
                  <div key={i} className="relative pl-8 border-l-2 border-slate-100">
                    <div className={cn("absolute -left-[5px] top-0 w-2 h-2 rounded-full", styles.accentBg)}></div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-slate-900">{edu.degree}</h4>
                      <span className="text-[10px] font-bold text-brand-blue bg-blue-50 px-2 py-1 rounded tracking-tighter">{edu.startDate} — {edu.endDate}</span>
                    </div>
                    <p className="text-sm font-bold text-brand-blue mb-2 italic">
                      <span className="text-[10px] uppercase tracking-widest text-slate-400 not-italic mr-2">Targeting:</span>
                      {candidate.experience || edu.institution}
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">{edu.description}</p>
                  </div>
                ))
              ) : (
                <div className="relative pl-8 border-l-2 border-slate-100">
                  <div className={cn("absolute -left-[5px] top-0 w-2 h-2 rounded-full", styles.accentBg)}></div>
                  <h4 className="font-bold text-slate-900">{candidate.education || 'Academic Information Not Provided'}</h4>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <div className={cn("mt-20 pt-8 border-t flex justify-between items-center opacity-30", theme === 'elegant' ? 'border-stone-200' : 'border-slate-100')}>
        <div className="flex items-center gap-2">
          <Globe size={10} />
          <p className="text-[8px] font-black uppercase tracking-widest">Europass Protocol CV v2.4</p>
        </div>
        <p className="text-[8px] font-black uppercase tracking-widest">WorkinEU HR Consultancy Proprietary Document</p>
      </div>
    </div>
  );
}
