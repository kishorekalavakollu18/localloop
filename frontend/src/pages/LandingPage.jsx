import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { providerService } from '../services/api';
import { CATEGORIES, LIVE_ACTIVITY_TICKER } from '../utils/geo';
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
  Compass,
  CheckCircle2,
  Clock,
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

const HERO_FLOATING_CARDS = [
  {
    id: 1,
    title: 'Ramesh HydroTech',
    role: 'Master Plumber',
    rating: '4.9★',
    location: 'Indiranagar',
    icon: Wrench,
    badgeBg: 'bg-[#C6511F]',
    floatClass: 'animate-float-1',
    posClass: 'top-10 left-4 sm:left-12 lg:left-16',
    factor: 0.02,
  },
  {
    id: 2,
    title: 'Neha Tutoring',
    role: 'Math & Physics',
    rating: 'Available Now',
    location: 'HSR Layout',
    icon: GraduationCap,
    badgeBg: 'bg-[#5C7A5C]',
    floatClass: 'animate-float-2',
    posClass: 'top-14 right-4 sm:right-12 lg:right-20',
    factor: -0.025,
  },
  {
    id: 3,
    title: 'Annapurna Tiffin',
    role: '12 Meals Cooking',
    rating: 'Hot Delivery',
    location: 'BTM Layout',
    icon: Utensils,
    badgeBg: 'bg-[#D96B27]',
    floatClass: 'animate-float-3',
    posClass: 'bottom-20 right-6 sm:right-16 lg:right-24',
    factor: 0.018,
  },
  {
    id: 4,
    title: 'Anil Spark Electrical',
    role: 'Licensed Electrician',
    rating: '5.0★',
    location: 'Koramangala',
    icon: Zap,
    badgeBg: 'bg-[#E8A33D]',
    floatClass: 'animate-float-1',
    posClass: 'bottom-16 left-6 sm:left-16 lg:left-24',
    factor: -0.02,
  },
];

const TESTIMONIAL_STICKIES = [
  {
    name: 'Ananya Deshmukh',
    role: 'Homeowner in Indiranagar',
    comment: 'Found a certified plumber in 2 minutes when our bathroom pipe burst on Sunday morning. Unbelievably fast and transparent.',
    rotation: '-rotate-2',
    color: 'bg-[#FFFDF9] border-[#E8C5B7]',
  },
  {
    name: 'Vikram Mehta',
    role: 'Parent in Koramangala',
    comment: 'Neha’s math tutoring changed our 10th grader’s exam confidence completely. Truly a neighborhood hidden gem!',
    rotation: 'rotate-1',
    color: 'bg-[#FFFDF9] border-[#F4DCB5]',
  },
  {
    name: 'Kavita Reddy',
    role: 'Software Engineer in HSR',
    comment: 'Annapurna’s daily home tiffin is low-oil and tastes just like my mother’s cooking. Best daily service ever.',
    rotation: '-rotate-1',
    color: 'bg-[#FFFDF9] border-[#C2D4C2]',
  },
  {
    name: 'Siddharth Nair',
    role: 'Resident in Whitefield',
    comment: 'Deep cleaning done by SparklePro was spotless. Booking via the live Leaflet map with zero markup was super slick.',
    rotation: 'rotate-2',
    color: 'bg-[#FFFDF9] border-[#F2CBB2]',
  },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [featuredProviders, setFeaturedProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Parallax Mouse Coordinates State
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

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

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    setMousePos({
      x: (clientX - centerX),
      y: (clientY - centerY),
    });
  };

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
    <div className="min-h-screen bg-[#FBF7F0] flex flex-col overflow-x-hidden">
      {/* 1. HERO SECTION — Living Map 3D Motion Layer & Radar Orbit Accent */}
      <section
        onMouseMove={handleMouseMove}
        className="relative map-bg-pattern text-white pt-24 pb-36 px-4 sm:px-6 lg:px-8 overflow-hidden select-none"
      >
        {/* Radar Ping Location 1 (Indiranagar) */}
        <div className="absolute top-1/4 left-1/5 pointer-events-none z-0">
          <div className="w-8 h-8 rounded-full border-2 border-[#C6511F] animate-radar-ping absolute -top-2 -left-2"></div>
          <div className="w-4 h-4 bg-[#C6511F] rounded-full border-2 border-white shadow-lg"></div>
        </div>

        {/* Radar Ping Location 2 (Koramangala) */}
        <div className="absolute top-1/3 right-1/4 pointer-events-none z-0">
          <div className="w-8 h-8 rounded-full border-2 border-[#E8A33D] animate-radar-ping absolute -top-2 -left-2"></div>
          <div className="w-4 h-4 bg-[#E8A33D] rounded-full border-2 border-white shadow-lg"></div>
        </div>

        {/* Radar Ping Location 3 (HSR Layout) */}
        <div className="absolute bottom-1/3 left-1/3 pointer-events-none z-0">
          <div className="w-8 h-8 rounded-full border-2 border-[#5C7A5C] animate-radar-ping absolute -top-2 -left-2"></div>
          <div className="w-4 h-4 bg-[#5C7A5C] rounded-full border-2 border-white shadow-lg"></div>
        </div>

        {/* Rotating Discovery Orbit Accent (Geospatial Radius Ring) */}
        <div className="hidden lg:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0">
          <div className="w-96 h-96 sm:w-[520px] sm:h-[520px] rounded-full border border-dashed border-[#E8A33D]/25 relative animate-orbit">
            <div className="w-3.5 h-3.5 bg-[#E8A33D] rounded-full border-2 border-[#2B2621] absolute -top-1.5 left-1/2 -translate-x-1/2 shadow-md"></div>
          </div>
        </div>

        {/* Floating 3D Service Card Panels (3D Perspective & Mouse Parallax) */}
        <div className="hidden md:block pointer-events-none">
          {HERO_FLOATING_CARDS.map((card) => {
            const IconComp = card.icon;
            const translateX = mousePos.x * card.factor;
            const translateY = mousePos.y * card.factor;

            return (
              <div
                key={card.id}
                style={{
                  transform: `translate3d(${translateX}px, ${translateY}px, 0)`,
                  perspective: '1000px',
                }}
                className={`absolute ${card.posClass} z-20 transition-transform duration-200 ease-out`}
              >
                <div className={`hero-glass-card ${card.floatClass} p-3 rounded-2xl flex items-center gap-3 w-52 sm:w-56 shadow-2xl`}>
                  <div className={`w-9 h-9 rounded-xl ${card.badgeBg} text-white flex items-center justify-center shrink-0 shadow-md`}>
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div className="truncate text-left">
                    <h4 className="text-xs font-heading font-extrabold text-[#FBF7F0] truncate">
                      {card.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-[#D6C7B2] font-semibold mt-0.5">
                      <span className="text-[#E8A33D] font-bold">{card.rating}</span>
                      <span>• {card.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Central Hero Text & Headline */}
        <div className="relative max-w-4xl mx-auto text-center space-y-7 z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFFDF9]/10 border border-[#E8A33D]/40 text-[#E8A33D] text-xs font-bold uppercase tracking-wider backdrop-blur-md animate-in fade-in duration-500">
            <MapPin className="w-3.5 h-3.5 fill-[#E8A33D] text-[#2B2621]" />
            <span>Living Neighborhood Map</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-heading font-extrabold tracking-tight text-[#FBF7F0] leading-[1.15] animate-in fade-in slide-in-from-bottom-3 duration-700">
            Neighborhood Professionals <br />
            <span className="font-serif-accent italic text-[#C6511F] font-normal">
              Brought to Life on a Map
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-[#D6C7B2] font-normal leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000">
            Discover verified plumbers, electricians, tutors, cleaners, and home tiffin chefs right around your block. Real-time Leaflet map discovery with zero middleman markups.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs font-bold text-[#E8A33D] animate-in fade-in slide-in-from-bottom-5 duration-1000">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#5C7A5C]" />
              <span className="text-[#FBF7F0]">Verified Credentials</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CalendarCheck className="w-4 h-4 text-[#C6511F]" />
              <span className="text-[#FBF7F0]">Instant Slot Booking</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-[#E8A33D] fill-[#E8A33D]" />
              <span className="text-[#FBF7F0]">Authentic Reviews</span>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Command Bar Search Box (sitting at section boundary) */}
      <div className="max-w-4xl mx-auto px-4 w-full -mt-14 relative z-30 animate-in fade-in slide-in-from-bottom-6 duration-1000">
        <form
          onSubmit={handleSearch}
          className="bg-[#FFFDF9] p-3 rounded-full shadow-2xl border-2 border-[#E8DFC9] flex flex-col sm:flex-row items-center gap-2 text-[#2B2621]"
        >
          {/* Category Select */}
          <div className="w-full sm:w-1/3 px-5 py-2 border-b sm:border-b-0 sm:border-r border-[#E8DFC9]">
            <label className="block text-[10px] font-extrabold uppercase text-[#8C8275] text-left">
              Service Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-transparent text-xs font-extrabold text-[#2B2621] focus:outline-hidden cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="w-full sm:w-1/2 px-4 py-2 flex items-center gap-2">
            <Search className="w-4 h-4 text-[#C6511F] shrink-0" />
            <input
              type="text"
              placeholder="Search 'pipe leak', 'math tutor', 'cleaner'..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs font-semibold placeholder:text-[#A89C8B] text-[#2B2621] focus:outline-hidden"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full sm:w-auto px-7 py-3 bg-[#C6511F] hover:bg-[#A84116] text-white font-heading font-extrabold text-xs rounded-full shadow-md shadow-[#C6511F]/30 flex items-center justify-center gap-2 transition-all shrink-0 hover:scale-105"
          >
            <Compass className="w-4 h-4" />
            <span>Explore Map</span>
          </button>
        </form>
      </div>

      {/* 2. LIVE ACTIVITY TICKER (Auto-scrolling real-time mock feed) */}
      <div className="bg-[#2B2621] text-[#FBF7F0] border-y border-[#3E3730] py-3.5 overflow-hidden my-12">
        <div className="animate-marquee flex items-center gap-8 text-xs font-bold tracking-wide">
          {LIVE_ACTIVITY_TICKER.concat(LIVE_ACTIVITY_TICKER).map((tickerText, index) => (
            <div key={index} className="flex items-center gap-3 shrink-0">
              <span className="text-[#E8A33D] font-mono text-[10px]">● LIVE</span>
              <span>{tickerText}</span>
              <span className="text-[#5C5346] font-normal">|</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. CATEGORY STAMPS SECTION — Tactile Scalloped Neighborhood Stamps */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#C6511F] bg-[#F7EBE5] px-3.5 py-1 rounded-full border border-[#F0D5C9]">
            Explore By Profession
          </span>
          <h2 className="text-3xl font-heading font-extrabold text-[#2B2621]">
            Neighborhood Postmark Stamps
          </h2>
          <p className="text-xs text-[#6B6153]">
            Click any stamp to jump directly to nearby certified providers on the map.
          </p>
        </div>

        {/* Loose Staggered Postmark Stamp Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 sm:gap-8 justify-items-center">
          {CATEGORIES.filter((c) => c.id !== 'all').map((cat, idx) => {
            const IconComponent = ICON_MAP[cat.icon] || Sparkles;
            const rotations = ['rotate-1', '-rotate-2', 'rotate-2', '-rotate-1', 'rotate-3', '-rotate-2'];
            const rotClass = rotations[idx % rotations.length];

            return (
              <Link
                key={cat.id}
                to={`/discover?category=${cat.id}`}
                className={`group postmark-stamp p-6 w-36 h-36 sm:w-40 sm:h-40 ${cat.stampBg} flex flex-col items-center justify-center text-center gap-2.5 ${rotClass} hover:rotate-0 transition-transform duration-300 shadow-sm hover:shadow-xl`}
              >
                <div className="w-12 h-12 rounded-full border-2 border-current flex items-center justify-center group-hover:scale-110 transition-transform">
                  <IconComponent className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-heading font-extrabold leading-tight">
                    {cat.label}
                  </h4>
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">
                    Verified Stamp
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. HOW IT WORKS — Connected Dotted Route Line with Pin Drops */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-xl mx-auto mb-16 space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#5C7A5C] bg-[#EDF2ED] px-3.5 py-1 rounded-full border border-[#C2D4C2]">
            Simple & Transparent
          </span>
          <h2 className="text-3xl font-heading font-extrabold text-[#2B2621]">
            Neighborhood Service Route
          </h2>
          <p className="text-xs text-[#6B6153]">
            Follow the physical route from discovery to appointment completion.
          </p>
        </div>

        {/* Route Line Container */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4">
          {/* Dotted Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-1 border-t-2 border-dashed border-[#C6511F]/40 z-0"></div>

          {/* Stop 1 */}
          <div className="relative z-10 bg-[#FFFDF9] p-7 rounded-3xl border-2 border-[#E8DFC9] text-center space-y-3 shadow-xs">
            <div className="w-14 h-14 rounded-full bg-[#C6511F] text-white flex items-center justify-center mx-auto shadow-md shadow-[#C6511F]/20 font-heading font-extrabold text-lg">
              <MapPin className="w-7 h-7 fill-white text-[#C6511F]" />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#C6511F] block">
              Stop 01
            </span>
            <h3 className="text-lg font-heading font-extrabold text-[#2B2621]">
              Search Nearby Map
            </h3>
            <p className="text-xs text-[#6B6153] leading-relaxed">
              Use live GPS to view certified local providers within 5km on an interactive OpenStreetMap.
            </p>
          </div>

          {/* Stop 2 */}
          <div className="relative z-10 bg-[#FFFDF9] p-7 rounded-3xl border-2 border-[#E8DFC9] text-center space-y-3 shadow-xs">
            <div className="w-14 h-14 rounded-full bg-[#E8A33D] text-[#2B2621] flex items-center justify-center mx-auto shadow-md shadow-[#E8A33D]/20 font-heading font-extrabold text-lg">
              <Clock className="w-7 h-7" />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#E8A33D] block">
              Stop 02
            </span>
            <h3 className="text-lg font-heading font-extrabold text-[#2B2621]">
              Book Time Slot
            </h3>
            <p className="text-xs text-[#6B6153] leading-relaxed">
              Select date and preferred time slot directly on the provider's weekly schedule with zero booking fee.
            </p>
          </div>

          {/* Stop 3 */}
          <div className="relative z-10 bg-[#FFFDF9] p-7 rounded-3xl border-2 border-[#E8DFC9] text-center space-y-3 shadow-xs">
            <div className="w-14 h-14 rounded-full bg-[#5C7A5C] text-white flex items-center justify-center mx-auto shadow-md shadow-[#5C7A5C]/20 font-heading font-extrabold text-lg">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#5C7A5C] block">
              Stop 03
            </span>
            <h3 className="text-lg font-heading font-extrabold text-[#2B2621]">
              Get Job Done & Rate
            </h3>
            <p className="text-xs text-[#6B6153] leading-relaxed">
              Pay the provider directly upon completion and leave a verified review to support neighborhood quality.
            </p>
          </div>
        </div>
      </section>

      {/* 5. FEATURED PROVIDERS GRID */}
      <section className="bg-[#F2EBDC] py-16 px-4 sm:px-6 lg:px-8 border-y border-[#E8DFC9]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#C6511F]">
                Verified Experts
              </span>
              <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#2B2621]">
                Top Rated Local Professionals
              </h2>
            </div>
            <Link
              to="/discover"
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#C6511F] hover:text-[#A84116]"
            >
              <span>View All on Interactive Map</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white h-80 rounded-3xl animate-pulse border border-[#E8DFC9]" />
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

      {/* 6. TRUST WALL — Corkboard Sticky Notes with Pins */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-xl mx-auto mb-14 space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#C6511F] bg-[#F7EBE5] px-3.5 py-1 rounded-full border border-[#F0D5C9]">
            Neighborhood Stories
          </span>
          <h2 className="text-3xl font-heading font-extrabold text-[#2B2621]">
            Pinned Trust Wall
          </h2>
          <p className="text-xs text-[#6B6153]">
            Real feedback pinned by residents across the city.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TESTIMONIAL_STICKIES.map((note, idx) => (
            <div
              key={idx}
              className={`sticky-note ${note.color} p-6 rounded-3xl border-2 ${note.rotation} relative flex flex-col justify-between`}
            >
              {/* Push Pin Icon */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#C6511F] text-white flex items-center justify-center shadow-md">
                <MapPin className="w-3.5 h-3.5 fill-white text-[#C6511F]" />
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-1 text-[#E8A33D]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-[#E8A33D]" />
                  ))}
                </div>
                <p className="text-xs text-[#2B2621] leading-relaxed font-serif-accent italic">
                  "{note.comment}"
                </p>
              </div>

              <div className="pt-4 border-t border-[#E8DFC9] mt-4">
                <h4 className="text-xs font-heading font-extrabold text-[#2B2621]">{note.name}</h4>
                <span className="text-[10px] text-[#8C8275]">{note.role}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. PROVIDER CTA BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-[#2B2621] rounded-3xl p-8 sm:p-12 text-[#FBF7F0] flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
          <div className="space-y-3 text-center md:text-left max-w-xl relative z-10">
            <span className="inline-block px-3 py-1 rounded-full bg-[#C6511F]/20 text-[#E8A33D] text-xs font-extrabold uppercase tracking-wider border border-[#C6511F]/40">
              For Local Professionals
            </span>
            <h2 className="text-2xl sm:text-4xl font-heading font-extrabold text-[#FBF7F0]">
              Are You an Electrician, Tutor, Cleaner, or Home Chef?
            </h2>
            <p className="text-xs sm:text-sm text-[#D6C7B2] leading-relaxed">
              List your business on the neighborhood map for free. Connect directly with nearby residents, manage your appointment slots, and build local trust.
            </p>
          </div>
          <div className="shrink-0 relative z-10">
            <Link
              to="/register"
              className="px-7 py-4 bg-[#C6511F] hover:bg-[#A84116] text-white font-heading font-extrabold text-xs rounded-full shadow-xl shadow-[#C6511F]/40 transition-all text-center inline-block hover:scale-105"
            >
              List Your Services Free
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
