import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HospitalAdminLayout from '../../components/admin/HospitalAdminLayout';
import { registerPatientByStaff } from '../../services/adminService';
import {
  UserPlus,
  CheckCircle2,
  Key,
  Mail,
  Phone,
  User,
  Copy,
  Check,
  ArrowRight,
  FileText,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPatient() {
  const navigate = useNavigate();

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status State
  const [loading, setLoading] = useState(false);
  const [lastRegistered, setLastRegistered] = useState(null);
  const [copied, setCopied] = useState(false);
  const [recentPatients, setRecentPatients] = useState([]);

  // Helper to generate a friendly random password
  const generatePassword = () => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const newPass = `Care@${randomDigits}`;
    setPassword(newPass);
    setShowPassword(true);
    toast.success('Generated temporary password');
  };

  const handleCopyCredentials = () => {
    if (!lastRegistered) return;
    const text = `Hospital Patient Account:\nName: ${lastRegistered.name}\nEmail: ${lastRegistered.email}\nPassword: ${lastRegistered.password}\nPhone: ${lastRegistered.phone || 'N/A'}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Credentials copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter patient full name');
      return;
    }
    if (!email.trim()) {
      toast.error('Please enter patient email');
      return;
    }
    if (!password || password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        password,
      };

      const res = await registerPatientByStaff(payload);
      toast.success(res?.message || 'Patient account registered successfully!');

      const createdUser = {
        id: res?.user?.id,
        name: res?.user?.name || name,
        email: res?.user?.email || email,
        phone: res?.user?.phone || phone,
        password, // retain for staff display
        registeredAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setLastRegistered(createdUser);
      setRecentPatients((prev) => [createdUser, ...prev]);

      // Reset form fields
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setShowPassword(false);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (err?.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(', ')
          : 'Failed to register patient.');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <HospitalAdminLayout
      title="Register Walk-in Patient"
      subtitle="Create patient accounts directly from the hospital portal for individuals who cannot register online"
    >
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Info Banner */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-[#167a68]/10 text-[#167a68] shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-sm md:text-base">
                Hospital Staff Assisted Registration
              </h3>
              <p className="text-slate-600 text-xs md:text-sm mt-1 leading-relaxed">
                Hospital staff and admins can onboard patients directly on-site. Once registered, patients can immediately be booked for OPD queues, assigned admission records, or given their login credentials to access their portal later.
              </p>
            </div>
          </div>
        </div>

        {/* Success Confirmation Card (if recently registered) */}
        {lastRegistered && (
          <div className="bg-white border-2 border-emerald-400/80 rounded-2xl p-6 shadow-md shadow-emerald-500/5 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-base">
                    Patient Registered Successfully!
                  </h4>
                  <p className="text-xs text-slate-500">
                    Hand over these credentials to the patient or note them down for reference.
                  </p>
                </div>
              </div>

              <button
                onClick={handleCopyCredentials}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied to Clipboard' : 'Copy Credentials'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-5">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Patient Name
                </span>
                <span className="text-sm font-bold text-slate-800">{lastRegistered.name}</span>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Login Email
                </span>
                <span className="text-sm font-semibold text-slate-800 break-all">{lastRegistered.email}</span>
              </div>
              <div className="bg-emerald-50/70 rounded-xl p-3 border border-emerald-200/60">
                <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block mb-1">
                  Temporary Password
                </span>
                <span className="text-sm font-mono font-bold text-emerald-800">{lastRegistered.password}</span>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Phone Number
                </span>
                <span className="text-sm text-slate-700">{lastRegistered.phone || 'None provided'}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-slate-100">
              <button
                onClick={() => navigate('/hospital/patients')}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#167a68] hover:text-emerald-800 bg-[#167a68]/10 hover:bg-[#167a68]/15 px-3 py-1.5 rounded-lg transition"
              >
                <FileText className="w-3.5 h-3.5" />
                Go to Patient Records
              </button>
              <button
                onClick={() => navigate('/hospital/opd')}
                className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900 bg-teal-100/60 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition"
              >
                <Clock className="w-3.5 h-3.5" />
                Queue in OPD
              </button>
              <button
                onClick={() => setLastRegistered(null)}
                className="text-xs font-medium text-slate-400 hover:text-slate-600 ml-auto transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Main Form & Session History */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Registration Form Card */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-[#167a68]/10 text-[#167a68] flex items-center justify-center font-bold">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base sm:text-lg">
                  Patient Details
                </h3>
                <p className="text-xs text-slate-500">
                  Fill in the patient's basic information to create their account
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Thapa"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#167a68]/30 focus:border-[#167a68] text-sm text-slate-800 transition"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. patient@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#167a68]/30 focus:border-[#167a68] text-sm text-slate-800 transition"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  If the patient doesn't have an email, staff can use a standard format (e.g. name.phone@hospital.com).
                </p>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Phone Number <span className="text-slate-400 text-[11px] font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="e.g. 9841234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#167a68]/30 focus:border-[#167a68] text-sm text-slate-800 transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Temporary Password <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="text-xs font-medium text-[#167a68] hover:text-emerald-700 flex items-center gap-1 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Auto-Generate Password
                  </button>
                </div>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#167a68]/30 focus:border-[#167a68] text-sm text-slate-800 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Patients can use this password to log in and update it at any time.
                </p>
              </div>

              {/* Submit Button & Actions */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-[#167a68] hover:bg-[#116253] active:scale-[0.99] text-white font-semibold text-sm shadow-md shadow-[#167a68]/25 hover:shadow-lg hover:shadow-[#167a68]/35 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Register Patient
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setName('');
                    setEmail('');
                    setPhone('');
                    setPassword('');
                    setShowPassword(false);
                  }}
                  className="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar / Quick Tips & Session Registrations */}
          <div className="space-y-6">
            {/* Quick Guide Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
              <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-emerald-600" />
                Staff Registration Tips
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span>
                    <strong>Walk-in Patients:</strong> Use this form to quickly register patients visiting the emergency or outpatient clinic in-person.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span>
                    <strong>Auto-Generate Password:</strong> Click "Auto-Generate Password" to assign a quick, secure temporary password (e.g. Care@1234).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span>
                    <strong>After Registration:</strong> Proceed directly to <em>Patient Records</em> to add diagnosis/allergies or <em>OPD Queue</em> to issue a queue ticket.
                  </span>
                </li>
              </ul>
            </div>

            {/* Session Registrations */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
              <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center justify-between">
                <span>Recent Registrations</span>
                <span className="text-[11px] font-normal text-slate-400">
                  {recentPatients.length} this session
                </span>
              </h4>

              {recentPatients.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">No patients registered in this session yet.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {recentPatients.map((p, idx) => (
                    <div
                      key={p.id || idx}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 hover:border-emerald-200 transition text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-semibold text-slate-800">
                        <span className="truncate">{p.name}</span>
                        <span className="text-[10px] text-slate-400 font-normal">{p.registeredAt}</span>
                      </div>
                      <div className="text-slate-500 truncate text-[11px]">{p.email}</div>
                      {p.phone && <div className="text-slate-500 text-[11px]">{p.phone}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </HospitalAdminLayout>
  );
}
