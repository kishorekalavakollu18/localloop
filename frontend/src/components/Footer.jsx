import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ShieldCheck, Heart, Sparkles } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <MapPin className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                LocalLoop
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Hyperlocal service discovery connecting verified neighborhood plumbers, electricians, tutors, cleaners, and home chefs with instant bookings.
            </p>
          </div>

          {/* Col 2: Services */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Top Services
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/discover?category=plumber" className="hover:text-indigo-400 transition-colors">
                  Plumbing & Pipe Repair
                </Link>
              </li>
              <li>
                <Link to="/discover?category=electrician" className="hover:text-indigo-400 transition-colors">
                  Electricians & Wiring
                </Link>
              </li>
              <li>
                <Link to="/discover?category=tutor" className="hover:text-indigo-400 transition-colors">
                  Private Tutors & Classes
                </Link>
              </li>
              <li>
                <Link to="/discover?category=tiffin" className="hover:text-indigo-400 transition-colors">
                  Healthy Tiffin & Meal Box
                </Link>
              </li>
              <li>
                <Link to="/discover?category=cleaner" className="hover:text-indigo-400 transition-colors">
                  Deep Home Cleaning
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: For Providers */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              For Service Providers
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/register" className="hover:text-indigo-400 transition-colors">
                  List Your Business
                </Link>
              </li>
              <li>
                <Link to="/provider/dashboard" className="hover:text-indigo-400 transition-colors">
                  Provider Workspace
                </Link>
              </li>
              <li>
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded-md border border-emerald-800/50">
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% Free Listing
                </span>
              </li>
            </ul>
          </div>

          {/* Col 4: Platform */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Platform Features
            </h4>
            <p className="text-sm text-slate-400 mb-3">
              Built with OpenStreetMap, Leaflet geospatial indexing, and real-time MongoDB 2dsphere distance calculations.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Zero third-party mapping billing fees</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} LocalLoop Marketplace. All rights reserved.</p>
          <p className="flex items-center gap-1 mt-2 sm:mt-0">
            Engineered with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for local communities.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
