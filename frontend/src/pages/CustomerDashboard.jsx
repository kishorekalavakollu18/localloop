import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingService, API_URL } from '../services/api';
import { io } from 'socket.io-client';
import StatusBadge from '../components/StatusBadge';
import ReviewModal from '../components/ReviewModal';
import ChatModal from '../components/ChatModal';
import {
  Calendar,
  Clock,
  MapPin,
  MessageSquare,
  AlertCircle,
  XCircle,
  Loader2,
  Compass,
  CheckCircle2,
  Phone,
  RefreshCw,
  Star,
  CheckCheck,
  Navigation,
} from 'lucide-react';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all', 'active', 'completed'

  // Review & Chat modal state
  const [reviewBooking, setReviewBooking] = useState(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [chatBooking, setChatBooking] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const fetchBookings = async () => {
    if (!user?._id) return;
    setLoading(true);
    setError('');
    try {
      const data = await bookingService.getCustomerBookings(user._id);
      if (data.success) {
        setBookings(data.bookings || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user?._id]);

  // Real-time socket listener for booking status changes
  useEffect(() => {
    if (!user?._id) return;
    const socketUrl = API_URL.replace(/\/api\/?$/, '');
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
    });

    const handleStatusUpdate = () => {
      fetchBookings();
    };

    socket.on(`customer_notifications_${user._id}`, handleStatusUpdate);

    return () => {
      socket.off(`customer_notifications_${user._id}`, handleStatusUpdate);
      socket.disconnect();
    };
  }, [user?._id]);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking request?')) return;
    try {
      await bookingService.updateStatus(bookingId, 'cancelled');
      fetchBookings();
    } catch (err) {
      alert(err.message || 'Failed to cancel booking.');
    }
  };

  const handleMarkCompleted = async (bookingId) => {
    if (!window.confirm('Are you sure you want to mark this service as completed?')) return;
    try {
      await bookingService.updateStatus(bookingId, 'completed');
      fetchBookings();
    } catch (err) {
      alert(err.message || 'Failed to update booking status.');
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (filterTab === 'active') return b.status === 'pending' || b.status === 'confirmed';
    if (filterTab === 'completed') return b.status === 'completed';
    return true;
  });

  const activeCount = bookings.filter((b) => b.status === 'pending' || b.status === 'confirmed').length;
  const completedCount = bookings.filter((b) => b.status === 'completed').length;

  return (
    <div className="min-h-screen bg-[#FBF7F0] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* User Greeting & Stats Banner */}
        <div className="bg-gradient-to-r from-[#2B2621] via-[#38302A] to-[#2B2621] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-[#4A4036]">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold px-2.5 py-1 bg-white/10 rounded-full inline-block backdrop-blur-xs text-[#E8DFC9] border border-white/10">
              Customer Workspace
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hello, {user?.name || 'Friend'}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-[#D6C7B2]">
              Track your service requests, appointments, and rate completed jobs.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-center">
              <span className="text-xs text-[#D6C7B2] block">Active Orders</span>
              <span className="text-xl font-extrabold text-[#E8A33D]">{activeCount}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-center">
              <span className="text-xs text-[#D6C7B2] block">Completed</span>
              <span className="text-xl font-extrabold text-emerald-400">{completedCount}</span>
            </div>
            <Link
              to="/discover"
              className="px-4 py-3 bg-[#C6511F] text-white font-bold rounded-2xl text-xs hover:bg-[#B04316] transition-all shadow-md shadow-[#C6511F]/20"
            >
              + Find Service
            </Link>
          </div>
        </div>

        {/* Filters and Search Tabs */}
        <div className="flex items-center justify-between border-b border-[#E8DFC9] pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filterTab === 'all'
                  ? 'bg-[#C6511F] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-[#F2EBDC]'
              }`}
            >
              All Requests ({bookings.length})
            </button>
            <button
              onClick={() => setFilterTab('active')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filterTab === 'active'
                  ? 'bg-[#C6511F] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-[#F2EBDC]'
              }`}
            >
              Active / Upcoming ({activeCount})
            </button>
            <button
              onClick={() => setFilterTab('completed')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filterTab === 'completed'
                  ? 'bg-[#C6511F] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-[#F2EBDC]'
              }`}
            >
              Completed ({completedCount})
            </button>
          </div>

          <button
            onClick={fetchBookings}
            title="Refresh bookings"
            className="p-2 bg-white border border-[#E8DFC9] rounded-xl hover:bg-[#F2EBDC] transition-colors text-slate-600"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 bg-white rounded-3xl animate-pulse border border-[#E8DFC9]"
              />
            ))}
          </div>
        ) : error ? (
          <div className="p-6 bg-rose-50 border border-rose-200 rounded-3xl text-center text-xs text-rose-700">
            {error}
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#E8DFC9] space-y-4 shadow-xs">
            <div className="w-16 h-16 bg-[#F7EBE5] text-[#C6511F] rounded-2xl flex items-center justify-center mx-auto">
              <Calendar className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              No bookings in this category
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Need a plumber, tutor, electrician, or home tiffin? Explore neighborhood providers on the live map.
            </p>
            <Link
              to="/discover"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C6511F] text-white rounded-xl text-xs font-bold shadow-md shadow-[#C6511F]/20 hover:bg-[#B04316]"
            >
              <Compass className="w-4 h-4" />
              Discover Nearby Services
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => {
              const provider = booking.providerId || {};
              const isPastOrComplete = booking.status === 'completed';
              const canCancel = booking.status === 'pending' || booking.status === 'confirmed';
              const canComplete = booking.status === 'confirmed';

              return (
                <div
                  key={booking._id}
                  className="bg-white rounded-3xl border border-[#E8DFC9] p-5 sm:p-6 shadow-xs hover:border-[#C6511F]/40 transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#F2EBDC] overflow-hidden border border-[#E8DFC9] shrink-0">
                        <img
                          src={
                            provider?.images?.[0] ||
                            'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80'
                          }
                          alt="Provider"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-slate-900">
                            {provider?.businessName || 'Service Provider'}
                          </h3>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-[#F2EBDC] text-[#2B2621] rounded-md">
                            {provider?.category || 'Service'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{provider?.address || 'Address provided'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <StatusBadge status={booking.status} />
                    </div>
                  </div>

                  {/* Booking Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FBF7F0] p-3.5 rounded-2xl text-xs border border-[#F2EBDC]">
                    <div>
                      <span className="text-slate-400 block font-medium">Service Date</span>
                      <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-[#C6511F]" />
                        {booking.serviceDate ? new Date(booking.serviceDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-medium">Time Slot</span>
                      <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-[#C6511F]" />
                        {booking.slot || 'Standard'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-medium">Rate / Pricing</span>
                      <span className="font-bold text-slate-800 block mt-0.5">
                        ₹{provider?.pricing?.amount || 0} ({provider?.pricing?.type || 'hr'})
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-medium">Requested On</span>
                      <span className="text-slate-600 block mt-0.5">
                        {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                  </div>

                  {/* Delivery Destination Address */}
                  {booking.customerAddress && (
                    <div className="text-xs text-slate-700 bg-amber-50/70 border border-amber-200/80 p-2.5 rounded-xl flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#C6511F] shrink-0" />
                      <span>
                        <strong>Delivery Address:</strong> {booking.customerAddress}{' '}
                        {booking.customerPincode && `(PIN: ${booking.customerPincode})`}
                      </span>
                    </div>
                  )}

                  {/* Notes if provided */}
                  {booking.notes && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-700">Problem Notes:</span> {booking.notes}
                    </p>
                  )}

                  {/* Actions Row */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    {provider?._id ? (
                      <Link
                        to={`/provider/${provider._id}`}
                        className="text-xs font-bold text-[#C6511F] hover:text-[#B04316]"
                      >
                        View Provider Profile →
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-400">Profile unavailable</span>
                    )}

                    <div className="flex items-center gap-2">
                      {/* Swiggy-Style Live Tracking Button */}
                      {(booking.status === 'confirmed' || booking.status === 'in_progress' || booking.status === 'pending') && (
                        <Link
                          to={`/track/${booking._id}`}
                          className="px-3.5 py-2 bg-[#C6511F] hover:bg-[#B04316] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Live Track 📍</span>
                        </Link>
                      )}

                      <button
                        onClick={() => {
                          setChatBooking(booking);
                          setIsChatOpen(true);
                        }}
                        className="px-3.5 py-2 bg-[#F7EBE5] text-[#C6511F] hover:bg-[#F0D5C9] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-[#F0D5C9]"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat</span>
                      </button>

                      {canComplete && (
                        <button
                          onClick={() => handleMarkCompleted(booking._id)}
                          className="px-4 py-2 bg-[#5C7A5C] hover:bg-[#4A644A] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Mark Completed</span>
                        </button>
                      )}

                      {isPastOrComplete && (
                        <button
                          onClick={() => {
                            setReviewBooking(booking);
                            setIsReviewOpen(true);
                          }}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                        >
                          <Star className="w-3.5 h-3.5 fill-white" />
                          <span>Review</span>
                        </button>
                      )}

                      {canCancel && (
                        <button
                          onClick={() => handleCancelBooking(booking._id)}
                          className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold border border-rose-200 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Modal */}
      <ReviewModal
        booking={reviewBooking}
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        onReviewSubmitted={fetchBookings}
      />

      {/* Chat Modal */}
      <ChatModal
        booking={chatBooking}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </div>
  );
};

export default CustomerDashboard;
