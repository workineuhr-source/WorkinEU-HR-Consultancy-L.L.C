import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Application, Job, CandidateProfile } from '../../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Briefcase, 
  Globe, 
  PieChart as PieChartIcon, 
  BarChart3, 
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, isSameMonth } from 'date-fns';

const COLORS = ['#0a192f', '#d4af37', '#10b981', '#ef4444', '#3b82f6', '#8b5cf6', '#f59e0b', '#06b6d4'];

export default function AdminAnalytics() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [appsSnap, jobsSnap, candidatesSnap] = await Promise.all([
        getDocs(query(collection(db, 'applications'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'jobs'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'candidates'), orderBy('createdAt', 'desc')))
      ]);

      setApplications(appsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application)));
      setJobs(jobsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job)));
      setCandidates(candidatesSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as CandidateProfile)));
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Data Aggregation Functions
  const getAppStatusData = () => {
    const counts = applications.reduce((acc: any, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts).map(key => ({ name: key.charAt(0).toUpperCase() + key.slice(1), value: counts[key] }));
  };

  const getAppCountryData = () => {
    const counts = applications.reduce((acc: any, app) => {
      const country = app.appliedCountry || 'Unknown';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts)
      .map(key => ({ name: key, value: counts[key] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  };

  const getJobCategoryData = () => {
    const counts = jobs.reduce((acc: any, job) => {
      acc[job.category] = (acc[job.category] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  };

  const getCandidateNationalityData = () => {
    const counts = candidates.reduce((acc: any, cand) => {
      const nat = cand.nationality || 'Not Specified';
      acc[nat] = (acc[nat] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts)
      .map(key => ({ name: key, value: counts[key] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  };

  const getMonthlyTrendData = () => {
    const last6Months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date()
    });

    return last6Months.map(month => {
      const count = applications.filter(app => isSameMonth(new Date(app.createdAt), month)).length;
      return {
        name: format(month, 'MMM'),
        count
      };
    });
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <RefreshCw className="animate-spin text-brand-gold" size={40} />
        <p className="text-gray-500 font-medium animate-pulse">Loading in-depth insights...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-blue">Analytics & Insights</h1>
          <p className="text-gray-500">Comprehensive data visualization of your recruitment platform.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchData}
            className="p-3 bg-white border border-gray-100 rounded-xl text-gray-500 hover:text-brand-blue hover:border-brand-blue/20 transition-all shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw size={20} />
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-brand-blue text-white rounded-xl font-bold hover:bg-brand-gold transition-all shadow-lg shadow-brand-blue/10">
            <Download size={18} />
            Export Report
          </button>
        </div>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Applications', value: applications.length, icon: <Briefcase size={24} />, color: 'blue', trend: '+12%' },
          { label: 'Active Candidates', value: candidates.length, icon: <Users size={24} />, color: 'teal', trend: '+8%' },
          { label: 'Open Positions', value: jobs.length, icon: <Globe size={24} />, color: 'gold', trend: '+5%' },
          { label: 'Success Rate', value: `${Math.round((applications.filter(a => a.status === 'approved').length / (applications.length || 1)) * 100)}%`, icon: <TrendingUp size={24} />, color: 'green', trend: '+2%' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300",
                stat.color === 'blue' ? "bg-blue-50 text-blue-600" :
                stat.color === 'teal' ? "bg-teal-50 text-teal-600" :
                stat.color === 'gold' ? "bg-brand-gold/10 text-brand-gold" :
                "bg-green-50 text-green-600"
              )}>
                {stat.icon}
              </div>
              <span className="text-[10px] font-bold text-green-500 bg-green-50 px-2 py-1 rounded-full">{stat.trend}</span>
            </div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-brand-blue">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Application Trend */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-brand-blue flex items-center gap-2">
              <Calendar className="text-brand-gold" size={20} />
              Monthly Application Trend
            </h3>
            <select className="text-xs font-bold text-gray-400 bg-gray-50 border-none rounded-lg px-3 py-1.5 outline-none">
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getMonthlyTrendData()}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0a192f" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0a192f" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#0a192f" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Application Status */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-brand-blue mb-8 flex items-center gap-2">
            <PieChartIcon className="text-brand-gold" size={20} />
            Application Status
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getAppStatusData()}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {getAppStatusData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {getAppStatusData().map((item, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">{item.name}</span>
                <span className="font-bold text-brand-blue">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Applications by Country */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-brand-blue mb-8 flex items-center gap-2">
            <BarChart3 className="text-brand-gold" size={20} />
            Top Application Countries
          </h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getAppCountryData()} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#4b5563', fontSize: 12, fontWeight: 600 }}
                  width={100}
                />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" fill="#0a192f" radius={[0, 8, 8, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Job Categories */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-brand-blue mb-8 flex items-center gap-2">
            <PieChartIcon className="text-brand-gold" size={20} />
            Jobs by Category
          </h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getJobCategoryData()}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {getJobCategoryData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Candidate Nationalities */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-brand-blue mb-8 flex items-center gap-2">
            <Users className="text-brand-gold" size={20} />
            Candidate Demographics (Nationality)
          </h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getCandidateNationalityData()}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" fill="#d4af37" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Insights Card */}
        <div className="bg-brand-blue rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Sparkles className="text-brand-gold" size={24} />
              Quick Insights
            </h3>
            <div className="space-y-6">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-xs font-bold text-brand-gold uppercase tracking-widest mb-1">Top Performer</p>
                <p className="text-lg font-bold">
                  {getAppCountryData()[0]?.name || 'N/A'}
                </p>
                <p className="text-xs text-white/60 mt-1">Leading country in total applications received.</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-xs font-bold text-brand-gold uppercase tracking-widest mb-1">High Demand</p>
                <p className="text-lg font-bold">
                  {getJobCategoryData().sort((a,b) => b.value - a.value)[0]?.name || 'N/A'}
                </p>
                <p className="text-xs text-white/60 mt-1">Most popular job category among applicants.</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-xs font-bold text-brand-gold uppercase tracking-widest mb-1">Growth Trend</p>
                <p className="text-lg font-bold">Steady Increase</p>
                <p className="text-xs text-white/60 mt-1">Application volume has grown by 15% over the last quarter.</p>
              </div>
            </div>
          </div>
          <Globe className="absolute -bottom-20 -right-20 text-white/5 w-64 h-64" />
        </div>
      </div>
    </div>
  );
}
