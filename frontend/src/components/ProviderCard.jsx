import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, CheckCircle, Clock, ArrowRight } from 'lucide-react';

const CATEGORY_COLORS = {
  plumber: 'bg-blue-50 text-blue-700 border-blue-200',
  electrician: 'bg-amber-50 text-amber-700 border-amber-200',
  tutor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  tiffin: 'bg-orange-50 text-orange-700 border-orange-200',
  cleaner: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  other: 'bg-purple-50 text-purple-700 border-purple-200',
};

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80';

const ProviderCard = ({
  provider,
  isSelected = false,
  onHover = () => {},
}) => {
  const categoryStyle =
    CATEGORY_COLORS[provider.category] || 'bg-slate-50 text-slate-700 border-slate-200';

  const imageUrl =
    provider.images && provider.images.length > 0
      ? provider.images[0]
      : DEFAULT_IMAGE;

  return (
    <div
      onMouseEnter={() => onHover(provider)}
      className={`group bg-white rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col justify-between ${
        isSelected
          ? 'border-indigo-600 ring-2 ring-indigo-600/20 shadow-lg scale-[1.01]'
          : 'border-slate-200 hover:border-indigo-200 hover:shadow-md'
      }`}
    >
      <div>
        {/* Card Header & Image */}
        <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
          <img
            src={imageUrl}
            alt={provider.businessName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.target.src = DEFAULT_IMAGE;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>

          {/* Category Badge */}
          <div className="absolute top-3 left-3">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-xs bg-white/95 backdrop-blur-xs text-slate-800`}
            >
              {provider.category}
            </span>
          </div>

          {/* Distance Badge */}
          {provider.distanceKm !== undefined && (
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-black/75 backdrop-blur-xs text-white shadow-xs">
                <MapPin className="w-3 h-3 text-rose-400" />
                {provider.distanceKm} km
              </span>
            </div>
          )}

          {/* Rating in Image Bottom */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white">
            <div className="flex items-center gap-1 bg-amber-500/90 backdrop-blur-xs px-2 py-0.5 rounded-md text-xs font-bold shadow-xs">
              <Star className="w-3.5 h-3.5 fill-white text-white" />
              <span>{provider.rating?.avg ? provider.rating.avg.toFixed(1) : 'New'}</span>
            </div>
            <span className="text-xs text-slate-200">
              ({provider.rating?.count || 0} reviews)
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-indigo-600 transition-colors line-clamp-1">
              {provider.businessName}
            </h3>
            {provider.isVerified && (
              <span title="Verified Provider">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {provider.description || 'Professional local service provider with verified credentials.'}
          </p>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate pt-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{provider.address}</span>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-400 block font-medium">Starting at</span>
          <div className="text-base font-extrabold text-slate-900">
            ₹{provider.pricing?.amount}
            <span className="text-xs font-normal text-slate-500 ml-1">
              /{provider.pricing?.type || 'hr'}
            </span>
          </div>
        </div>

        <Link
          to={`/provider/${provider._id}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 group-hover:shadow-md transition-all"
        >
          <span>Book Now</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

export default ProviderCard;
