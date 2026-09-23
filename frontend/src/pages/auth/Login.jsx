import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  Stethoscope,
  Lock,
  Mail,
  Phone,
  ArrowRight,
  Shield,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState(location.state?.mode === 'register' ? 'register' : 'login');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');
  const [isLoading, setIsLoading] = useState(false);

  // Registration form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');

  const from = location.state?.from?.pathname;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setIsLoading(true);

    try {
      const userData = await login(email, password, role);

      if (from) {
        navigate(from, { replace: true });
        return;
      }

      if (userData.role === 'super_admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (userData.role === 'hospital_admin' || userData.role === 'hospital_staff') {
        navigate('/hospital/dashboard', { replace: true });
      } else {
        // Patient / Normal User
        navigate('/user/dashboard', { replace: true });
      }
    } catch (error) {
      console.error('Login error', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (regPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      await register(regName, regEmail, regPassword, regPhone);
      navigate('/user/dashboard', { replace: true });
    } catch (error) {
      console.error('Registration error', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Demo account filler
  const fillDemo = (demoEmail, demoPassword, demoRole) => {
    setMode('login');
    setEmail(demoEmail);
    setPassword(demoPassword);
    setRole(demoRole);
    toast.success(`Loaded credentials for ${demoRole.replace('_', ' ')}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ebf8f2] via-[#f7fcf9] to-[#dff5ea] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans text-slate-800 relative">
      {/* Background Soft Glows */}
      <div className="absolute top-10 left-1/4 w-80 h-80 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-teal-200/40 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar Back to Home */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 mb-3">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#167a68] hover:text-[#0b4d3c] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to HealthHub
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        {/* Brand Logo */}
        <Link to="/" className="inline-block mb-3">
          <img
            src="/healthhub-logo.png"
            alt="HealthHub"
            className="h-14 sm:h-16 w-auto mx-auto object-contain drop-shadow-sm"
          />
        </Link>
        <p className="font-serif text-sm font-semibold text-[#0b4d3c] mb-6">
          Care That Connects. Health That Matters.
        </p>

        {/* Tab Switcher (Sign In vs New Account) */}
        <div className="flex bg-[#dff5ea] border border-[#c2ebd5] p-1 rounded-full max-w-xs mx-auto mb-6 shadow-xs">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-2 text-xs font-bold rounded-full transition-all ${
              mode === 'login'
                ? 'bg-[#167a68] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 py-2 text-xs font-bold rounded-full transition-all ${
              mode === 'register'
                ? 'bg-[#167a68] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            New Patient Account
          </button>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/95 backdrop-blur-md border border-[#c8eedc] py-8 px-6 sm:px-10 rounded-3xl shadow-2xl shadow-emerald-950/10 space-y-6">
          {mode === 'login' ? (
            <>
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#0b4d3c] tracking-tight">
                  Welcome to HealthHub
                </h2>
                <p className="text-slate-500 text-xs mt-1">
                  Access your hospital appointments, digital OPD tokens, and live bed records.
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Role Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0b4d3c] mb-2">
                    Select Portal Access
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setRole('patient')}
                      className={`p-2.5 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        role === 'patient'
                          ? 'bg-[#dff5ea] border-2 border-[#167a68] text-[#0b4d3c] shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <User className="w-3.5 h-3.5 text-[#167a68]" />
                      Patient / User
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('hospital_admin')}
                      className={`p-2.5 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        role === 'hospital_admin' || role === 'hospital_staff'
                          ? 'bg-[#dff5ea] border-2 border-[#167a68] text-[#0b4d3c] shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Stethoscope className="w-3.5 h-3.5 text-[#167a68]" />
                      Hospital Staff
                    </button>
                  </div>
                </div>

                {/* Email input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. patient@healthhub.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#167a68] focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>
                </div>

                {/* Password input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#167a68] focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-[#238b55] hover:bg-[#1b7346] text-white text-sm font-semibold shadow-md shadow-[#238b55]/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01] active:scale-98"
                >
                  {isLoading ? 'Signing in...' : 'Sign In'} <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* 1-Click Demo Accounts */}
              <div className="pt-4 border-t border-emerald-100">
                <span className="text-[10px] uppercase tracking-wider font-bold text-[#0b4d3c] block mb-2.5 text-center">
                  Quick Demo Accounts
                </span>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    type="button"
                    onClick={() => fillDemo('patient@healthhub.com', 'password', 'patient')}
                    className="px-3 py-1.5 rounded-full bg-[#dff5ea] hover:bg-[#d0eedf] text-xs font-semibold text-[#0b4d3c] border border-[#c2ebd5] transition-all"
                  >
                    👤 Demo Patient
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemo('birhospital@healthhub.com', 'password', 'hospital_admin')}
                    className="px-3 py-1.5 rounded-full bg-[#dff5ea] hover:bg-[#d0eedf] text-xs font-semibold text-[#0b4d3c] border border-[#c2ebd5] transition-all"
                  >
                    🏥 Bir Hospital Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemo('admin@healthhub.com', 'password', 'super_admin')}
                    className="px-3 py-1.5 rounded-full bg-[#dff5ea] hover:bg-[#d0eedf] text-xs font-semibold text-[#0b4d3c] border border-[#c2ebd5] transition-all"
                  >
                    ⚡ Super Admin
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Registration Form */
            <>
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#0b4d3c] tracking-tight">
                  Create Patient Account
                </h2>
                <p className="text-slate-500 text-xs mt-1">
                  Book hospital appointments, reserve OPD tokens, and track queue updates.
                </p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Ram Sharma"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#167a68] focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="e.g. ram@example.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#167a68] focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Mobile Phone (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="e.g. 9841234567"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#167a68] focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Password <span className="text-rose-500">* (min. 6 characters)</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#167a68] focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-[#238b55] hover:bg-[#1b7346] text-white text-sm font-semibold shadow-md shadow-[#238b55]/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01] active:scale-98"
                >
                  {isLoading ? 'Creating account...' : 'Create Account & Continue'}{' '}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
