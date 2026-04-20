import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Review } from '../types';
import { toast } from 'sonner';
import { Star, Send, User, MessageSquare } from 'lucide-react';

export default function ReviewForm() {
  const [formData, setFormData] = useState({
    userName: '',
    rating: 5,
    comment: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userName || !formData.comment) {
      toast.error("Please fill all fields");
      return;
    }

    setSubmitting(true);
    try {
      const newReview: Omit<Review, 'id'> = {
        userName: formData.userName,
        rating: formData.rating,
        comment: formData.comment,
        status: 'pending',
        createdAt: Date.now()
      };
      await addDoc(collection(db, 'reviews'), newReview);
      toast.success("Thank you! Your review has been submitted for approval.");
      setFormData({ userName: '', rating: 5, comment: '' });
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-brand-gold/10 rounded-2xl flex items-center justify-center text-brand-gold">
          <MessageSquare size={24} />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-brand-blue">Share Your Experience</h3>
          <p className="text-gray-500">Your feedback helps us improve our services.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
            <User size={16} className="text-brand-gold" /> Full Name
          </label>
          <input 
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold transition-all"
            value={formData.userName}
            onChange={e => setFormData({...formData, userName: e.target.value})}
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Rating</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setFormData({...formData, rating: star})}
                className="transition-transform hover:scale-110"
              >
                <Star 
                  size={32} 
                  className={star <= formData.rating ? "text-brand-gold fill-brand-gold" : "text-gray-300"} 
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Your Review</label>
          <textarea 
            required
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold transition-all"
            value={formData.comment}
            onChange={e => setFormData({...formData, comment: e.target.value})}
            placeholder="Tell us about your journey with WorkinEU HR..."
          ></textarea>
        </div>

        <button 
          type="submit"
          disabled={submitting}
          className="w-full bg-brand-blue text-white py-4 rounded-xl font-bold hover:bg-brand-gold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {submitting ? "Submitting..." : <><Send size={20} /> Submit Review</>}
        </button>
      </form>
    </div>
  );
}
