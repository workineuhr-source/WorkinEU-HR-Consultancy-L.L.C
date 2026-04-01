import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { Job, Application } from '../../types';
import { 
  TrendingUp, 
  Users, 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  Settings
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

export default function AdminOverview() {
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalApplications: 0,
    activeCandidates: 0,
    pendingApplications: 0
  });
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const jobsSnap = await getDocs(collection(db, 'jobs'));
        const appsSnap = await getDocs(collection(db, 'applications'));
        
        const apps = appsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
        
        setStats({
          totalJobs: jobsSnap.size,
          totalApplications: appsSnap.size,
          activeCandidates: new Set(apps.map(a => a.email)).size,
          pendingApplications: apps.filter(a => a.status === 'pending').length
        });

        const q = query(collection(db, 'applications'), orderBy('createdAt', 'desc'), limit(5));
        const recentSnap = await getDocs(q);
        setRecentApplications(recentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application)));
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { name: 'Total Jobs', value: stats.totalJobs, icon: <Briefcase size={24} />, color: 'bg-blue-500' },
    { name: 'Total Applications', value: stats.totalApplications, icon: <Users size={24} />, color: 'bg-purple-500' },
    { name: 'Active Candidates', value: stats.activeCandidates, icon: <TrendingUp size={24} />, color: 'bg-green-500' },
    { name: 'Pending Review', value: stats.pendingApplications, icon: <Clock size={24} />, color: 'bg-orange-500' },
  ];

  if (loading) {
    return <div className="animate-pulse space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white rounded-2xl"></div>)}
      </div>
      <div className="h-96 bg-white rounded-2xl"></div>
    </div>;
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-6">
            <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg", stat.color)}>
              {stat.icon}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">{stat.name}</p>
              <p className="text-3xl font-bold text-brand-blue">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Applications */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex justify-between items-center">
            <h3 className="text-xl font-bold text-brand-blue">Recent Applications</h3>
            <Link to="/admin/applications" className="text-brand-gold font-bold text-sm flex items-center gap-1">
              View All <ChevronRight size={16} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-400 text-xs font-bold uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-4">Candidate</th>
                  <th className="px-8 py-4">Job Position</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-8 py-6">
                      <p className="font-bold text-brand-blue">{app.fullName}</p>
                      <p className="text-xs text-gray-400">{app.email}</p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-medium text-gray-700">{app.jobTitle}</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                        app.status === 'pending' ? "bg-orange-100 text-orange-600" :
                        app.status === 'approved' ? "bg-green-100 text-green-600" :
                        "bg-red-100 text-red-600"
                      )}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-sm text-gray-400">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h3 className="text-xl font-bold text-brand-blue mb-8">Quick Actions</h3>
          <div className="space-y-4">
            <Link 
              to="/admin/jobs" 
              className="flex items-center justify-between p-4 bg-brand-blue/5 rounded-xl hover:bg-brand-blue/10 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-brand-blue text-white rounded-lg flex items-center justify-center">
                  <Plus size={20} />
                </div>
                <span className="font-bold text-brand-blue">Post New Job</span>
              </div>
              <ChevronRight className="text-gray-300 group-hover:text-brand-blue transition-colors" size={20} />
            </Link>
            <Link 
              to="/admin/content" 
              className="flex items-center justify-between p-4 bg-brand-gold/5 rounded-xl hover:bg-brand-gold/10 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-brand-gold text-brand-blue rounded-lg flex items-center justify-center">
                  <Settings size={20} />
                </div>
                <span className="font-bold text-brand-blue">Update Website</span>
              </div>
              <ChevronRight className="text-gray-300 group-hover:text-brand-gold transition-colors" size={20} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Plus({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
