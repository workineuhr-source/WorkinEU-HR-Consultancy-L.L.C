import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="bg-gray-50 min-h-screen py-24 md:py-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-brand-teal transition-colors mb-8 group"
        >
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#121212] flex items-center justify-center shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
            <Home size={18} />
          </div>
          <span className="text-xs font-black uppercase tracking-widest">
            Back to Home
          </span>
        </Link>
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 prose prose-brand max-w-none">
          <h1 className="text-4xl font-bold text-brand-blue mb-8">
            Privacy Policy
          </h1>
          <p className="text-gray-500 dark:text-gray-300 mb-8">
            Last Updated: April 1, 2026
          </p>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-brand-blue mb-4">
              1. Introduction
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              WorkinEU HR Consultancy LLC ("we," "our," or "us") is committed to
              protecting your privacy. This Privacy Policy explains how we
              collect, use, disclose, and safeguard your information when you
              visit our website and use our services.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-brand-blue mb-4">
              2. Information We Collect
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
              We collect information that you provide directly to us when you
              apply for a job, register for an account, or contact us. This
              includes:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li>
                Personal identification information (Name, email address, phone
                number, etc.)
              </li>
              <li>Passport and identification details</li>
              <li>Educational and professional history</li>
              <li>Uploaded documents (CV, certificates, etc.)</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-brand-blue mb-4">
              3. How We Use Your Information
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li>Process your job applications</li>
              <li>Coordinate with potential employers in Europe</li>
              <li>Provide visa and documentation assistance</li>
              <li>Communicate with you regarding your application status</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-brand-blue mb-4">
              4. Data Security
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              We implement a variety of security measures to maintain the safety
              of your personal information. Your personal information is
              contained behind secured networks and is only accessible by a
              limited number of persons who have special access rights to such
              systems.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-brand-blue mb-4">
              5. Contact Us
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              If you have any questions about this Privacy Policy, please
              contact us at info@workineuhr.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
