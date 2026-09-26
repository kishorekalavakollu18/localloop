import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { providerService } from '../services/api';
import { getUserCoordinates, CATEGORIES, resolvePincode, extractPincode } from '../utils/geo';
import AuthLayout from '../components/AuthLayout';
import {
  User,
  Briefcase,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Phone,
  Building,
  MapPin,
  DollarSign,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Navigation,
  ArrowRight,
} from 'lucide-react';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, updateProviderState } = useAuth();

  // Role Selection ('customer' | 'provider')
  const [role, setRole] = useState('customer');

  // Common user fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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

  // Field validation blur states
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
    businessName: false,
    address: false,
  });

  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    address: '',
  });

  const validateName = (val) => (!val.trim() ? 'Full name is required' : '');
  
  const validateEmail = (val) => {
    if (!val) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val)) return 'Please enter a valid email address';
    return '';
  };

  const validatePassword = (val) => {
    if (!val) return 'Password is required';
    if (val.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const validateConfirmPassword = (val, passVal = password) => {
    if (!val) return 'Please confirm your password';
    if (val !== passVal) return 'Passwords do not match';
    return '';
  };

  const validateBusinessName = (val) => (role === 'provider' && !val.trim() ? 'Business name is required' : '');
  const validateAddress = (val) => (role === 'provider' && !val.trim() ? 'Address is required' : '');

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === 'name') setFieldErrors((prev) => ({ ...prev, name: validateName(name) }));
    if (field === 'email') setFieldErrors((prev) => ({ ...prev, email: validateEmail(email) }));
    if (field === 'password') setFieldErrors((prev) => ({ ...prev, password: validatePassword(password) }));
    if (field === 'confirmPassword') setFieldErrors((prev) => ({ ...prev, confirmPassword: validateConfirmPassword(confirmPassword) }));
    if (field === 'businessName') setFieldErrors((prev) => ({ ...prev, businessName: validateBusinessName(businessName) }));
    if (field === 'address') setFieldErrors((prev) => ({ ...prev, address: validateAddress(address) }));
  };

  // Auto detect GPS coordinates
  const handleDetectLocation = async () => {
    setDetectingLocation(true);
    try {
      const coords = await getUserCoordinates();
      setCoordinates([coords.lng, coords.lat]);
    } catch (err) {
      alert('Could not retrieve live GPS location. Using default coordinates.');
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const nameErr = validateName(name);
    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);
    const confirmErr = validateConfirmPassword(confirmPassword);
    const bizErr = validateBusinessName(businessName);
    const addrErr = validateAddress(address);

    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
      businessName: true,
      address: true,
    });

    setFieldErrors({
      name: nameErr,
      email: emailErr,
      password: passErr,
      confirmPassword: confirmErr,
      businessName: bizErr,
      address: addrErr,
    });

    if (nameErr || emailErr || passErr || confirmErr || bizErr || addrErr) {
      setError('Please resolve all validation errors before submitting.');
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

      // 2. If provider role, create provider profile
      if (role === 'provider') {
        let finalCoordinates = coordinates;
        const foundPincode = extractPincode(address);
        if (foundPincode) {
          const resolved = resolvePincode(foundPincode);
          if (resolved) {
            finalCoordinates = [resolved.lng, resolved.lat];
          }
        }

        const provRes = await providerService.create({
          businessName,
          category,
          description,
          phone,
          address,
          coordinates: finalCoordinates,
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
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      {/* Header */}
      <div className="text-center space-y-1.5">
        <h2 className="text-2xl font-bold font-heading text-charcoal tracking-tight">
          Create Account
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Join LocalLoop to connect with neighborhood services or offer your expertise
        </p>
      </div>

      {/* Role Segmented Pill Control with smooth 200ms transition */}
      <div className="relative p-1 bg-slate-200/70 rounded-full flex items-center select-none shadow-inner">
        {/* Sliding Terracotta Background */}
        <div
          className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-terracotta rounded-full shadow-md transition-all duration-200 ease-in-out"
          style={{
            left: role === 'customer' ? '4px' : 'calc(50%)',
          }}
        />

        <button
          type="button"
          onClick={() => setRole('customer')}
          className={`relative z-10 flex-1 py-2.5 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
            role === 'customer' ? 'text-white' : 'text-slate-600 hover:text-charcoal'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>I Need Services</span>
        </button>

        <button
          type="button"
          onClick={() => setRole('provider')}
          className={`relative z-10 flex-1 py-2.5 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
            role === 'provider' ? 'text-white' : 'text-slate-600 hover:text-charcoal'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>I'm a Provider</span>
        </button>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Full Name */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-charcoal/80 mb-1">
            Full Name *
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (touched.name) setFieldErrors((prev) => ({ ...prev, name: validateName(e.target.value) }));
              }}
              onBlur={() => handleBlur('name')}
              placeholder="e.g. Aditi Rao"
              className={`w-full pl-10 pr-4 py-2.5 auth-input rounded-2xl border ${
                touched.name && fieldErrors.name
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                  : 'border-slate-300/80 bg-white/70'
              } text-xs sm:text-sm text-charcoal placeholder:text-slate-400 font-medium`}
            />
          </div>
          {touched.name && fieldErrors.name && (
            <p className="text-rose-600 text-[11px] font-semibold mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>{fieldErrors.name}</span>
            </p>
          )}
        </div>

        {/* Email Address */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-charcoal/80 mb-1">
            Email Address *
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (touched.email) setFieldErrors((prev) => ({ ...prev, email: validateEmail(e.target.value) }));
              }}
              onBlur={() => handleBlur('email')}
              placeholder="aditi@example.com"
              className={`w-full pl-10 pr-4 py-2.5 auth-input rounded-2xl border ${
                touched.email && fieldErrors.email
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                  : 'border-slate-300/80 bg-white/70'
              } text-xs sm:text-sm text-charcoal placeholder:text-slate-400 font-medium`}
            />
          </div>
          {touched.email && fieldErrors.email && (
            <p className="text-rose-600 text-[11px] font-semibold mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>{fieldErrors.email}</span>
            </p>
          )}
        </div>

        {/* Password & Confirm Password Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-charcoal/80 mb-1">
              Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (touched.password) setFieldErrors((prev) => ({ ...prev, password: validatePassword(e.target.value) }));
                  if (touched.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: validateConfirmPassword(confirmPassword, e.target.value) }));
                }}
                onBlur={() => handleBlur('password')}
                placeholder="••••••••"
                className={`w-full pl-9 pr-8 py-2.5 auth-input rounded-2xl border ${
                  touched.password && fieldErrors.password
                    ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-slate-300/80 bg-white/70'
                } text-xs text-charcoal font-medium`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-charcoal p-1"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            {touched.password && fieldErrors.password && (
              <p className="text-rose-600 text-[10px] font-semibold mt-1">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-charcoal/80 mb-1">
              Confirm *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (touched.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: validateConfirmPassword(e.target.value) }));
                }}
                onBlur={() => handleBlur('confirmPassword')}
                placeholder="••••••••"
                className={`w-full pl-9 pr-3 py-2.5 auth-input rounded-2xl border ${
                  touched.confirmPassword && fieldErrors.confirmPassword
                    ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-slate-300/80 bg-white/70'
                } text-xs text-charcoal font-medium`}
              />
            </div>
            {touched.confirmPassword && fieldErrors.confirmPassword && (
              <p className="text-rose-600 text-[10px] font-semibold mt-1">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>
        </div>

        {/* Provider Specific Profile Setup */}
        {role === 'provider' && (
          <div className="pt-3 border-t border-slate-200/80 space-y-3 animate-form-entrance">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-terracotta flex items-center gap-1">
              <Building className="w-3.5 h-3.5" /> Service Listing Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-charcoal mb-1">
                  Business Name *
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => {
                    setBusinessName(e.target.value);
                    if (touched.businessName) setFieldErrors((prev) => ({ ...prev, businessName: validateBusinessName(e.target.value) }));
                  }}
                  onBlur={() => handleBlur('businessName')}
                  placeholder="e.g. Rao Plumbing & Fittings"
                  className="w-full px-3 py-2 auth-input rounded-xl border border-slate-300/80 bg-white/80 text-xs text-charcoal font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-charcoal mb-1">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 h-[42px] rounded-xl border border-slate-300/80 bg-white text-xs text-charcoal font-medium cursor-pointer"
                >
                  {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-charcoal mb-1">
                  Service Address / Pincode *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (touched.address) setFieldErrors((prev) => ({ ...prev, address: validateAddress(e.target.value) }));
                  }}
                  onBlur={() => handleBlur('address')}
                  placeholder="e.g. 12th Main Road, Indiranagar, Bangalore"
                  className="w-full px-3 py-2 auth-input rounded-xl border border-slate-300/80 bg-white/80 text-xs text-charcoal font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-charcoal mb-1">
                  Business Phone Number *
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 00000"
                    className="w-full pl-9 pr-3 py-2 auth-input rounded-xl border border-slate-300/80 bg-white/80 text-xs text-charcoal font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Pricing Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-charcoal mb-1">
                  Rate (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={pricingAmount}
                  onChange={(e) => setPricingAmount(e.target.value)}
                  className="w-full px-3 py-2 h-[42px] rounded-xl border border-slate-300/80 bg-white text-xs text-charcoal font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-charcoal mb-1">
                  Unit
                </label>
                <select
                  value={pricingType}
                  onChange={(e) => setPricingType(e.target.value)}
                  className="w-full px-3 py-2 h-[42px] rounded-xl border border-slate-300/80 bg-white text-xs text-charcoal font-medium"
                >
                  <option value="per hour">per hour</option>
                  <option value="per service">per service</option>
                  <option value="per day">per day</option>
                  <option value="fixed">fixed rate</option>
                </select>
              </div>
            </div>

            {/* GPS Location Finder Chip */}
            <div className="bg-orange-50/60 p-2.5 rounded-xl border border-orange-200/60 flex items-center justify-between text-xs">
              <div className="text-[11px]">
                <span className="font-bold text-charcoal block">Coordinates:</span>
                <span className="text-slate-500 font-mono">
                  [{coordinates[0].toFixed(3)}, {coordinates[1].toFixed(3)}]
                </span>
              </div>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={detectingLocation}
                className="px-2.5 py-1 bg-white border border-terracotta/30 text-terracotta hover:bg-orange-100 font-bold text-[11px] rounded-lg flex items-center gap-1 transition-colors"
              >
                <Navigation className="w-3 h-3 text-terracotta" />
                <span>{detectingLocation ? 'Locating...' : 'Use My GPS'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Submit Button with Inline Loading Spinner */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 flex items-center justify-center gap-2 bg-terracotta hover:bg-[#a84218] text-white font-bold text-sm rounded-full shadow-lg shadow-terracotta/25 hover:shadow-terracotta/40 transition-all cursor-pointer disabled:opacity-60 pt-1"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>{role === 'provider' ? 'Creating Provider Account...' : 'Creating Account...'}</span>
            </>
          ) : (
            <>
              <span>Complete Registration</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Login Link */}
      <div className="text-center pt-2">
        <p className="text-xs text-slate-500 font-medium">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-terracotta hover:underline">
            Sign in →
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default RegisterPage;
