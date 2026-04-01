import { Link, useNavigate } from 'react-router-dom';
import { User, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { Menu, X, Briefcase, User as UserIcon, LogOut } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';

interface NavbarProps {
  user: User | null;
}

export default function Navbar({ user }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Jobs', path: '/jobs' },
    { name: 'About Us', path: '/#about' },
    { name: 'Contact', path: '/#contact' },
  ];

  return (
    <nav className="bg-brand-blue text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-brand-gold rounded-full flex items-center justify-center">
                <Briefcase className="text-brand-blue w-6 h-6" />
              </div>
              <span className="font-serif text-xl font-bold tracking-tight">WorkinEU HR</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.path} 
                className="hover:text-brand-gold transition-colors font-medium"
              >
                {link.name}
              </Link>
            ))}
            {user ? (
              <div className="flex items-center gap-4">
                <Link 
                  to="/admin" 
                  className="bg-brand-gold text-brand-blue px-4 py-2 rounded-md font-bold hover:bg-opacity-90 transition-all"
                >
                  Dashboard
                </Link>
                <button 
                  onClick={handleLogout}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <Link 
                to="/admin/login" 
                className="flex items-center gap-2 hover:text-brand-gold transition-colors"
              >
                <UserIcon size={20} />
                <span>Admin</span>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-brand-gold focus:outline-none"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={cn("md:hidden bg-brand-blue border-t border-white/10", isOpen ? "block" : "hidden")}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-white/10"
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          {user ? (
            <>
              <Link
                to="/admin"
                className="block px-3 py-2 rounded-md text-base font-medium bg-brand-gold text-brand-blue"
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-white/10"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/admin/login"
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-white/10"
              onClick={() => setIsOpen(false)}
            >
              Admin Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
