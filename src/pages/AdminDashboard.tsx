import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Settings, 
  Plus, 
  LogOut,
  Menu,
  X,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

// Admin Sub-pages
import AdminOverview from './admin/AdminOverview';
import AdminJobs from './admin/AdminJobs';
import AdminApplications from './admin/AdminApplications';
import AdminContent from './admin/AdminContent';

export default function AdminDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/admin/login');
  };

  const menuItems = [
    { name: 'Overview', path: '/admin', icon: <LayoutDashboard size={20} /> },
    { name: 'Manage Jobs', path: '/admin/jobs', icon: <Briefcase size={20} /> },
    { name: 'Applications', path: '/admin/applications', icon: <Users size={20} /> },
    { name: 'Site Content', path: '/admin/content', icon: <Settings size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={cn(
        "bg-brand-blue text-white w-72 fixed inset-y-0 left-0 z-50 transition-transform duration-300 transform lg:translate-x-0 lg:static",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-gold rounded-full flex items-center justify-center">
              <Briefcase className="text-brand-blue w-5 h-5" />
            </div>
            <span className="font-serif text-xl font-bold">Admin Panel</span>
          </Link>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden">
            <X size={24} />
          </button>
        </div>

        <nav className="mt-8 px-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                "flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-medium",
                location.pathname === item.path 
                  ? "bg-brand-gold text-brand-blue shadow-lg" 
                  : "hover:bg-white/10 text-gray-300"
              )}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-8 left-0 w-full px-4">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 transition-all font-medium"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-grow flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white h-20 border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className={cn("lg:hidden p-2 hover:bg-gray-100 rounded-lg", isSidebarOpen && "hidden")}
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-bold text-brand-blue">
              {menuItems.find(item => item.path === location.pathname)?.name || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-brand-blue">WorkinEU Admin</p>
              <p className="text-xs text-gray-400">Super Admin</p>
            </div>
            <div className="w-10 h-10 bg-brand-blue/5 rounded-full flex items-center justify-center text-brand-blue font-bold">
              A
            </div>
          </div>
        </header>

        {/* Viewport */}
        <div className="p-8 flex-grow">
          <Routes>
            <Route path="/" element={<AdminOverview />} />
            <Route path="/jobs" element={<AdminJobs />} />
            <Route path="/applications" element={<AdminApplications />} />
            <Route path="/content" element={<AdminContent />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
