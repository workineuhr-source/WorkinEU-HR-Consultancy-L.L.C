import { CandidateProfile } from '../types';
import { Mail, Phone, MapPin, Globe, Calendar, User } from 'lucide-react';

interface EuropassCVProps {
  candidate: CandidateProfile;
  id: string;
}

export default function EuropassCV({ candidate, id }: EuropassCVProps) {
  return (
    <div id={id} className="bg-white p-12 max-w-[800px] mx-auto text-slate-800 font-sans leading-relaxed">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-brand-blue pb-8 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-brand-blue mb-2 uppercase tracking-tight">{candidate.fullName}</h1>
          <p className="text-xl text-brand-gold font-semibold uppercase tracking-widest">{candidate.experience || 'Professional'}</p>
        </div>
        <div className="text-right space-y-2">
          <div className="flex items-center justify-end gap-2 text-sm">
            <span>{candidate.email}</span>
            <Mail size={14} className="text-brand-blue" />
          </div>
          <div className="flex items-center justify-end gap-2 text-sm">
            <span>{candidate.phone}</span>
            <Phone size={14} className="text-brand-blue" />
          </div>
          {candidate.address && (
            <div className="flex items-center justify-end gap-2 text-sm">
              <span>{candidate.address}</span>
              <MapPin size={14} className="text-brand-blue" />
            </div>
          )}
          {candidate.nationality && (
            <div className="flex items-center justify-end gap-2 text-sm">
              <span>{candidate.nationality}</span>
              <Globe size={14} className="text-brand-blue" />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-12">
        {/* Left Column */}
        <div className="col-span-4 space-y-10">
          {/* Personal Info */}
          <section>
            <h3 className="text-xs font-bold text-brand-blue uppercase tracking-[0.2em] mb-4 border-b border-slate-100 pb-2">Personal</h3>
            <div className="space-y-3 text-sm">
              {candidate.dateOfBirth && (
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-brand-gold" />
                  <span>{candidate.dateOfBirth}</span>
                </div>
              )}
              {candidate.gender && (
                <div className="flex items-center gap-2">
                  <User size={14} className="text-brand-gold" />
                  <span>{candidate.gender}</span>
                </div>
              )}
            </div>
          </section>

          {/* Languages */}
          {candidate.languages && candidate.languages.length > 0 && (
            <section>
              <h3 className="text-xs font-bold text-brand-blue uppercase tracking-[0.2em] mb-4 border-b border-slate-100 pb-2">Languages</h3>
              <div className="space-y-3">
                {candidate.languages.map((lang, i) => (
                  <div key={i} className="text-sm">
                    <p className="font-bold">{lang.language}</p>
                    <p className="text-xs text-slate-500">{lang.level}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Skills */}
          {candidate.skills && candidate.skills.length > 0 && (
            <section>
              <h3 className="text-xs font-bold text-brand-blue uppercase tracking-[0.2em] mb-4 border-b border-slate-100 pb-2">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {candidate.skills.map((skill, i) => (
                  <span key={i} className="text-[10px] font-bold bg-slate-100 px-2 py-1 rounded uppercase tracking-wider">
                    {skill.name} ({skill.level})
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column */}
        <div className="col-span-8 space-y-10">
          {/* Work Experience */}
          <section>
            <h3 className="text-xs font-bold text-brand-blue uppercase tracking-[0.2em] mb-6 border-b border-slate-100 pb-2">Work Experience</h3>
            <div className="space-y-8">
              {candidate.workHistory && candidate.workHistory.length > 0 ? (
                candidate.workHistory.map((work, i) => (
                  <div key={i} className="relative pl-6 border-l-2 border-brand-gold/20">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 bg-brand-gold rounded-full border-4 border-white shadow-sm"></div>
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-slate-900">{work.position}</h4>
                      <span className="text-xs font-bold text-brand-blue bg-brand-blue/5 px-2 py-1 rounded">{work.startDate} - {work.endDate}</span>
                    </div>
                    <p className="text-sm font-bold text-brand-gold mb-2">{work.company}</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{work.description}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400 italic">No work history provided.</p>
              )}
            </div>
          </section>

          {/* Education */}
          <section>
            <h3 className="text-xs font-bold text-brand-blue uppercase tracking-[0.2em] mb-6 border-b border-slate-100 pb-2">Education</h3>
            <div className="space-y-8">
              {candidate.educationHistory && candidate.educationHistory.length > 0 ? (
                candidate.educationHistory.map((edu, i) => (
                  <div key={i} className="relative pl-6 border-l-2 border-brand-blue/20">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 bg-brand-blue rounded-full border-4 border-white shadow-sm"></div>
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-slate-900">{edu.degree}</h4>
                      <span className="text-xs font-bold text-brand-gold bg-brand-gold/5 px-2 py-1 rounded">{edu.startDate} - {edu.endDate}</span>
                    </div>
                    <p className="text-sm font-bold text-brand-blue mb-2">{edu.institution}</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{edu.description}</p>
                  </div>
                ))
              ) : (
                <div className="relative pl-6 border-l-2 border-brand-blue/20">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 bg-brand-blue rounded-full border-4 border-white shadow-sm"></div>
                  <h4 className="font-bold text-slate-900">{candidate.education || 'Education Details'}</h4>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-16 pt-8 border-t border-slate-100 flex justify-between items-center opacity-50">
        <p className="text-[10px] font-bold uppercase tracking-widest">Europass Curriculum Vitae</p>
        <p className="text-[10px] font-bold uppercase tracking-widest">Generated by WorkinEU HR Consultancy</p>
      </div>
    </div>
  );
}
