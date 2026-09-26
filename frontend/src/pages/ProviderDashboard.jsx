import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { bookingService, providerService } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import ChatModal from '../components/ChatModal';
import {
  Briefcase,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  DollarSign,
  Star,
  User,
  Phone,
  Mail,
  MapPin,
  Save,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  CheckCheck,
  MessageSquare,
} from 'lucide-react';

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const ProviderDashboard = () => {
  const { user, providerProfile, updateProviderState } = useAuth();

  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings', 'listing', 'availability'
  const [provider, setProvider] = useState(providerProfile || null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Chat Modal state
  const [chatBooking, setChatBooking] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Edit form state
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('plumber');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [pricingAmount, setPricingAmount] = useState(350);
  const [pricingType, setPricingType] = useState('per hour');
  const [availability, setAvailability] = useState([]);

  // Load provider data and bookings
  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      if (!provider?._id && user?._id) {
        // Fetch provider profile if not cached
        const res = await providerService.getNearby({});
        const myProfile = res.providers.find((p) => p.userId?._id === user._id || p.userId === user._id);
        if (myProfile) {
          setProvider(myProfile);
          updateProviderState(myProfile);
        }
      }

      if (provider?._id) {
        const provRes = await providerService.getById(provider._id);
        if (provRes.success && provRes.provider) {
          setProvider(provRes.provider);
          setBusinessName(provRes.provider.businessName || '');
          setCategory(provRes.provider.category || 'plumber');
          setDescription(provRes.provider.description || '');
          setPhone(provRes.provider.phone || provRes.provider.userId?.phone || user?.phone || '');
          setAddress(provRes.provider.address || '');
          setPricingAmount(provRes.provider.pricing?.amount || 350);
          setPricingType(provRes.provider.pricing?.type || 'per hour');
          setAvailability(provRes.provider.availability || []);
        }

        const bData = await bookingService.getProviderBookings(provider._id);
        if (bData.success) {
          setBookings(bData.bookings || []);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [provider?._id, user?._id]);

  // Handle Booking Status Transition
  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await bookingService.updateStatus(bookingId, newStatus);
      setSuccessMsg(`Booking status changed to ${newStatus}`);
      setTimeout(() => setSuccessMsg(''), 3000);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to update booking status.');
    }
  };

  // Save Listing Updates
  const handleSaveListing = async (e) => {
    e.preventDefault();
    if (!provider?._id) return;
    setUpdating(true);
    setError('');
    try {
      const res = await providerService.update(provider._id, {
        businessName,
        category,
        description,
        phone,
        address,
        pricing: {
          type: pricingType,
          amount: Number(pricingAmount),
        },
        availability,
      });

      if (res.success) {
        setProvider(res.provider);
        updateProviderState(res.provider);
        setSuccessMsg('Service listing updated successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to update listing.');
    } finally {
      setUpdating(false);
    }
  };

  // Availability slot helper
  const addSlotToDay = (day, newSlot = '09:00 - 12:00') => {
    const updated = [...availability];
    const dayItem = updated.find((d) => d.day === day);
    if (dayItem) {
      if (!dayItem.slots.includes(newSlot)) {
        dayItem.slots.push(newSlot);
      }
    } else {
      updated.push({ day, slots: [newSlot] });
    }
    setAvailability(updated);
  };

  const removeSlotFromDay = (day, slotIndex) => {
    const updated = availability.map((d) => {
      if (d.day === day) {
        return {
          ...d,
          slots: d.slots.filter((_, idx) => idx !== slotIndex),
        };
      }
      return d;
    });
    setAvailability(updated);
  };

  // Metrics
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
  const completedCount = bookings.filter((b) => b.status === 'completed').length;
  const estimatedRevenue = completedCount * (provider?.pricing?.amount || 0);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header and Quick Stats */}
        <div className="bg-gradient-to-r from-[#2B2621] via-[#38302A] to-[#2B2621] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-[#4A4036]">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-[#C6511F]/20 text-[#E8A33D] border border-[#C6511F]/40 rounded-full text-xs font-bold uppercase tracking-wider">
                Provider HQ
              </span>
              <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {provider?.rating?.avg ? provider.rating.avg.toFixed(1) : 'New'} ({provider?.rating?.count || 0} reviews)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {provider?.businessName || user?.name}
            </h1>
            <p className="text-xs text-slate-300 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#E8A33D]" />
              <span>{provider?.address || 'Setup your service location'}</span>
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
            <div className="bg-white/10 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-white/10 text-center">
              <span className="text-[11px] text-slate-300 block font-medium">Pending</span>
              <span className="text-lg font-bold text-amber-400">{pendingCount}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-white/10 text-center">
              <span className="text-[11px] text-slate-300 block font-medium">Confirmed</span>
              <span className="text-lg font-bold text-[#74A274]">{confirmedCount}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-white/10 text-center">
              <span className="text-[11px] text-slate-300 block font-medium">Completed</span>
              <span className="text-lg font-bold text-emerald-400">{completedCount}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-white/10 text-center">
              <span className="text-[11px] text-slate-300 block font-medium">Est. Earnings</span>
              <span className="text-lg font-bold text-[#E8A33D]">₹{estimatedRevenue}</span>
            </div>
          </div>
        </div>

        {/* Notifications & Alerts */}
        {successMsg && (
          <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 font-bold">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Dashboard Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'bookings'
                ? 'bg-[#C6511F] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Incoming Bookings ({bookings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('listing')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'listing'
                ? 'bg-[#C6511F] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Edit Listing & Pricing</span>
          </button>

          <button
            onClick={() => setActiveTab('availability')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'availability'
                ? 'bg-[#C6511F] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Availability Slots</span>
          </button>
        </div>

        {/* Tab 1: Incoming Bookings Management */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-28 bg-white rounded-3xl animate-pulse border" />
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3 shadow-xs">
                <div className="w-14 h-14 bg-[#F7EBE5] text-[#C6511F] rounded-2xl flex items-center justify-center mx-auto">
                  <Calendar className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-800">No Booking Requests Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  When nearby customers discover your profile on the map and book an appointment, requests will show up here in real-time.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => {
                  const customer = booking.customerId;
                  return (
                    <div
                      key={booking._id}
                      className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:border-[#E8DFC9] transition-all space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#C6511F] to-[#E8A33D] text-white flex items-center justify-center font-bold text-sm">
                            {customer?.name?.charAt(0) || 'C'}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-slate-900">
                              {customer?.name || 'Customer'}
                            </h4>
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                              {customer?.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  {customer.phone}
                                </span>
                              )}
                              {customer?.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-slate-400" />
                                  {customer.email}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <StatusBadge status={booking.status} />
                      </div>

                      {/* Details row */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-2xl text-xs">
                        <div>
                          <span className="text-slate-400 block font-medium">Service Date</span>
                          <span className="font-bold text-slate-800">
                            {new Date(booking.serviceDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Time Slot</span>
                          <span className="font-bold text-slate-800">{booking.slot}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Requested On</span>
                          <span className="text-slate-600">
                            {new Date(booking.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {booking.notes && (
                        <p className="text-xs text-slate-600 bg-amber-50/60 border border-amber-100 p-2.5 rounded-xl">
                          <span className="font-bold text-amber-900">Customer Note:</span> {booking.notes}
                        </p>
                      )}

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                        <button
                          onClick={() => {
                            setChatBooking(booking);
                            setIsChatOpen(true);
                          }}
                          className="px-3.5 py-2 bg-[#F7EBE5] text-[#C6511F] hover:bg-[#F0D5C9] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-[#F0D5C9]"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Chat with Customer</span>
                        </button>

                        {booking.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(booking._id, 'confirmed')}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Accept Booking
                            </button>
                            <button
                              onClick={() => handleStatusChange(booking._id, 'cancelled')}
                              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold border border-rose-200 transition-colors"
                            >
                              Reject Request
                            </button>
                          </>
                        )}

                        {booking.status === 'confirmed' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(booking._id, 'completed')}
                              className="px-4 py-2 bg-[#5C7A5C] hover:bg-[#4A644A] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                            >
                              <CheckCheck className="w-3.5 h-3.5" />
                              Mark Completed
                            </button>
                            <button
                              onClick={() => handleStatusChange(booking._id, 'cancelled')}
                              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Listing & Pricing Editor */}
        {activeTab === 'listing' && (
          <form onSubmit={handleSaveListing} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            <h3 className="text-base font-extrabold text-slate-900">
              Manage Service Profile & Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                  Business / Display Name
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#C6511F] text-xs sm:text-sm text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#C6511F] text-xs sm:text-sm text-slate-800 bg-white"
                >
                  <option value="plumber">Plumber</option>
                  <option value="electrician">Electrician</option>
                  <option value="tutor">Tutor</option>
                  <option value="tiffin">Tiffin</option>
                  <option value="cleaner">Cleaner</option>
                  <option value="other">Other / Appliances</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                Service Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#C6511F] text-xs sm:text-sm text-slate-800"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                  Physical Address
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#C6511F] text-xs sm:text-sm text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                  Contact Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 00000"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#C6511F] text-xs sm:text-sm text-slate-800 font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                  Base Price (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={pricingAmount}
                  onChange={(e) => setPricingAmount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#C6511F] text-xs sm:text-sm font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                  Price Model
                </label>
                <select
                  value={pricingType}
                  onChange={(e) => setPricingType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#C6511F] text-xs sm:text-sm text-slate-800 bg-white"
                >
                  <option value="per hour">per hour</option>
                  <option value="per service">per service</option>
                  <option value="per day">per day</option>
                  <option value="fixed">fixed rate</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={updating}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#C6511F] hover:bg-[#B04316] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-[#C6511F]/20 transition-all disabled:opacity-50"
              >
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Availability Schedule Editor */}
        {activeTab === 'availability' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Weekly Working Schedule & Time Slots
                </h3>
                <p className="text-xs text-slate-500">
                  Customers can only book slots you have enabled below.
                </p>
              </div>
              <button
                onClick={handleSaveListing}
                disabled={updating}
                className="px-5 py-2 bg-[#C6511F] hover:bg-[#B04316] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Schedule</span>
              </button>
            </div>

            <div className="space-y-4 divide-y divide-slate-100">
              {DAYS_OF_WEEK.map((day) => {
                const dayConfig = availability.find((d) => d.day === day);
                const slots = dayConfig?.slots || [];

                return (
                  <div key={day} className="pt-4 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="w-32">
                      <span className="font-bold text-sm text-slate-800">{day}</span>
                    </div>

                    {/* Slots list */}
                    <div className="flex-1 flex flex-wrap items-center gap-2">
                      {slots.length === 0 ? (
                        <span className="text-xs text-slate-400 italic">Day Off / No Slots</span>
                      ) : (
                        slots.map((slot, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F7EBE5] border border-[#F0D5C9] text-[#C6511F] rounded-lg text-xs font-semibold"
                          >
                            <span>{slot}</span>
                            <button
                              type="button"
                              onClick={() => removeSlotFromDay(day, idx)}
                              className="text-[#C6511F] hover:text-rose-600 transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))
                      )}
                    </div>

                    {/* Add Slot Quick Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => addSlotToDay(day, '09:00 - 12:00')}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold"
                      >
                        + Morning (9-12)
                      </button>
                      <button
                        type="button"
                        onClick={() => addSlotToDay(day, '14:00 - 17:00')}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold"
                      >
                        + Afternoon (2-5)
                      </button>
                      <button
                        type="button"
                        onClick={() => addSlotToDay(day, '18:00 - 21:00')}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold"
                      >
                        + Evening (6-9)
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Provider Chat Modal */}
      <ChatModal
        booking={chatBooking}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </div>
  );
};

export default ProviderDashboard;
