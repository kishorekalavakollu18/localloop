import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { providerService } from '../services/api';
import { CATEGORIES } from '../utils/geo';
import ProviderCard from '../components/ProviderCard';
import {
  Search,
  MapPin,
  Sparkles,
  ShieldCheck,
  CalendarCheck,
  Star,
  ArrowRight,
  Zap,
  Wrench,
  GraduationCap,
  Utensils,
  Cpu,
  Layers,
} from 'lucide-react';

const ICON_MAP = {
  Wrench: Wrench,
  Zap: Zap,
  GraduationCap: GraduationCap,
  Utensils: Utensils,
  Sparkles: Sparkles,
  Cpu: Cpu,
  Layers: Layers,
};

const LandingPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [featuredProviders, setFeaturedProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const data = await providerService.getNearby({ sort: 'rating' });
        if (data.success) {
          setFeaturedProviders(data.providers.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to load featured providers:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedCategory && selectedCategory !== 'all') {
      params.append('category', selectedCategory);
    }
    if (searchQuery.trim()) {
      params.append('search', searchQuery.trim());
    }
    navigate(`/discover?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-900 via-slate-900 to-slate-900 text-white pt-20 pb-28 px-4 sm:px-6 lg:px-8">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-blue-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold backdrop-blur-xs animate-in fade-in slide-in-from-bottom-2">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Hyperlocal Neighborhood Marketplace</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Book Trusted Local Services <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Right Around Your Corner
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 font-normal">
            Discover verified plumbers, electricians, tutors, cleaners, and home tiffin chefs within 5km. Real-time Leaflet map discovery with zero middleman markups.
          </p>

          {/* Search Box */}
          <form
            onSubmit={handleSearch}
            className="max-w-3xl mx-auto bg-white p-2.5 sm:p-3 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/40 flex flex-col sm:flex-row items-center gap-2 text-slate-800"
          >
            {/* Category Select */}
            <div className="w-full sm:w-1/3 px-3 py-2 border-b sm:border-b-0 sm:border-r border-slate-200">
              <label className="block text-[10px] font-extrabold uppercase text-slate-400 text-left">
                Service Type
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Keyword Search Input */}
            <div className="w-full sm:w-1/2 px-3 py-2 flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search 'pipe leak', 'tutor', 'AC repair'..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm font-medium placeholder:text-slate-400 text-slate-800 focus:outline-hidden"
              />
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl sm:rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all shrink-0 hover:scale-[1.02]"
            >
              <MapPin className="w-4 h-4" />
              <span>Explore Map</span>
            </button>
          </form>

          {/* Highlights */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-semibold text-slate-300">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Verified Background Checks</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-blue-400" />
              <span>Instant Slot Booking</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" />
              <span>Authentic Local Reviews</span>
            </div>
          </div>
        </div>
      </section>

      {/* Category Grid Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => {
            const IconComponent = ICON_MAP[cat.icon] || Sparkles;
            return (
              <Link
                key={cat.id}
                to={`/discover?category=${cat.id}`}
                className="group bg-white rounded-2xl p-4 border border-slate-200/80 shadow-md hover:shadow-xl hover:border-indigo-300 transition-all text-center flex flex-col items-center justify-center gap-3 hover:-translate-y-1"
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${cat.color} group-hover:scale-110 transition-transform shadow-xs`}
                >
                  <IconComponent className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                    {cat.label}
                  </h4>
                  <span className="text-[11px] text-slate-400 font-medium">Explore →</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
            Simple 3-Step Process
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900">
            How LocalLoop Works
          </h2>
          <p className="text-sm text-slate-500">
            Getting help with home repairs, classes, or daily meals has never been this straightforward.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 font-extrabold flex items-center justify-center mb-4">
              1
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">
              Discover On Live Map
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Use live browser geolocation to view all certified professionals in your exact neighborhood with transparent ratings and distance markers.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 font-extrabold flex items-center justify-center mb-4">
              2
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">
              Select Time & Date Slot
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pick the slot that fits your schedule. The provider receives instant notification and confirms availability.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 font-extrabold flex items-center justify-center mb-4">
              3
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">
              Service & Review
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pay the provider directly upon job completion and leave an authentic review to support your local neighborhood ecosystem.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Providers Section */}
      <section className="bg-slate-100 py-16 px-4 sm:px-6 lg:px-8 border-y border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Top Rated
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Featured Neighborhood Experts
              </h2>
            </div>
            <Link
              to="/discover"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-700"
            >
              <span>View All on Interactive Map</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white h-80 rounded-2xl animate-pulse border border-slate-200"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredProviders.map((provider) => (
                <ProviderCard key={provider._id} provider={provider} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Provider CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-700 rounded-3xl p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="space-y-3 text-center md:text-left max-w-xl">
            <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-bold uppercase tracking-wider">
              Grow Your Local Business
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              Are you an Electrician, Tutor, Cleaner or Cook?
            </h2>
            <p className="text-sm text-indigo-100 leading-relaxed">
              List your services on LocalLoop for free, reach thousands of nearby customers, manage your time slots, and build a stellar local reputation.
            </p>
          </div>
          <div className="shrink-0 flex flex-col sm:flex-row gap-3">
            <Link
              to="/register"
              className="px-6 py-3.5 bg-white text-indigo-700 font-extrabold text-sm rounded-xl shadow-lg hover:bg-indigo-50 transition-all text-center"
            >
              List Your Services Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
