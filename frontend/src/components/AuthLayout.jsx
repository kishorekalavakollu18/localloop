import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, ShieldCheck, Zap, Users, CheckCircle2 } from 'lucide-react';

const AuthLayout = ({ children, title, subtitle }) => {
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      // Check for reduced motion preference
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX - innerWidth / 2) / 35;
      const y = (e.clientY - innerHeight / 2) / 35;
      setParallax({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-[calc(100vh-64px)] w-full flex flex-col md:flex-row bg-[#FBF7F0] overflow-hidden">
      {/* LEFT PANEL: 3D Neighborhood Scene (55% desktop width) */}
      <div 
        className="relative md:w-[55%] bg-[#2B2621] map-bg-pattern flex flex-col justify-between p-6 sm:p-10 lg:p-14 overflow-hidden border-b md:border-b-0 md:border-r border-terracotta/20 select-none min-h-[160px] md:min-h-full"
      >
        {/* Background Ambient Glows & Grid Overlays */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-terracotta/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-mustard/15 rounded-full blur-3xl pointer-events-none" />

        {/* Radar Ping Dots in Background */}
        <div className="absolute top-1/3 left-1/5 pointer-events-none">
          <div className="relative w-4 h-4 bg-terracotta rounded-full flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-terracotta animate-radar-ping" />
          </div>
        </div>

        <div className="absolute top-2/3 right-1/4 pointer-events-none">
          <div className="relative w-4 h-4 bg-mustard rounded-full flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-mustard animate-radar-ping" />
          </div>
        </div>

        <div className="absolute bottom-1/3 left-1/3 pointer-events-none">
          <div className="relative w-4 h-4 bg-moss rounded-full flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-moss animate-radar-ping" />
          </div>
        </div>

        {/* Central Rotating 3D Map Pin Silhouette */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 md:opacity-15">
          <div className="w-80 h-80 text-terracotta animate-spin-3d flex items-center justify-center">
            <MapPin className="w-64 h-64" strokeWidth={1} />
          </div>
        </div>

        {/* Top Brand Header (Desktop) */}
        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-terracotta flex items-center justify-center text-white shadow-lg shadow-terracotta/30 group-hover:scale-105 transition-transform">
              <MapPin className="w-5 h-5" />
            </div>
            <span className="font-heading text-xl font-bold tracking-tight text-[#FBF7F0]">
              Local<span className="text-terracotta">Loop</span>
            </span>
          </Link>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-xs font-semibold text-[#FBF7F0]/90">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Neighborhood Map
          </div>
        </div>

        {/* Desktop Only: Interactive Floating 3D Service Cards Scene */}
        <div className="hidden md:block relative z-10 my-auto py-8">
          <div className="relative w-full max-w-lg mx-auto h-72">
            
            {/* Card 1: Active Neighborhood Map Pin */}
            <div 
              className="absolute top-0 left-0 w-64 hero-glass-card rounded-2xl p-4 text-white animate-float-1"
              style={{
                transform: `perspective(900px) rotateY(-8deg) rotateX(4deg) translate3d(${parallax.x * 0.4}px, ${parallax.y * 0.4}px, 0px)`
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-terracotta/30 border border-terracotta/40 flex items-center justify-center text-terracotta shrink-0">
                  <MapPin className="w-5 h-5 text-mustard" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Indiranagar Sector 4</h4>
                  <p className="text-[11px] text-white/70 flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> 3 Pros Active Now
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2: Verified Provider Card */}
            <div 
              className="absolute top-8 right-0 w-72 hero-glass-card rounded-2xl p-4 text-white animate-float-2"
              style={{
                transform: `perspective(900px) rotateY(8deg) rotateX(-4deg) translate3d(${parallax.x * -0.5}px, ${parallax.y * -0.5}px, 0px)`
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 font-bold text-sm">
                    RP
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-white">Ramesh Plumbing</h4>
                      <ShieldCheck className="w-3.5 h-3.5 text-moss" />
                    </div>
                    <p className="text-[11px] text-white/70">📍 250m away • Plumber</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-amber-400/20 px-2 py-0.5 rounded-md text-amber-300 text-[11px] font-bold">
                  <Star className="w-3 h-3 fill-amber-300" />
                  <span>4.9</span>
                </div>
              </div>
            </div>

            {/* Card 3: Community Trust Rating */}
            <div 
              className="absolute bottom-4 left-6 w-68 hero-glass-card rounded-2xl p-3.5 text-white animate-float-3"
              style={{
                transform: `perspective(900px) rotateY(-6deg) rotateX(-5deg) translate3d(${parallax.x * 0.3}px, ${parallax.y * 0.3}px, 0px)`
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-moss/30 border border-moss/40 flex items-center justify-center text-moss shrink-0">
                  <Users className="w-4 h-4 text-emerald-300" />
                </div>
                <div>
                  <div className="flex items-center gap-1 text-xs font-bold text-white">
                    <Star className="w-3.5 h-3.5 fill-mustard text-mustard" />
                    <span>4.9 / 5.0 Rating</span>
                  </div>
                  <p className="text-[11px] text-white/70">1,200+ Verified Bookings</p>
                </div>
              </div>
            </div>

            {/* Card 4: Instant Dispatch Badge */}
            <div 
              className="absolute bottom-0 right-4 w-60 hero-glass-card rounded-2xl p-3.5 text-white animate-float-1"
              style={{
                transform: `perspective(900px) rotateY(6deg) rotateX(4deg) translate3d(${parallax.x * -0.4}px, ${parallax.y * -0.4}px, 0px)`
              }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-terracotta/30 border border-terracotta/50 flex items-center justify-center text-terracotta shrink-0">
                  <Zap className="w-4 h-4 text-mustard" />
                </div>
                <div className="text-[11px]">
                  <span className="font-bold text-white block">Instant Dispatch</span>
                  <span className="text-emerald-300">Avg. response &lt; 15m</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Headline & Reassuring Copy */}
        <div className="relative z-10 space-y-2 mt-4 md:mt-0">
          <h1 className="font-serif-accent text-xl sm:text-2xl lg:text-3xl font-bold text-[#FBF7F0] leading-snug tracking-tight">
            Join your neighborhood's trusted service network
          </h1>
          <p className="hidden sm:block text-xs lg:text-sm text-[#FBF7F0]/80 max-w-md leading-relaxed">
            Connect directly with verified local plumbers, electricians, tutors, and technicians right in your area with zero hidden fees.
          </p>
          <div className="pt-2 flex items-center gap-4 text-[11px] text-white/60 font-semibold">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-moss" /> 100% Verified Pros</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-moss" /> No Platform Surcharge</span>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Glass Form Card (45% desktop width) */}
      <div className="flex-1 md:w-[45%] flex items-center justify-center p-4 sm:p-8 lg:p-12 relative">
        {/* Soft Background Accent Circles */}
        <div className="absolute top-12 right-12 w-64 h-64 bg-terracotta/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-12 left-12 w-64 h-64 bg-mustard/10 rounded-full blur-3xl pointer-events-none" />

        {/* Glass Form Container */}
        <div className="w-full max-w-[440px] auth-glass-card rounded-3xl p-6 sm:p-9 space-y-6 animate-form-entrance relative z-10 transition-all duration-300">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
