import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function TermsConditions() {
  return (
    <div className="bg-gray-50 min-h-screen py-24 md:py-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-brand-teal transition-colors mb-8 group">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
            <Home size={18} />
          </div>
          <span className="text-xs font-black uppercase tracking-widest">Back to Home</span>
        </Link>
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 prose prose-brand max-w-none">
          <h1 className="text-4xl font-bold text-brand-blue mb-8">Terms & Conditions</h1>
          <p className="text-gray-500 mb-8">Last Updated: April 1, 2026</p>
          
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-brand-blue mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-brand-blue mb-4">2. Services Provided</h2>
            <p className="text-gray-600 leading-relaxed">
              WorkinEU HR Consultancy LLC provides recruitment consultancy, visa assistance, and documentation support for individuals seeking employment in Europe. We do not guarantee employment or visa approval, as these are subject to the discretion of employers and government authorities.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-brand-blue mb-4">3. User Responsibilities</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Users are responsible for:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Providing accurate and truthful information in applications</li>
              <li>Ensuring all uploaded documents are authentic</li>
              <li>Complying with the laws of the UAE and the destination country</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-brand-blue mb-4">4. Limitation of Liability</h2>
            <p className="text-gray-600 leading-relaxed">
              WorkinEU HR Consultancy LLC shall not be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-brand-blue mb-4">5. Governing Law</h2>
            <p className="text-gray-600 leading-relaxed">
              These terms shall be governed and construed in accordance with the laws of the United Arab Emirates.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
