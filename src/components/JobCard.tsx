import { Link } from 'react-router-dom';
import { Job } from '../types';
import { MapPin, Briefcase, Calendar, ChevronRight } from 'lucide-react';

interface JobCardProps {
  job: Job;
}

export default function JobCard({ job }: JobCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-brand-blue group-hover:text-brand-gold transition-colors">
            {job.title}
          </h3>
          <div className="flex items-center gap-2 text-gray-500 mt-1">
            <MapPin size={16} className="text-brand-gold" />
            <span className="text-sm font-medium">{job.country}</span>
          </div>
        </div>
        <span className="bg-brand-blue/10 text-brand-blue text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          {job.type}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex items-center gap-2 text-gray-600">
          <Briefcase size={16} />
          <span className="text-sm">{job.category}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar size={16} />
          <span className="text-sm">Exp: {job.experience}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
        <span className="text-lg font-bold text-brand-blue">{job.salary}</span>
        <Link 
          to={`/jobs/${job.id}`} 
          className="flex items-center gap-1 text-brand-gold font-bold hover:gap-2 transition-all"
        >
          View Details <ChevronRight size={18} />
        </Link>
      </div>
    </div>
  );
}
