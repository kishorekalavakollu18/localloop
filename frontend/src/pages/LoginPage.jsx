import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import { 
  MapPin, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  UserCheck,
  Check
} from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Field level blur validation states
  const [touched, setTouched] = useState({ email: false, password: false });
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });

  const redirectPath = location.state?.from?.pathname || '/';

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

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === 'email') {
      setFieldErrors((prev) => ({ ...prev, email: validateEmail(email) }));
    } else if (field === 'password') {
      setFieldErrors((prev) => ({ ...prev, password: validatePassword(password) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);
    setTouched({ email: true, password: true });
    setFieldErrors({ email: emailErr, password: passErr });

    if (emailErr || passErr) {
      setError('Please fix the errors above.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await login(email, password);
      if (res.user.role === 'provider') {
        navigate('/provider/dashboard');
      } else {
        navigate(redirectPath === '/login' ? '/customer/dashboard' : redirectPath);
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setFieldErrors({ email: '', password: '' });
    setError('');
  };

  return (
    <AuthLayout>
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-terracotta flex items-center justify-center text-white mx-auto shadow-lg shadow-terracotta/30">
          <MapPin className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold font-heading text-charcoal tracking-tight">
          Welcome back
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Sign in to manage your appointments, bookings, or service listings
        </p>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-semibold animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Input */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-charcoal/80 mb-1.5">
            Email Address
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
              placeholder="name@example.com"
              className={`w-full pl-10 pr-4 py-3 auth-input rounded-2xl border ${
                touched.email && fieldErrors.email
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                  : 'border-slate-300/80 bg-white/70'
              } text-sm text-charcoal placeholder:text-slate-400 font-medium`}
            />
          </div>
          {touched.email && fieldErrors.email && (
            <p className="text-rose-600 text-[11px] font-semibold mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>{fieldErrors.email}</span>
            </p>
          )}
        </div>

        {/* Password Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-charcoal/80">
              Password
            </label>
            <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Password reset link sent to your registered email.'); }} className="text-xs font-bold text-terracotta hover:underline">
              Forgot?
            </a>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (touched.password) setFieldErrors((prev) => ({ ...prev, password: validatePassword(e.target.value) }));
              }}
              onBlur={() => handleBlur('password')}
              placeholder="••••••••"
              className={`w-full pl-10 pr-10 py-3 auth-input rounded-2xl border ${
                touched.password && fieldErrors.password
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                  : 'border-slate-300/80 bg-white/70'
              } text-sm text-charcoal placeholder:text-slate-400 font-medium`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-charcoal transition-colors p-1"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {touched.password && fieldErrors.password && (
            <p className="text-rose-600 text-[11px] font-semibold mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>{fieldErrors.password}</span>
            </p>
          )}
        </div>

        {/* Remember Me Checkbox */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-terracotta rounded border-slate-300 focus:ring-terracotta accent-terracotta"
            />
            <span className="text-xs text-slate-600 font-medium">Keep me signed in</span>
          </label>
        </div>

        {/* Terracotta Submit Button with Inline Loading Spinner */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 flex items-center justify-center gap-2 bg-terracotta hover:bg-[#a84218] text-white font-bold text-sm rounded-full shadow-lg shadow-terracotta/25 hover:shadow-terracotta/40 transition-all cursor-pointer disabled:opacity-60 mt-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>



      {/* Switch to Signup Link */}
      <div className="text-center pt-1">
        <p className="text-xs text-slate-500 font-medium">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-bold text-terracotta hover:underline">
            Create account →
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
