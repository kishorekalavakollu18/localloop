import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, CheckCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { getImageUrl } from '../services/api';

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80';

const ProviderCard = ({
  provider,
  isSelected = false,
  onHover = () => {},
}) => {
  const imageUrl = getImageUrl(provider.images?.[0]);

  return (
    <div
      onMouseEnter={() => onHover(provider)}
      className={`group bg-[#FFFDF9] rounded-3xl border-2 transition-all duration-300 overflow-hidden flex flex-col justify-between ${
        isSelected
          ? 'border-[#C6511F] ring-4 ring-[#C6511F]/15 shadow-xl scale-[1.01]'
          : 'border-[#E8DFC9] hover:border-[#C6511F]/60 hover:shadow-lg'
      }`}
    >
      <div>
        {/* Image & Header Overlay */}
        <div className="relative h-44 w-full bg-[#F2EBDC] overflow-hidden">
          <img
            src={imageUrl}
            alt={provider.businessName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.target.src = DEFAULT_IMAGE;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2B2621]/75 via-transparent to-transparent"></div>

          {/* Category Stamp Badge */}
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#FFFDF9]/95 text-[#2B2621] border border-[#E8DFC9] shadow-xs">
              {provider.category}
            </span>
          </div>

          {/* Distance Tag */}
          {provider.distanceKm !== undefined && (
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-[#2B2621]/90 backdrop-blur-xs text-[#FBF7F0]">
                <MapPin className="w-3 h-3 text-[#E8A33D] fill-[#E8A33D]" />
                {provider.distanceKm} km
              </span>
            </div>
          )}

          {/* Rating */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white">
            <div className="flex items-center gap-1 bg-[#E8A33D] text-[#2B2621] px-2 py-0.5 rounded-lg text-xs font-heading font-extrabold shadow-xs">
              <Star className="w-3.5 h-3.5 fill-[#2B2621] text-[#2B2621]" />
              <span>{provider.rating?.avg ? provider.rating.avg.toFixed(1) : 'New'}</span>
            </div>
            <span className="text-[11px] text-[#FBF7F0] font-semibold">
              ({provider.rating?.count || 0} reviews)
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-heading font-extrabold text-[#2B2621] text-base leading-snug group-hover:text-[#C6511F] transition-colors line-clamp-1">
              {provider.businessName}
            </h3>
            {provider.isVerified && (
              <span title="Verified Provider">
                <ShieldCheck className="w-4 h-4 text-[#5C7A5C] shrink-0 mt-0.5" />
              </span>
            )}
          </div>

          <p className="text-xs text-[#6B6153] line-clamp-2 leading-relaxed font-normal">
            {provider.description || 'Professional local provider with verified credentials.'}
          </p>

          <div className="flex items-center gap-1 text-xs text-[#8C8275] truncate pt-1 font-medium">
            <MapPin className="w-3.5 h-3.5 text-[#C6511F] shrink-0" />
            <span className="truncate">{provider.address}</span>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-5 py-3.5 bg-[#FBF7F0] border-t border-[#E8DFC9] flex items-center justify-between">
        <div>
          <span className="text-[10px] text-[#8C8275] block font-bold uppercase tracking-wider">Starting at</span>
          <div className="text-base font-heading font-extrabold text-[#2B2621]">
            ₹{provider.pricing?.amount}
            <span className="text-xs font-normal text-[#6B6153] ml-1">
              /{provider.pricing?.type || 'hr'}
            </span>
          </div>
        </div>

        <Link
          to={`/provider/${provider._id}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-heading font-extrabold text-white bg-[#C6511F] hover:bg-[#A84116] shadow-sm shadow-[#C6511F]/20 group-hover:shadow-md transition-all hover:scale-105"
        >
          <span>Book Now</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

export default ProviderCard;
