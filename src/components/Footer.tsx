import { Link } from 'react-router-dom';
import { Facebook, Linkedin, Mail, Phone, MapPin, MessageCircle } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Company Info */}
          <div>
            <h3 className="font-serif text-2xl font-bold text-brand-gold mb-6">WorkinEU HR</h3>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Connecting top talent to career opportunities across Europe. Your trusted partner in recruitment and visa assistance.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-brand-gold hover:text-brand-blue transition-all">
                <Facebook size={20} />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-brand-gold hover:text-brand-blue transition-all">
                <Linkedin size={20} />
              </a>
              <a href="https://wa.me/971500000000" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-600 transition-all">
                <MessageCircle size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold mb-6 border-b border-brand-gold/30 pb-2 inline-block">Quick Links</h4>
            <ul className="space-y-4 text-gray-400">
              <li><Link to="/" className="hover:text-brand-gold transition-colors">Home</Link></li>
              <li><Link to="/jobs" className="hover:text-brand-gold transition-colors">Job Portal</Link></li>
              <li><Link to="/#about" className="hover:text-brand-gold transition-colors">About Us</Link></li>
              <li><Link to="/#services" className="hover:text-brand-gold transition-colors">Our Services</Link></li>
              <li><Link to="/admin/login" className="hover:text-brand-gold transition-colors">Admin Portal</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-lg font-bold mb-6 border-b border-brand-gold/30 pb-2 inline-block">Legal</h4>
            <ul className="space-y-4 text-gray-400">
              <li><Link to="/privacy-policy" className="hover:text-brand-gold transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms-conditions" className="hover:text-brand-gold transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/refund-policy" className="hover:text-brand-gold transition-colors">Refund Policy</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-bold mb-6 border-b border-brand-gold/30 pb-2 inline-block">Contact Us</h4>
            <ul className="space-y-4 text-gray-400">
              <li className="flex items-start gap-3">
                <MapPin className="text-brand-gold shrink-0 mt-1" size={18} />
                <span>Mai Tower 4th Floor, Office No. 10, Al Qusais, Al Nahda 1, Dubai, UAE</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="text-brand-gold shrink-0" size={18} />
                <span>+971 4 000 0000</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="text-brand-gold shrink-0" size={18} />
                <span>info@workineuhr.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
          <p>© {currentYear} WorkinEU HR Consultancy LLC. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
