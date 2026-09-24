import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { providerService } from '../services/api';
import { getUserCoordinates, CATEGORIES } from '../utils/geo';
import {
  User,
  Briefcase,
  Mail,
  Lock,
  Phone,
  Building,
  MapPin,
  DollarSign,
  AlertCircle,
  Loader2,
  CheckCircle,
  Navigation,
} from 'lucide-react';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, updateProviderState } = useAuth();

  // Role Selection
  const [role, setRole] = useState('customer'); // 'customer' or 'provider'

  // Common user fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Provider specific fields
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('plumber');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [pricingAmount, setPricingAmount] = useState('350');
  const [pricingType, setPricingType] = useState('per hour');
  const [coordinates, setCoordinates] = useState([77.5946, 12.9716]); // [lng, lat]
  const [detectingLocation, setDetectingLocation] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto detect coordinates
  const handleDetectLocation = async () => {
    setDetectingLocation(true);
    try {
      const coords = await getUserCoordinates();
      setCoordinates([coords.lng, coords.lat]);
    } catch (err) {
      alert('Could not retrieve live GPS location. Using city default coordinates.');
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('Please fill out all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (role === 'provider' && (!businessName || !address || !pricingAmount)) {
      setError('Please complete the business name, address, and pricing fields.');
      return;
    }

    setLoading(true);

    try {
      // 1. Register User Account
      const authRes = await register({
        name,
        email,
        password,
        role,
        phone,
      });

      // 2. If provider, create provider profile
      if (role === 'provider') {
        const provRes = await providerService.create({
          businessName,
          category,
          description,
          address,
          coordinates,
          pricing: {
            type: pricingType,
            amount: Number(pricingAmount),
          },
        });

        if (provRes.success && provRes.provider) {
          updateProviderState(provRes.provider);
        }
        navigate('/provider/dashboard');
      } else {
        navigate('/customer/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 flex items-center justify-center">
      <div className="max-w-xl w-full bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Create LocalLoop Account
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Connect with certified neighborhood professionals or grow your client base
          </p>
        </div>

        {/* Role Toggle Switch */}
        <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setRole('customer')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              role === 'customer'
                ? 'bg-white text-indigo-600 shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>I Need Services</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('provider')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              role === 'provider'
                ? 'bg-white text-indigo-600 shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>I'm a Provider</span>
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Details Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Account Credentials
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aditi Rao"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 00000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="aditi@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password * (min 6 chars)
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Provider Specific Profile Setup */}
          {role === 'provider' && (
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Service Listing Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Business / Provider Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Rao Plumbing & Fittings"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Primary Service Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm text-slate-800 bg-white cursor-pointer"
                  >
                    {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Service Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Share details about your experience, certifications, and service offerings..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Physical Address / Shop / Area *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 12th Main Road, Indiranagar, Bangalore"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm text-slate-800"
                />
              </div>

              {/* Pricing Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rate (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={pricingAmount}
                    onChange={(e) => setPricingAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm text-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pricing Unit
                  </label>
                  <select
                    value={pricingType}
                    onChange={(e) => setPricingType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm text-slate-800 bg-white"
                  >
                    <option value="per hour">per hour</option>
                    <option value="per service">per service</option>
                    <option value="per day">per day</option>
                    <option value="fixed">fixed rate</option>
                  </select>
                </div>
              </div>

              {/* Geo Location Pin */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="text-xs">
                  <span className="font-bold text-slate-800 block">Map Location Coordinates:</span>
                  <span className="text-slate-500 font-mono text-[11px]">
                    [{coordinates[0].toFixed(4)}, {coordinates[1].toFixed(4)}]
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={detectingLocation}
                  className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>{detectingLocation ? 'Locating...' : 'Use My GPS'}</span>
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 pt-3"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{loading ? 'Creating Profile...' : 'Complete Registration'}</span>
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-700">
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
