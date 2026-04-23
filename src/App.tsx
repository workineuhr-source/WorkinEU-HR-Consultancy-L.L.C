import { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from './firebase';
import { Toaster } from 'sonner';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { SiteContent } from './types';

import ScrollToTop from './components/ScrollToTop';

// Pages
import HomePage from './pages/HomePage';
import JobsPage from './pages/JobsPage';
import JobDetailsPage from './pages/JobDetailsPage';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';
import CandidateDashboard from './pages/CandidateDashboard';
import CandidateProfilePage from './pages/CandidateProfilePage';
import DiaryPage from './pages/DiaryPage';
import DiaryDetailsPage from './pages/DiaryDetailsPage';
import AboutPage from './pages/AboutPage';
import OfficePage from './pages/OfficePage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';
import RefundPolicy from './pages/RefundPolicy';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SmartAssistant from './components/SmartAssistant';
import MobileBottomNav from './components/MobileBottomNav';
import { useLocation } from 'react-router-dom';

function AppLayout({ user, isAdmin }: { user: User | null, isAdmin: boolean }) {
  const location = useLocation();
  const isHideLayout = location.pathname.startsWith('/admin');
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      {!isHideLayout && <Navbar user={user} />}
      <main className="flex-grow pb-32 md:pb-0">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/:id" element={<JobDetailsPage />} />
          <Route path="/diary" element={<DiaryPage />} />
          <Route path="/diary/:id" element={<DiaryDetailsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/office" element={<OfficePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin/login" element={<Navigate to="/login" />} />
          <Route path="/candidate/login" element={<Navigate to="/login" />} />
          <Route 
            path="/admin/*" 
            element={user && isAdmin ? <AdminDashboard /> : <Navigate to="/login" state={{ from: { pathname: '/admin' } }} />} 
          />
          <Route 
            path="/candidate/dashboard" 
            element={user ? <CandidateDashboard /> : <Navigate to="/login" state={{ from: { pathname: '/candidate/dashboard' } }} />} 
          />
          <Route 
            path="/candidate/profile/:uid" 
            element={<CandidateProfilePage />} 
          />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-conditions" element={<TermsConditions />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
        </Routes>
      </main>
      {!isHideLayout && <Footer />}
      {!isHideLayout && (
        <SmartAssistant 
          externalOpen={isChatOpen} 
          onOpen={() => setIsChatOpen(true)}
          onClose={() => setIsChatOpen(false)} 
        />
      )}
      {!isHideLayout && <MobileBottomNav isAdmin={isAdmin} onChatClick={() => setIsChatOpen(!isChatOpen)} />}
    </div>
  );
}

import { ThemeProvider } from './context/ThemeContext';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Check default admin email
        if (currentUser.email === 'workineuhr@gmail.com') {
          setIsAdmin(true);
          // Ensure they exist in the users collection with admin role
          try {
            const userRef = doc(db, 'users', currentUser.uid);
            const userDoc = await getDoc(userRef);
            if (!userDoc.exists() || userDoc.data().role !== 'admin') {
              await setDoc(userRef, {
                email: currentUser.email,
                role: 'admin',
                updatedAt: new Date()
              }, { merge: true });
            }
          } catch (e) {
            console.error("Auto-provisioning admin failed", e);
          }
        } else {
          // Check role in Firestore
          try {
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            if (userDoc.exists() && userDoc.data().role === 'admin') {
              setIsAdmin(true);
            } else {
              setIsAdmin(false);
            }
          } catch (error) {
            console.error("Error checking admin status:", error);
            setIsAdmin(false);
          }
        }
      } else {
        setIsAdmin(false);
      }
      
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Listen for site content changes to update favicon
    const unsubscribe = onSnapshot(doc(db, 'settings', 'siteContent'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as SiteContent;
        if (data.faviconUrl) {
          let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.getElementsByTagName('head')[0].appendChild(link);
          }
          link.href = data.faviconUrl;
        }
      }
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <Router>
        <ScrollToTop />
        <AppLayout user={user} isAdmin={isAdmin} />
        <Toaster position="top-right" richColors />
      </Router>
    </ThemeProvider>
  );
}
