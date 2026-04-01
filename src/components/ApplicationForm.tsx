import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Job, Application } from '../types';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'sonner';
import { useState } from 'react';
import { Upload, X, FileText, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

const schema = z.object({
  fullName: z.string().min(3, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number is required"),
  passportNumber: z.string().min(5, "Passport number is required"),
  experience: z.string().min(1, "Experience is required"),
  education: z.string().min(1, "Education is required"),
  coverLetter: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface ApplicationFormProps {
  job: Job;
  onSuccess: () => void;
}

export default function ApplicationForm({ job, onSuccess }: ApplicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<{ name: string; type: string; url: string }[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema)
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file) // Mock URL for demo
      }));
      setFiles([...files, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const application: Partial<Application> = {
        jobId: job.id,
        jobTitle: job.title,
        ...data,
        documents: files,
        status: 'pending',
        createdAt: Date.now(),
      };

      await addDoc(collection(db, 'applications'), application);
      setSubmitted(true);
      toast.success("Application submitted successfully!");
      setTimeout(() => {
        onSuccess();
      }, 3000);
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-12">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle2 size={40} />
        </motion.div>
        <h2 className="text-3xl font-bold text-brand-blue mb-4">Application Received!</h2>
        <p className="text-gray-600 mb-8">
          Thank you for applying for the <strong>{job.title}</strong> position. Our HR team will review your profile and get back to you soon.
        </p>
        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-sm text-gray-500">
          A confirmation email has been sent to your registered email address.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-10">
        <h2 className="text-3xl font-bold text-brand-blue mb-2">Apply for Position</h2>
        <p className="text-gray-500">Position: <span className="text-brand-gold font-bold">{job.title}</span></p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
            <input 
              {...register('fullName')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 transition-all"
              placeholder="Enter your full name"
            />
            {errors.fullName && <p className="text-red-500 text-xs mt-1 font-medium">{errors.fullName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
            <input 
              {...register('email')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 transition-all"
              placeholder="john@example.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1 font-medium">{errors.email.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
            <input 
              {...register('phone')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 transition-all"
              placeholder="+971 ..."
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1 font-medium">{errors.phone.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Passport Number</label>
            <input 
              {...register('passportNumber')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 transition-all"
              placeholder="Enter passport number"
            />
            {errors.passportNumber && <p className="text-red-500 text-xs mt-1 font-medium">{errors.passportNumber.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Years of Experience</label>
            <select 
              {...register('experience')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 transition-all"
            >
              <option value="">Select Experience</option>
              <option value="Entry Level">Entry Level</option>
              <option value="1-3 Years">1-3 Years</option>
              <option value="3-5 Years">3-5 Years</option>
              <option value="5-10 Years">5-10 Years</option>
              <option value="10+ Years">10+ Years</option>
            </select>
            {errors.experience && <p className="text-red-500 text-xs mt-1 font-medium">{errors.experience.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Highest Education</label>
            <input 
              {...register('education')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 transition-all"
              placeholder="e.g. Bachelor's in CS"
            />
            {errors.education && <p className="text-red-500 text-xs mt-1 font-medium">{errors.education.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Cover Letter (Optional)</label>
          <textarea 
            {...register('coverLetter')}
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 transition-all"
            placeholder="Tell us why you are a good fit..."
          ></textarea>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-4">Upload Documents (Passport, CV, Certificates)</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {files.map((file, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileText className="text-brand-gold shrink-0" size={18} />
                  <span className="text-sm font-medium truncate">{file.name}</span>
                </div>
                <button 
                  type="button"
                  onClick={() => removeFile(i)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
          
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:bg-gray-50 hover:border-brand-gold transition-all">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-400 mt-1">PDF, PNG, JPG (Max 5MB each)</p>
            </div>
            <input type="file" className="hidden" multiple onChange={handleFileChange} accept=".pdf,.png,.jpg,.jpeg" />
          </label>
        </div>

        <button 
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-brand-blue text-white py-4 rounded-xl font-bold text-lg hover:bg-brand-gold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              Submitting...
            </>
          ) : (
            "Submit Application"
          )}
        </button>
      </form>
    </div>
  );
}
