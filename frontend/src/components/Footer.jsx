import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ShieldCheck, Heart, Sparkles, Navigation } from 'lucide-react';
import { CITY_PRESETS } from '../utils/geo';

const Footer = () => {
  return (
    <footer className="bg-[#2B2621] text-[#D6C7B2] border-t-4 border-[#C6511F]">
      {/* Mini Illustrated Map Strip: "Cities We Serve" */}
      <div className="bg-[#211E1A] py-6 px-4 border-b border-[#3E3730]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-[#E8A33D]" />
            <span className="text-xs font-heading font-extrabold text-[#FBF7F0] uppercase tracking-wider">
              Neighborhood Service Hubs
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
            {CITY_PRESETS.map((city) => (
              <Link
                key={city.name}
                to={`/discover?search=${encodeURIComponent(city.name.split(' ')[0])}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2B2621] hover:bg-[#C6511F] text-[#FBF7F0] rounded-full border border-[#3E3730] transition-colors font-bold text-[11px]"
              >
                <span className="w-2 h-2 rounded-full bg-[#E8A33D]"></span>
                <span>{city.name.split(' ')[0]}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#C6511F] text-white flex items-center justify-center">
                <MapPin className="w-5 h-5 fill-white text-[#C6511F]" />
              </div>
              <span className="text-xl font-heading font-extrabold text-[#FBF7F0] tracking-tight">
                LocalLoop
              </span>
            </div>
            <p className="text-xs text-[#A89C8B] leading-relaxed">
              A living physical map of neighborhood professionals. Connecting residents with verified plumbers, electricians, tutors, cleaners, and home chefs with instant slot bookings.
            </p>
          </div>

          {/* Col 2: Services */}
          <div>
            <h4 className="text-xs font-heading font-extrabold text-[#FBF7F0] uppercase tracking-wider mb-4 text-[#E8A33D]">
              Top Services
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/discover?category=plumber" className="hover:text-[#C6511F] transition-colors">
                  Plumbing & Pipe Repair
                </Link>
              </li>
              <li>
                <Link to="/discover?category=electrician" className="hover:text-[#C6511F] transition-colors">
                  Electricians & Wiring
                </Link>
              </li>
              <li>
                <Link to="/discover?category=tutor" className="hover:text-[#C6511F] transition-colors">
                  Private Tutors & Classes
                </Link>
              </li>
              <li>
                <Link to="/discover?category=tiffin" className="hover:text-[#C6511F] transition-colors">
                  Healthy Tiffin & Meal Box
                </Link>
              </li>
              <li>
                <Link to="/discover?category=cleaner" className="hover:text-[#C6511F] transition-colors">
                  Deep Home Cleaning
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: For Providers */}
          <div>
            <h4 className="text-xs font-heading font-extrabold text-[#FBF7F0] uppercase tracking-wider mb-4 text-[#E8A33D]">
              For Service Providers
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/register" className="hover:text-[#C6511F] transition-colors">
                  List Your Service Free
                </Link>
              </li>
              <li>
                <Link to="/provider/dashboard" className="hover:text-[#C6511F] transition-colors">
                  Provider Workspace
                </Link>
              </li>
              <li>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-[#5C7A5C] bg-[#5C7A5C]/20 px-2.5 py-1 rounded-full border border-[#5C7A5C]/40 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% Free Listing
                </span>
              </li>
            </ul>
          </div>

          {/* Col 4: Geospatial Identity */}
          <div>
            <h4 className="text-xs font-heading font-extrabold text-[#FBF7F0] uppercase tracking-wider mb-4 text-[#E8A33D]">
              Geospatial Engine
            </h4>
            <p className="text-xs text-[#A89C8B] mb-3 leading-relaxed">
              Powered by OpenStreetMap, Leaflet geospatial indexing, and MongoDB 2dsphere proximity search.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#5C7A5C] font-bold">
              <Sparkles className="w-4 h-4 text-[#E8A33D]" />
              <span>Zero mapping billing fees</span>
            </div>
          </div>
        </div>

        <div className="border-t border-[#3E3730] mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#8C8275]">
          <p>© {new Date().getFullYear()} LocalLoop Marketplace. All rights reserved.</p>
          <p className="flex items-center gap-1 mt-2 sm:mt-0">
            Crafted with <Heart className="w-3.5 h-3.5 text-[#C6511F] fill-[#C6511F]" /> for local communities.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
