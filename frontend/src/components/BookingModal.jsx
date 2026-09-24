import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingService } from '../services/api';
import {
  Calendar,
  Clock,
  FileText,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  CreditCard,
} from 'lucide-react';

const BookingModal = ({ provider, isOpen, onClose }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [serviceDate, setServiceDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });

  const [selectedSlot, setSelectedSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen || !provider) return null;

  // Derive slots from provider availability or provide fallback slots
  const allSlots =
    provider.availability && provider.availability.length > 0
      ? Array.from(
          new Set(
            provider.availability.flatMap((a) => a.slots || [])
          )
        )
      : ['09:00 - 12:00', '14:00 - 17:00', '18:00 - 20:00'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/provider/${provider._id}` } });
      return;
    }

    if (user?.role === 'provider' && provider.userId?._id === user._id) {
      setError('You cannot book your own service.');
      return;
    }

    if (!serviceDate) {
      setError('Please select a service date.');
      return;
    }

    if (!selectedSlot) {
      setError('Please choose an available time slot.');
      return;
    }

    setLoading(true);

    try {
      await bookingService.create({
        providerId: provider._id,
        serviceDate,
        slot: selectedSlot,
        notes,
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        navigate('/customer/dashboard');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to submit booking request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-5 text-white flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Book Service</h3>
            <p className="text-xs text-indigo-100 mt-0.5">
              {provider.businessName} • ₹{provider.pricing?.amount}/{provider.pricing?.type}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {success ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-bold text-slate-900">Booking Confirmed!</h4>
            <p className="text-sm text-slate-500">
              Your service request has been sent to {provider.businessName}. Redirecting to your dashboard...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Date Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Select Service Date
              </label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium text-slate-800"
              />
            </div>

            {/* Slot Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-600" />
                Select Preferred Time Slot
              </label>
              <div className="grid grid-cols-2 gap-2">
                {allSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all text-center ${
                      selectedSlot === slot
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes / Issue Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                Service Notes / Problem Details
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe what needs repair or specify special requirements..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-slate-800"
              />
            </div>

            {/* Price Preview */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium">Estimated Pricing</span>
                <p className="text-base font-extrabold text-slate-900">
                  ₹{provider.pricing?.amount}
                  <span className="text-xs font-normal text-slate-500 ml-1">
                    ({provider.pricing?.type})
                  </span>
                </p>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                Pay after service
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{loading ? 'Booking...' : 'Confirm Request'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default BookingModal;
