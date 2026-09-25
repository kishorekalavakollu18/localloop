import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  MapPin,
  Compass,
  Calendar,
  Briefcase,
  User,
  LogOut,
  Menu,
  X,
  PlusCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

const Navbar = () => {
  const { user, logout, isCustomer, isProvider } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-[#FFFDF9]/90 backdrop-blur-md border-b border-[#E8DFC9] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-[#C6511F] text-white flex items-center justify-center shadow-md shadow-[#C6511F]/20 group-hover:scale-105 transition-transform">
              <MapPin className="w-5 h-5 fill-white text-[#C6511F]" />
            </div>
            <div>
              <span className="text-xl font-heading font-extrabold text-[#2B2621] tracking-tight group-hover:text-[#C6511F] transition-colors">
                LocalLoop
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#F7EBE5] text-[#C6511F] rounded-md border border-[#F0D5C9]">
                Neighborhood Map
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/discover"
              className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${
                isActive('/discover')
                  ? 'text-[#C6511F] font-bold'
                  : 'text-[#5C5346] hover:text-[#C6511F]'
              }`}
            >
              <Compass className="w-4 h-4 text-[#C6511F]" />
              Discover Services
            </Link>

            {user && isCustomer && (
              <Link
                to="/customer/dashboard"
                className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${
                  isActive('/customer/dashboard')
                    ? 'text-[#C6511F] font-bold'
                    : 'text-[#5C5346] hover:text-[#C6511F]'
                }`}
              >
                <Calendar className="w-4 h-4" />
                My Bookings
              </Link>
            )}

            {user && isProvider && (
              <Link
                to="/provider/dashboard"
                className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${
                  isActive('/provider/dashboard')
                    ? 'text-[#C6511F] font-bold'
                    : 'text-[#5C5346] hover:text-[#C6511F]'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                Provider Workspace
              </Link>
            )}
          </div>

          {/* User Auth Buttons / Profile Menu */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full hover:bg-[#F2EBDC] transition-colors border border-[#E8DFC9] bg-white"
                >
                  <div className="w-8 h-8 rounded-full bg-[#C6511F] text-white flex items-center justify-center font-heading font-bold text-sm shadow-xs">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="text-left text-xs">
                    <p className="font-bold text-[#2B2621] leading-tight">
                      {user.name.split(' ')[0]}
                    </p>
                    <span className="inline-block capitalize text-[10px] text-[#5C7A5C] font-extrabold">
                      ● {user.role}
                    </span>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#E8DFC9] py-2 z-50 animate-in fade-in"
                    onMouseLeave={() => setIsUserMenuOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-[#F2EBDC]">
                      <p className="text-xs text-[#8C8275]">Signed in as</p>
                      <p className="text-sm font-bold text-[#2B2621] truncate">
                        {user.email}
                      </p>
                    </div>

                    {isCustomer && (
                      <Link
                        to="/customer/dashboard"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#2B2621] hover:bg-[#F7EBE5] hover:text-[#C6511F] font-medium"
                      >
                        <Calendar className="w-4 h-4 text-[#8C8275]" />
                        My Bookings & Reviews
                      </Link>
                    )}

                    {isProvider && (
                      <Link
                        to="/provider/dashboard"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#2B2621] hover:bg-[#F7EBE5] hover:text-[#C6511F] font-medium"
                      >
                        <Briefcase className="w-4 h-4 text-[#8C8275]" />
                        Manage Service Listing
                      </Link>
                    )}

                    <div className="border-t border-[#F2EBDC] my-1"></div>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-700 hover:bg-rose-50 transition-colors font-medium"
                    >
                      <LogOut className="w-4 h-4 text-rose-600" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-bold text-[#2B2621] hover:text-[#C6511F] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-bold text-white bg-[#C6511F] hover:bg-[#A84116] rounded-xl shadow-md shadow-[#C6511F]/20 transition-all hover:scale-[1.02]"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-[#2B2621] hover:text-[#C6511F] rounded-lg focus:outline-hidden"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-[#E8DFC9] bg-[#FFFDF9] px-4 pt-3 pb-5 space-y-3">
          <Link
            to="/discover"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-base font-bold text-[#2B2621] hover:bg-[#F2EBDC] rounded-xl"
          >
            <Compass className="w-5 h-5 text-[#C6511F]" />
            Discover Services
          </Link>

          {user && isCustomer && (
            <Link
              to="/customer/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-base font-bold text-[#2B2621] hover:bg-[#F2EBDC] rounded-xl"
            >
              <Calendar className="w-5 h-5 text-[#C6511F]" />
              My Bookings
            </Link>
          )}

          {user && isProvider && (
            <Link
              to="/provider/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-base font-bold text-[#2B2621] hover:bg-[#F2EBDC] rounded-xl"
            >
              <Briefcase className="w-5 h-5 text-[#C6511F]" />
              Provider Dashboard
            </Link>
          )}

          <div className="border-t border-[#E8DFC9] pt-3">
            {user ? (
              <div className="space-y-2">
                <div className="px-3 py-1">
                  <p className="text-sm font-bold text-[#2B2621]">{user.name}</p>
                  <p className="text-xs text-[#8C8275]">{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 text-base font-bold text-rose-700 hover:bg-rose-50 rounded-xl"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-center px-4 py-2.5 text-sm font-bold text-[#2B2621] bg-[#F2EBDC] rounded-xl"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-center px-4 py-2.5 text-sm font-bold text-white bg-[#C6511F] rounded-xl"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
