import { CandidateProfile } from '../types';
import { cn } from '../lib/utils';
import { Mail, Phone, MapPin, Globe, Calendar, User, ShieldCheck, Briefcase, MessageCircle, CreditCard } from 'lucide-react';

interface EuropassCVProps {
  candidate: CandidateProfile;
  id?: string;
  theme?: string;
}

export default function EuropassCV({ candidate, id, theme = 'classic' }: EuropassCVProps) {
  const photoStyleClass = candidate.cvPhotoStyle === 'round' 
    ? 'rounded-full' 
    : (candidate.cvPhotoStyle === 'square' ? 'rounded-none' : 'rounded-3xl');

  const getThemeStyles = (t: string) => {
    switch (t) {
      case 'modern':
        return {
          wrapper: 'font-sans text-slate-800',
          headerWrap: 'flex gap-8 border-b-2 border-slate-900 pb-6 mb-6 px-4 items-center',
          nameFormat: 'text-4xl font-black tracking-tighter text-slate-900 mb-2 leading-none uppercase',
          titleFormat: 'text-lg font-bold text-slate-400 mb-4 tracking-widest uppercase',
          headerIcon: 'text-slate-900',
          photoWrapper: 'border-2 border-slate-900 p-1 rounded-none shadow-[4px_4px_0_0_rgba(15,23,42,1)]',
          sidebar: 'col-span-4 bg-white p-5 border-r-2 border-slate-100',
          sectionHeadingSidebar: 'text-[11px] font-black uppercase tracking-[0.15em] mb-4 text-slate-900 border-l-4 border-slate-900 pl-2',
          sectionHeadingMain: 'text-[13px] font-black uppercase tracking-[0.15em] mb-4 text-slate-900 border-b-2 border-slate-900 pb-2',
          widgetBg: 'bg-slate-50 p-3 rounded-none border border-slate-200 mb-3',
          accentText: 'text-slate-900',
          accentBg: 'bg-slate-900',
          badge: 'bg-slate-100 text-slate-800 border border-slate-200 font-bold rounded-none',
          bullet: 'text-slate-900 font-black',
          jobTitle: 'text-[15px] font-black text-slate-900 uppercase tracking-wider mb-0.5',
          companyTitle: 'text-slate-600 font-bold text-[13px] mb-1.5 uppercase',
          footer: 'border-t-2 border-slate-900 pt-4'
        };
      case 'elegant':
        return {
          wrapper: 'font-serif text-stone-900',
          headerWrap: 'flex flex-row-reverse gap-8 border-b border-stone-300 pb-8 mb-6 px-4 items-center',
          nameFormat: 'text-4xl font-normal tracking-widest text-stone-900 mb-2 uppercase',
          titleFormat: 'text-md font-normal text-stone-500 mb-4 tracking-[0.2em] italic',
          headerIcon: 'text-stone-400',
          photoWrapper: 'border border-stone-300 p-2 shadow-sm',
          sidebar: 'col-span-4 p-5 rounded-none border-r border-stone-200',
          sectionHeadingSidebar: 'text-[11px] font-semibold uppercase tracking-[0.2em] mb-4 text-stone-800 border-b border-stone-200 pb-2 text-center',
          sectionHeadingMain: 'text-[13px] font-semibold uppercase tracking-[0.2em] mb-4 text-stone-800 border-b border-stone-200 pb-2 text-center',
          widgetBg: 'bg-transparent p-0 mb-4',
          accentText: 'text-stone-800',
          accentBg: 'bg-stone-800',
          badge: 'border border-stone-300 text-stone-600 rounded-full px-3 shadow-none',
          bullet: 'text-stone-400',
          jobTitle: 'text-[15px] font-bold text-stone-900 mb-0.5 tracking-wide',
          companyTitle: 'text-stone-500 italic text-[13px] mb-1.5',
          footer: 'border-t border-stone-200 pt-4'
        };
      case 'professional':
        return {
          wrapper: 'font-sans text-gray-800',
          headerWrap: 'flex gap-8 border-b-4 border-brand-gold pb-6 mb-6 px-4 items-center',
          nameFormat: 'text-4xl font-extrabold tracking-tight text-[#002f6c] mb-2 uppercase',
          titleFormat: 'text-lg font-bold text-brand-gold mb-4 uppercase tracking-wider',
          headerIcon: 'text-[#002f6c]',
          photoWrapper: 'border-4 border-[#002f6c] shadow-xl',
          sidebar: 'col-span-4 bg-gray-50 p-5 rounded-2xl border-none',
          sectionHeadingSidebar: 'text-[11px] font-bold uppercase tracking-wider mb-4 text-white bg-[#002f6c] px-3 py-1.5 rounded-lg text-center',
          sectionHeadingMain: 'text-[14px] font-extrabold uppercase tracking-wider mb-4 text-[#002f6c] border-b-2 border-gray-200 pb-2',
          widgetBg: 'bg-white p-3 rounded-xl border border-gray-200 shadow-sm mb-3',
          accentText: 'text-[#002f6c]',
          accentBg: 'bg-[#002f6c]',
          badge: 'bg-[#002f6c]/10 text-[#002f6c] font-bold rounded-lg',
          bullet: 'text-brand-gold',
          jobTitle: 'text-[15px] font-black text-[#002f6c] uppercase mb-0.5',
          companyTitle: 'text-slate-600 font-bold text-[13px] mb-1.5 flex items-center gap-1.5',
          footer: 'border-t-2 border-gray-200 pt-4'
        };
      default: // classic
        return {
          wrapper: 'font-sans text-slate-800',
          headerWrap: 'flex gap-8 border-b-[3px] border-[#004494] pb-6 mb-6 px-4 items-center',
          nameFormat: 'text-4xl font-black uppercase text-[#004494] mb-2 tracking-wide leading-none',
          titleFormat: 'text-xl font-bold text-slate-600 mb-4 tracking-wider uppercase',
          headerIcon: 'text-[#004494]',
          photoWrapper: 'border-4 border-[#004494] shadow-md',
          sidebar: 'col-span-4 bg-[#f8fafd] p-5 rounded-3xl border border-[#e1e8ed]',
          sectionHeadingSidebar: 'text-[11px] font-black uppercase tracking-[0.2em] mb-4 text-[#004494] border-b-2 border-[#e1e8ed] pb-2',
          sectionHeadingMain: 'text-[13px] font-black uppercase tracking-[0.2em] mb-4 text-[#004494] border-b-2 border-slate-100 pb-2',
          widgetBg: 'bg-white p-3 rounded-xl border border-slate-200 shadow-sm mb-3',
          accentText: 'text-[#004494]',
          accentBg: 'bg-[#004494]',
          badge: 'bg-white border border-slate-200 text-slate-700 shadow-sm rounded',
          bullet: 'text-[#004494]',
          jobTitle: 'text-[15px] font-bold text-slate-900 uppercase tracking-widest mb-0.5',
          companyTitle: 'text-[#004494] font-bold text-[13px] italic mb-1.5 flex items-center gap-1.5',
          footer: 'border-t border-slate-200 pt-4'
        };
    }
  };

  const styles = getThemeStyles(theme);

  return (
      <div 
        id={id}
        contentEditable={id === 'europass-cv-live-preview'}
        suppressContentEditableWarning={true}
        className={cn("bg-white mx-auto relative shadow-none border-none", styles.wrapper, id === 'europass-cv-live-preview' ? "focus:outline-none focus:ring-4 focus:ring-brand-gold/50 cursor-text" : "")}
        style={{ 
          width: '794px', 
          minHeight: '1123px', 
        paddingTop: '20mm',
        paddingBottom: '20mm',
        paddingLeft: '5mm',
        paddingRight: '5mm',
        lineHeight: '1.2'
      }}
    >
      <style>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          #${id} {
            padding-top: 20mm !important;
            padding-bottom: 20mm !important;
            padding-left: 5mm !important;
            padding-right: 5mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            height: auto !important;
            page-break-after: auto;
          }
          .page-break-inside-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* Header Section */}
      <div className={cn("page-break-inside-avoid", styles.headerWrap)}>
        {/* Photo Section */}
        {candidate.photoUrl ? (
          <div className="shrink-0 flex items-center">
            <img 
              src={candidate.photoUrl} 
              alt={candidate.fullName} 
              className={cn("w-32 h-40 object-cover object-top", photoStyleClass, styles.photoWrapper)}
              referrerPolicy="no-referrer"
            />
          </div>
        ) : (
          <div className="shrink-0 flex items-center">
            <div className={cn("w-32 h-40 flex items-center justify-center text-white text-5xl font-black", photoStyleClass, styles.photoWrapper, styles.accentBg)}>
              {candidate.fullName.charAt(0)}
            </div>
          </div>
        )}

        <div className={cn("flex-grow flex flex-col justify-center", theme === 'elegant' ? 'text-right' : 'text-left')}>
          <h1 className={styles.nameFormat}>
            {candidate.fullName}
          </h1>
          <h2 className={styles.titleFormat}>
            {candidate.experience || 'Professional Candidate'}
          </h2>
          
          <div className={cn("flex flex-wrap gap-x-5 gap-y-2 text-[13px] font-bold text-slate-700 w-full", theme === 'elegant' ? 'justify-end' : 'justify-start')}>
            {candidate.email && (
              <div className="flex items-center gap-1.5">
                <Mail size={14} className={styles.headerIcon} />
                <span>{candidate.email}</span>
              </div>
            )}
            {candidate.phone && (
              <div className="flex items-center gap-1.5">
                <Phone size={14} className={styles.headerIcon} />
                <span>{candidate.phone}</span>
              </div>
            )}
            {candidate.whatsapp && (
              <div className="flex items-center gap-1.5">
                <MessageCircle size={14} className="text-emerald-600" />
                <span>+WA: {candidate.whatsapp}</span>
              </div>
            )}
            {candidate.address && (
              <div className="flex items-center gap-1.5">
                <MapPin size={14} className={styles.headerIcon} />
                <span>{candidate.address}</span>
              </div>
            )}
            {candidate.currentCountry && (
              <div className="flex items-center gap-1.5">
                <Globe size={14} className={styles.headerIcon} />
                <span>Currently in: {candidate.currentCountry}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 px-4">
        {/* Left Sidebar */}
        <div className={styles.sidebar}>
          
          {/* Status Indicators */}
          <div className="space-y-3 mb-6 page-break-inside-avoid">
            <h3 className={styles.sectionHeadingSidebar}>
              Verification Intel
            </h3>
            
            <div className={styles.widgetBg}>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><ShieldCheck size={12} className={styles.accentText} /> Profile Intel</p>
              <p className={cn("text-[11px] font-bold leading-tight break-words", styles.accentText)}>{candidate.profileIntel || 'Fully Verified candidate'}</p>
            </div>

            <div className={cn(styles.widgetBg, "border-l-4 border-l-brand-gold")}>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Briefcase size={12} className="text-brand-gold" /> Work Permit</p>
              <p className="text-[11px] font-bold uppercase text-brand-gold break-words">
                {candidate.workPermitStatus || 'Review Pending'}
              </p>
            </div>

            <div className={cn(styles.widgetBg, "border-l-4 border-l-blue-600")}>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Globe size={12} className="text-blue-600" /> Visa Status</p>
              <p className="text-[11px] font-bold uppercase text-blue-600 break-words">
                {candidate.globalVisaStatus || 'Review Pending'}
              </p>
            </div>
          </div>

          {/* Languages */}
          {candidate.languages && candidate.languages.length > 0 && (
            <div className="mb-6 page-break-inside-avoid">
              <h3 className={styles.sectionHeadingSidebar}>Languages</h3>
              <div className="space-y-4">
                {candidate.languages.map((lang, i) => (
                  <div key={i} className="text-sm">
                    <div className="flex justify-between items-end mb-1">
                      <p className="font-bold text-slate-800 text-[12px]">{lang.language}</p>
                      <p className={cn("text-[10px] font-bold", styles.accentText)}>{lang.level}</p>
                    </div>
                    <div className="w-full bg-[#e1e8ed] h-1.5 rounded-full overflow-hidden opacity-80">
                      <div 
                        className={cn("h-full", styles.accentBg)} 
                        style={{ 
                          width: `${lang.proficiency || (
                            lang.level.includes('Native') ? 100 : 
                            lang.level.includes('Fluent') ? 80 : 
                            lang.level.includes('Advanced') ? 70 : 
                            lang.level.includes('Intermediate') ? 50 : 30
                          )}%` 
                        }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {candidate.skills && candidate.skills.length > 0 && (
            <div className="mb-6 page-break-inside-avoid">
              <h3 className={styles.sectionHeadingSidebar}>Key Skills</h3>
              <div className="flex flex-wrap gap-2">
                {candidate.skills.map((skill, i) => (
                  <span key={i} className={cn("text-[10px] px-2 py-1", styles.badge)}>
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Personal Info */}
          <div className="mb-4 page-break-inside-avoid">
            <h3 className={styles.sectionHeadingSidebar}>Identity & Family</h3>
            <div className="space-y-3">
              <div className={styles.widgetBg}>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Birth & Identity</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar size={12} className="text-brand-gold shrink-0" />
                    <span className="text-[11px] font-bold text-slate-800">DOB: {candidate.dateOfBirth || 'Not Specified'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <User size={12} className="text-brand-gold shrink-0" />
                    <span className="text-[11px] font-bold text-slate-800">Gender: {candidate.gender || 'Not Specified'}</span>
                  </div>
                  {candidate.nationality && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Globe size={12} className="text-brand-gold shrink-0" />
                      <span className="text-[11px] font-bold text-slate-800 break-words">Nationality: {candidate.nationality}</span>
                    </div>
                  )}
                </div>
              </div>

              {(candidate.passportNumber || candidate.passportIssueDate) && (
                <div className={styles.widgetBg}>
                  <p className={cn("text-[9px] font-black uppercase tracking-widest mb-1.5", styles.accentText)}>Passport Dossier</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <CreditCard size={12} className={styles.accentText} shrink-0 />
                      <span className={cn("text-[11px] font-black uppercase break-all", styles.accentText)}>{candidate.passportNumber || 'N/A'}</span>
                    </div>
                    {candidate.passportIssueCountry && (
                      <div className="text-[10px] font-bold text-slate-600 flex items-center gap-1.5">
                        <Globe size={11} className="text-slate-400 shrink-0" /> <span className="break-words">Issued in: {candidate.passportIssueCountry}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(candidate.fatherName || candidate.motherName) && (
                <div className={styles.widgetBg}>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Family Details</p>
                  <div className="space-y-1.5 text-slate-600">
                    {candidate.fatherName && (
                      <div className="text-[11px] font-bold text-slate-800">
                        <span className="text-[9px] uppercase tracking-widest text-slate-400 block mb-0.5">Father</span>
                        {candidate.fatherName}
                      </div>
                    )}
                    {candidate.motherName && (
                      <div className="text-[11px] font-bold text-slate-800 mt-1">
                        <span className="text-[9px] uppercase tracking-widest text-slate-400 block mb-0.5">Mother</span>
                        {candidate.motherName}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-8 flex flex-col gap-6">
          
          {/* Profile Summary */}
          {(candidate.aboutMe) && (
            <div className="page-break-inside-avoid">
              <h3 className={styles.sectionHeadingMain}>
                Professional Profile
              </h3>
              <p className="text-[13px] leading-relaxed text-justify font-medium">
                {candidate.aboutMe}
              </p>
            </div>
          )}

          {/* Work Experience */}
          {candidate.workHistory && candidate.workHistory.length > 0 && (
            <div className="mb-2">
              <h3 className={styles.sectionHeadingMain}>
                Professional Experience
              </h3>
              <div className="space-y-5">
                {candidate.workHistory.map((work, i) => (
                  <div key={i} className="page-break-inside-avoid flex gap-4 pr-2">
                    <div className="w-1/4 shrink-0 text-[11px] pt-1 text-slate-500 font-bold uppercase tracking-wider leading-snug">
                      {work.startDate} – <br/>{work.endDate || 'Present'}
                    </div>
                    <div className="w-3/4">
                      <div className={styles.jobTitle}>{work.position}</div>
                      <div className={styles.companyTitle}>
                        <Briefcase size={12} className="mt-0.5" /> {work.company}
                      </div>
                      <div className="text-[13px] leading-relaxed text-justify font-medium space-y-1">
                         {work.description.split('\n').map((line, j) => {
                           const l = line.trim();
                           if (!l) return null;
                           if (l.startsWith('-') || l.startsWith('•')) {
                             return <div key={j} className="flex gap-2"><span className={cn("text-[10px] mt-1 shrink-0", styles.bullet)}>•</span> <span>{l.replace(/^[-•]\s*/, '')}</span></div>;
                           }
                           return <div key={j}>{l}</div>;
                         })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education & Training */}
          {candidate.educationHistory && candidate.educationHistory.length > 0 && (
            <div>
              <h3 className={styles.sectionHeadingMain}>
                Education & Training
              </h3>
              <div className="space-y-4">
                {candidate.educationHistory.map((edu, i) => (
                  <div key={i} className="flex gap-4 page-break-inside-avoid pr-2">
                    <div className="w-1/4 shrink-0 text-[11px] pt-1 text-slate-500 font-bold uppercase tracking-wider leading-snug">
                      {edu.startDate} – <br/>{edu.endDate || 'Present'}
                    </div>
                    <div className="w-3/4">
                      <div className={styles.jobTitle}>{edu.degree}</div>
                      <div className={styles.companyTitle}>
                        <Globe size={11} className="mt-0.5" /> {edu.institution}
                      </div>
                      {edu.description && (
                        <div className="text-[12px] leading-relaxed text-justify font-medium whitespace-pre-line">
                          {edu.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Footer */}
      <div className={cn("mt-8 text-center opacity-40 page-break-inside-avoid mx-4", styles.footer)}>
        <p className="text-[10px] tracking-widest uppercase font-bold text-slate-500">
          Generated via WorkinEU HR • Europass Protocol • {theme} Design
        </p>
      </div>

    </div>
  );
}
