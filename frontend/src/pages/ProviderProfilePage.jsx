import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { providerService, getImageUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import BookingModal from '../components/BookingModal';
import ReviewModal from '../components/ReviewModal';
import {
  Star,
  MapPin,
  CheckCircle,
  Calendar,
  Clock,
  MessageSquare,
  Phone,
  Mail,
  ShieldCheck,
  ChevronLeft,
  Loader2,
  AlertCircle,
  Share2,
} from 'lucide-react';

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80';

const ProviderProfilePage = () => {
  const { id } = useParams();
  const { user, isCustomer } = useAuth();

  const [provider, setProvider] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const fetchProvider = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await providerService.getById(id);
      if (data.success) {
        setProvider(data.provider);
        setReviews(data.reviews || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load provider profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProvider();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#C6511F] animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-600">Loading service profile...</p>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Profile Not Found</h2>
        <p className="text-sm text-slate-500">{error || 'This provider listing may have been moved or removed.'}</p>
        <Link
          to="/discover"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C6511F] hover:bg-[#B04316] text-white rounded-xl font-bold text-sm shadow-md shadow-[#C6511F]/20"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Discover
        </Link>
      </div>
    );
  }

  const phone = provider.userId?.phone || provider.user?.phone || provider.phone || '+91 98765 00000';

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/discover"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#C6511F] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Map & Search</span>
          </Link>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: provider.businessName, url: window.location.href });
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert('Profile link copied to clipboard!');
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>

        {/* Profile Header Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8 flex flex-col md:flex-row gap-6 items-start justify-between">
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              {/* Main Avatar / Image */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-sm">
                <img
                  src={getImageUrl(provider.images?.[0])}
                  alt={provider.businessName}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#F7EBE5] text-[#C6511F] border border-[#F0D5C9]">
                    {provider.category}
                  </span>
                  {provider.isVerified && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified Specialist
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {provider.businessName}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600">
                  <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span>{provider.rating?.avg ? provider.rating.avg.toFixed(1) : 'New'}</span>
                    <span className="text-slate-400 font-normal">
                      ({provider.rating?.count || 0} customer reviews)
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{provider.address}</span>
                  </div>

                  {phone && (
                    <div className="flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <a href={`tel:${phone}`} className="hover:underline">
                        {phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Price & Book CTA Card */}
            <div className="w-full md:w-auto bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row md:flex-col items-center justify-between gap-3 md:min-w-[220px]">
              <div>
                <span className="text-xs text-slate-500 font-medium block">Standard Rate</span>
                <p className="text-2xl font-extrabold text-slate-900">
                  ₹{provider.pricing?.amount}
                  <span className="text-xs font-medium text-slate-500 ml-1">
                    /{provider.pricing?.type || 'hr'}
                  </span>
                </p>
              </div>

              <div className="w-full space-y-2">
                <button
                  onClick={() => setIsBookingOpen(true)}
                  className="w-full px-6 py-3 bg-[#C6511F] hover:bg-[#B04316] text-white font-bold text-sm rounded-xl shadow-md shadow-[#C6511F]/20 transition-all hover:scale-[1.02]"
                >
                  Book Appointment
                </button>

                {phone && (
                  <a
                    href={`tel:${phone}`}
                    className="w-full px-6 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 text-center flex items-center justify-center gap-2 transition-all"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Call Provider ({phone})</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left / Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* About / Description */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <h2 className="text-base font-extrabold text-slate-900">About the Service</h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {provider.description ||
                  'Experienced and verified neighborhood professional dedicated to delivering punctual, high-quality, and reliable service.'}
              </p>
            </div>

            {/* Photos / Gallery */}
            {provider.images && provider.images.length > 0 && (
              <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <h2 className="text-base font-extrabold text-slate-900">Service Photos & Work Samples</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {provider.images.map((img, idx) => (
                    <div
                      key={idx}
                      className="h-32 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group"
                    >
                      <img
                        src={img}
                        alt="Work sample"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Customer Reviews Section */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Customer Reviews ({reviews.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Real feedback from verified completed appointments
                  </p>
                </div>

                {isCustomer && (
                  <button
                    onClick={() => setIsReviewOpen(true)}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Write Review
                  </button>
                )}
              </div>

              {reviews.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No reviews yet for this provider. Be the first to book and share your feedback!
                </div>
              ) : (
                <div className="space-y-4 divide-y divide-slate-100">
                  {reviews.map((rev) => (
                    <div key={rev._id} className="pt-4 first:pt-0 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
                            {rev.customerId?.name?.charAt(0) || 'C'}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-800">
                              {rev.customerId?.name || 'Local Customer'}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-2">
                              {new Date(rev.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-0.5 text-amber-400">
                          {[...Array(rev.rating)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed pl-9">
                        "{rev.comment}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column / Availability Schedule & Contact */}
          <div className="space-y-6">
            {/* Availability Schedule Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-[#C6511F]">
                <Clock className="w-5 h-5" />
                <h3 className="font-bold text-base text-slate-900">Weekly Schedule</h3>
              </div>

              <div className="space-y-2.5 divide-y divide-slate-100 text-xs">
                {provider.availability && provider.availability.length > 0 ? (
                  provider.availability.map((item, idx) => (
                    <div key={idx} className="pt-2 first:pt-0 flex items-start justify-between gap-2">
                      <span className="font-bold text-slate-800 w-24">{item.day}</span>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {item.slots && item.slots.length > 0 ? (
                          item.slots.map((s, sIdx) => (
                            <span
                              key={sIdx}
                              className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium text-[11px]"
                            >
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400">Off</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400">Available Monday through Saturday</p>
                )}
              </div>

              <button
                onClick={() => setIsBookingOpen(true)}
                className="w-full py-2.5 bg-[#F7EBE5] hover:bg-[#F0D5C9] text-[#C6511F] font-bold rounded-xl text-xs transition-colors border border-[#F0D5C9]"
              >
                Select Time Slot →
              </button>
            </div>

            {/* Provider Details / Contact Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-slate-900">Contact & Service Area</h3>
              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{provider.address}</span>
                </div>
                {phone && (
                  <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-950">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-xs">{phone}</span>
                    </div>
                    <a
                      href={`tel:${phone}`}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] transition-colors"
                    >
                      Call Now
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        provider={provider}
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />

      {/* Review Modal */}
      <ReviewModal
        providerId={provider._id}
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        onReviewSubmitted={fetchProvider}
      />
    </div>
  );
};

export default ProviderProfilePage;
