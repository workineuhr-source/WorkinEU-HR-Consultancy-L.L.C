import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { SiteContent } from '../../types';
import { toast } from 'sonner';
import { Save, Globe, Info, Briefcase, MapPin, Plus, Trash2 } from 'lucide-react';

export default function AdminContent() {
  const [content, setContent] = useState<SiteContent>({
    heroTagline: 'Connecting Talent to Europe',
    aboutUs: 'WorkinEU HR Consultancy LLC is a premier recruitment agency based in Dubai, UAE...',
    services: [
      { title: 'International Recruitment', description: 'We connect skilled professionals with top-tier European employers.' },
      { title: 'Visa Assistance', description: 'Expert guidance through the complex visa application process.' }
    ],
    countries: ['Germany', 'Poland', 'Czech Republic']
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const docRef = doc(db, 'siteContent', 'main');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setContent(docSnap.data() as SiteContent);
        }
      } catch (error) {
        console.error("Error fetching content:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'siteContent', 'main'), content);
      toast.success("Website content updated successfully!");
    } catch (error) {
      toast.error("Failed to update content");
    } finally {
      setSaving(false);
    }
  };

  const handleServiceChange = (index: number, field: 'title' | 'description', value: string) => {
    const newServices = [...content.services];
    newServices[index][field] = value;
    setContent({ ...content, services: newServices });
  };

  const addService = () => {
    setContent({ ...content, services: [...content.services, { title: '', description: '' }] });
  };

  const removeService = (index: number) => {
    setContent({ ...content, services: content.services.filter((_, i) => i !== index) });
  };

  const handleCountryChange = (index: number, value: string) => {
    const newCountries = [...content.countries];
    newCountries[index] = value;
    setContent({ ...content, countries: newCountries });
  };

  const addCountry = () => {
    setContent({ ...content, countries: [...content.countries, ''] });
  };

  const removeCountry = (index: number) => {
    setContent({ ...content, countries: content.countries.filter((_, i) => i !== index) });
  };

  if (loading) return <div className="animate-pulse h-96 bg-white rounded-2xl"></div>;

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-brand-blue">Content Management</h1>
          <p className="text-gray-500">Update the text and information displayed on the landing page.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-brand-blue text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-brand-gold transition-all shadow-lg disabled:opacity-70"
        >
          {saving ? "Saving..." : <><Save size={20} /> Save Changes</>}
        </button>
      </div>

      <div className="space-y-8">
        {/* Hero Section */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-brand-blue mb-6 flex items-center gap-2">
            <Globe className="text-brand-gold" /> Hero Section
          </h3>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Hero Tagline</label>
            <input 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold transition-all"
              value={content.heroTagline}
              onChange={(e) => setContent({ ...content, heroTagline: e.target.value })}
            />
          </div>
        </div>

        {/* About Us */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-brand-blue mb-6 flex items-center gap-2">
            <Info className="text-brand-gold" /> About Us Section
          </h3>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">About Us Text</label>
            <textarea 
              rows={6}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold transition-all"
              value={content.aboutUs}
              onChange={(e) => setContent({ ...content, aboutUs: e.target.value })}
            ></textarea>
          </div>
        </div>

        {/* Services */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-brand-blue flex items-center gap-2">
              <Briefcase className="text-brand-gold" /> Services
            </h3>
            <button onClick={addService} className="text-brand-gold font-bold text-sm flex items-center gap-1">
              <Plus size={16} /> Add Service
            </button>
          </div>
          <div className="space-y-6">
            {content.services.map((service, i) => (
              <div key={i} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 relative group">
                <button 
                  onClick={() => removeService(i)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={18} />
                </button>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Service Title</label>
                    <input 
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-gold bg-white"
                      value={service.title}
                      onChange={(e) => handleServiceChange(i, 'title', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                    <textarea 
                      rows={2}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-gold bg-white"
                      value={service.description}
                      onChange={(e) => handleServiceChange(i, 'description', e.target.value)}
                    ></textarea>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Countries */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-brand-blue flex items-center gap-2">
              <MapPin className="text-brand-gold" /> Countries Served
            </h3>
            <button onClick={addCountry} className="text-brand-gold font-bold text-sm flex items-center gap-1">
              <Plus size={16} /> Add Country
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {content.countries.map((country, i) => (
              <div key={i} className="flex gap-2">
                <input 
                  className="flex-grow px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-gold transition-all"
                  value={country}
                  onChange={(e) => handleCountryChange(i, e.target.value)}
                />
                <button onClick={() => removeCountry(i)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
