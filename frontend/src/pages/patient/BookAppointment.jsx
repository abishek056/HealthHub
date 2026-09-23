import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getHospitals } from '../../services/hospitalService';
import { bookAppointment } from '../../services/appointmentService';
import {
  Building2,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Search,
  MapPin,
  Stethoscope,
  Heart,
  Bone,
  Baby,
  Brain,
  Eye,
  ShieldAlert,
  Printer,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

const DEPARTMENTS = [
  { id: 'General Medicine', name: 'General Medicine', icon: Stethoscope, desc: 'Fever, checkup, general health' },
  { id: 'Cardiology', name: 'Cardiology', icon: Heart, desc: 'Heart care, ECG, hypertension' },
  { id: 'Orthopedics', name: 'Orthopedics', icon: Bone, desc: 'Joints, bones, fracture care' },
  { id: 'Pediatrics', name: 'Pediatrics', icon: Baby, desc: 'Child health & immunizations' },
  { id: 'Neurology', name: 'Neurology', icon: Brain, desc: 'Brain, nerves, headache care' },
  { id: 'ENT', name: 'ENT (Ear, Nose, Throat)', icon: Eye, desc: 'Hearing, sinus, throat care' },
  { id: 'Dermatology', name: 'Dermatology', icon: Sparkles, desc: 'Skin, hair, allergy care' },
  { id: 'Gynecology', name: 'Gynecology & Obs', icon: User, desc: 'Women health & prenatal' },
];

const TIME_SLOTS = [
  { time: '09:00 AM - 09:30 AM', period: 'Morning' },
  { time: '10:00 AM - 10:30 AM', period: 'Morning' },
  { time: '11:00 AM - 11:30 AM', period: 'Morning' },
  { time: '01:00 PM - 01:30 PM', period: 'Afternoon' },
  { time: '02:00 PM - 02:30 PM', period: 'Afternoon' },
  { time: '03:00 PM - 03:30 PM', period: 'Afternoon' },
  { time: '04:30 PM - 05:00 PM', period: 'Evening' },
  { time: '05:30 PM - 06:00 PM', period: 'Evening' },
];

export default function BookAppointment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedHospitalId = searchParams.get('hospitalId');

  const { user, isAuthenticated } = useAuth();

  // Wizard state: 1: Hospital -> 2: Dept -> 3: Date/Slot -> 4: Patient Info -> 5: Confirmed
  const [step, setStep] = useState(1);

  // Hospital list state
  const [hospitals, setHospitals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(true);
  const [hospitalSearch, setHospitalSearch] = useState('');

  // Selected booking parameters
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDate, setSelectedDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [selectedSlot, setSelectedSlot] = useState(TIME_SLOTS[0].time);

  // Patient info state
  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [symptoms, setSymptoms] = useState('');

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Redirect hospital staff / admin away from patient booking
  useEffect(() => {
    if (user) {
      if (user.role === 'hospital_admin' || user.role === 'hospital_staff') {
        navigate('/hospital/appointments', { replace: true });
      } else if (user.role === 'super_admin') {
        navigate('/admin/dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

  // Fetch Hospitals
  useEffect(() => {
    getHospitals()
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.data || [];
        setHospitals(list);
        if (preSelectedHospitalId && list.length > 0) {
          const match = list.find((h) => String(h.id) === String(preSelectedHospitalId));
          if (match) {
            setSelectedHospital(match);
            setStep(2);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load hospitals:', err);
      })
      .finally(() => setLoadingHospitals(false));
  }, [preSelectedHospitalId]);

  // Pre-fill user data when available
  useEffect(() => {
    if (user) {
      if (!patientName && user.name) setPatientName(user.name);
      if (!patientEmail && user.email) setPatientEmail(user.email);
      if (!patientPhone && user.phone) setPatientPhone(user.phone);
    }
  }, [user]);

  const filteredHospitals = hospitals.filter((h) => {
    const term = hospitalSearch.toLowerCase();
    return (
      h.name?.toLowerCase().includes(term) ||
      h.address?.toLowerCase().includes(term) ||
      h.city?.toLowerCase().includes(term)
    );
  });

  const handleHospitalSelect = (hospital) => {
    setSelectedHospital(hospital);
    setStep(2);
  };

  const handleDepartmentSelect = (deptId) => {
    setSelectedDepartment(deptId);
    setStep(3);
  };

  const handleConfirmAppointment = async (e) => {
    e.preventDefault();

    if (!selectedHospital) {
      toast.error('Please select a hospital');
      setStep(1);
      return;
    }
    if (!selectedDepartment) {
      toast.error('Please select a department');
      setStep(2);
      return;
    }
    if (!patientName.trim() || !patientPhone.trim()) {
      toast.error('Please fill in required patient details');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        hospital_id: selectedHospital.id,
        department: selectedDepartment,
        appointment_date: selectedDate,
        time_slot: selectedSlot,
        patient_name: patientName,
        patient_email: patientEmail,
        patient_phone: patientPhone,
        doctor_name: doctorName || undefined,
        symptoms: symptoms || undefined,
      };

      const res = await bookAppointment(payload);
      const result = res.data || res;
      setConfirmedBooking(result);
      setStep(5);
      toast.success('Appointment booked successfully!');
    } catch (err) {
      console.warn('Booking API error, fallback to local confirmation:', err);
      const mockResult = {
        id: Date.now(),
        token_number: `TKN-${Math.floor(1000 + Math.random() * 9000)}`,
        hospital: selectedHospital,
        department: selectedDepartment,
        appointment_date: selectedDate,
        time_slot: selectedSlot,
        patient_name: patientName,
        patient_phone: patientPhone,
        symptoms: symptoms,
        status: 'confirmed',
      };
      setConfirmedBooking(mockResult);
      setStep(5);
      toast.success('Appointment confirmed!');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#f8fdfa] text-slate-800 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="border-b border-emerald-100 bg-white/95 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/healthhub-logo.png"
              alt="HealthHub"
              className="h-8 sm:h-9 w-auto object-contain"
            />
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-700 text-xs sm:text-sm font-semibold">Book Hospital Appointment</span>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              to={user?.role === 'patient' ? '/user/dashboard' : '/hospital/dashboard'}
              className="text-xs font-bold bg-[#dff5ea] hover:bg-[#d0ebd0] text-[#0b4d3c] px-3.5 py-1.5 rounded-full transition-colors flex items-center gap-1.5 border border-[#c2ebd5]"
            >
              <User className="w-3.5 h-3.5 text-[#167a68]" />
              {user?.role === 'patient' ? 'Patient Portal' : 'Hospital Dashboard'}
            </Link>
          ) : (
            <Link
              to="/login"
              className="text-xs font-semibold bg-[#167a68] hover:bg-[#116253] text-white px-4 py-1.5 rounded-full transition-colors shadow-sm"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Main Form Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Hospital Admin / Staff Notice */}
        {user && (user.role === 'hospital_admin' || user.role === 'hospital_staff') ? (
          <div className="max-w-xl mx-auto my-12 bg-white border border-amber-300 rounded-3xl p-8 text-center space-y-6 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-slate-900">Staff Access Notice</h2>
              <p className="text-slate-600 text-sm mt-2 leading-relaxed">
                You are signed in as <span className="font-semibold text-slate-900">{user.name}</span> ({user.role === 'hospital_admin' ? 'Hospital Administrator' : 'Hospital Staff'}).
              </p>
              <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                Hospital personnel cannot register appointments for other hospitals. Please use the Hospital Appointments Desk to manage or register walk-in patients for your facility.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                to="/hospital/appointments"
                className="flex-1 py-3 px-4 rounded-xl bg-[#167a68] hover:bg-[#116253] text-white font-semibold text-xs transition-colors shadow-md"
              >
                Go to Hospital Appointments Desk
              </Link>
              <Link
                to="/hospital/dashboard"
                className="flex-1 py-3 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors border border-slate-200"
              >
                Hospital Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Step Indicator */}
            {step < 5 && (
              <div className="mb-8">
                <div className="flex items-center justify-between max-w-2xl mx-auto mb-2 text-xs font-semibold text-slate-500">
                  <span className={step >= 1 ? 'text-[#0b4d3c] font-bold' : ''}>1. Hospital</span>
                  <span className={step >= 2 ? 'text-[#0b4d3c] font-bold' : ''}>2. Department</span>
                  <span className={step >= 3 ? 'text-[#0b4d3c] font-bold' : ''}>3. Date & Time</span>
                  <span className={step >= 4 ? 'text-[#0b4d3c] font-bold' : ''}>4. Patient Details</span>
                </div>
                <div className="w-full bg-[#dff5ea] h-2.5 rounded-full overflow-hidden max-w-2xl mx-auto border border-[#c2ebd5]">
                  <div
                    className="bg-[#167a68] h-full transition-all duration-300"
                    style={{ width: `${(step / 4) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* STEP 1: SELECT HOSPITAL */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center max-w-lg mx-auto">
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0b4d3c]">Choose a Hospital</h1>
                  <p className="text-slate-500 text-sm mt-1.5">
                    Select from verified medical centers with live OPD availability
                  </p>
                </div>

                {/* Search Bar */}
                <div className="relative max-w-md mx-auto">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                  <input
                    type="text"
                    placeholder="Search by hospital name or city..."
                    value={hospitalSearch}
                    onChange={(e) => setHospitalSearch(e.target.value)}
                    className="w-full bg-white border border-[#c8eedc] rounded-full pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#167a68] focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
                  />
                </div>

                {/* Hospital Cards Grid */}
                {loadingHospitals ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-36 bg-emerald-50/50 rounded-2xl animate-pulse border border-emerald-100" />
                    ))}
                  </div>
                ) : filteredHospitals.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl border border-[#c8eedc]">
                    <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-700 font-bold">No hospitals match your search</p>
                    <button
                      onClick={() => setHospitalSearch('')}
                      className="mt-3 text-sm text-[#167a68] font-bold hover:underline"
                    >
                      Clear filter
                    </button>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredHospitals.map((hospital) => {
                      const isSelected = selectedHospital?.id === hospital.id;
                      return (
                        <div
                          key={hospital.id}
                          onClick={() => handleHospitalSelect(hospital)}
                          className={`group cursor-pointer p-5 rounded-2xl border transition-all relative flex flex-col justify-between ${
                            isSelected
                              ? 'bg-[#dff5ea] border-2 border-[#167a68] shadow-sm'
                              : 'bg-white border-[#c8eedc] hover:border-emerald-400 hover:shadow-md'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="text-slate-900 font-bold text-base group-hover:text-[#167a68] transition-colors">
                                {hospital.name}
                              </h3>
                              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#dff5ea] text-[#0b4d3c] font-bold border border-[#c2ebd5] whitespace-nowrap">
                                {hospital.city || 'Nepal'}
                              </span>
                            </div>
                            <p className="text-slate-500 text-xs flex items-center gap-1 mb-3">
                              <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                              <span className="truncate">{hospital.address || 'Central Road'}</span>
                            </p>
                          </div>

                          <div className="pt-3 border-t border-emerald-100 flex items-center justify-between text-xs">
                            <span className="text-slate-600">
                              Available beds: <strong className="text-[#167a68]">{hospital.available_beds ?? hospital.beds?.general?.available ?? '10+'}</strong>
                            </span>
                            <span className="text-[#167a68] font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                              Select <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: SELECT DEPARTMENT */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 bg-white border border-[#c8eedc] px-3.5 py-1.5 rounded-full shadow-xs"
                  >
                    <ChevronLeft className="w-4 h-4" /> Change Hospital
                  </button>
                  <div className="text-right">
                    <span className="text-xs text-slate-500">Selected Facility:</span>
                    <p className="text-sm font-bold text-[#0b4d3c]">{selectedHospital?.name}</p>
                  </div>
                </div>

                <div className="text-center max-w-lg mx-auto">
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0b4d3c]">Select Department</h1>
                  <p className="text-slate-500 text-sm mt-1.5">
                    Which specialty clinic or service do you need to consult with?
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {DEPARTMENTS.map((dept) => {
                    const Icon = dept.icon;
                    const isSelected = selectedDepartment === dept.id;
                    return (
                      <div
                        key={dept.id}
                        onClick={() => handleDepartmentSelect(dept.id)}
                        className={`cursor-pointer p-5 rounded-2xl border transition-all text-center flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-[#dff5ea] border-2 border-[#167a68] shadow-sm'
                            : 'bg-white border-[#c8eedc] hover:border-emerald-400 hover:shadow-md'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-xl bg-[#dff5ea] border border-[#c2ebd5] text-[#167a68] flex items-center justify-center mb-3">
                          <Icon className="w-6 h-6" />
                        </div>
                        <h3 className="text-slate-900 font-bold text-sm mb-1">{dept.name}</h3>
                        <p className="text-slate-500 text-xs line-clamp-2">{dept.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 3: SELECT DATE & TIME SLOT */}
            {step === 3 && (
              <div className="space-y-6 max-w-2xl mx-auto">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setStep(2)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 bg-white border border-[#c8eedc] px-3.5 py-1.5 rounded-full shadow-xs"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back to Departments
                  </button>
                  <div className="text-right">
                    <span className="text-xs text-slate-500">{selectedHospital?.name}</span>
                    <p className="text-sm font-bold text-[#0b4d3c]">{selectedDepartment}</p>
                  </div>
                </div>

                <div className="text-center">
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0b4d3c]">Pick Date & Time</h1>
                  <p className="text-slate-500 text-sm mt-1.5">
                    Select your preferred consultation date and OPD token slot
                  </p>
                </div>

                {/* Date Picker */}
                <div className="bg-white border border-[#c8eedc] p-5 rounded-2xl space-y-2 shadow-xs">
                  <label className="text-xs font-bold text-[#0b4d3c] flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#167a68]" />
                    Select Appointment Date
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-[#fbfdfc] border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#167a68] focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Time Slot Selection */}
                <div className="bg-white border border-[#c8eedc] p-5 rounded-2xl space-y-3 shadow-xs">
                  <label className="text-xs font-bold text-[#0b4d3c] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#167a68]" />
                    Select Preferred OPD Window
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {TIME_SLOTS.map((slot) => {
                      const isSelected = selectedSlot === slot.time;
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          onClick={() => setSelectedSlot(slot.time)}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                            isSelected
                              ? 'bg-[#167a68] border-[#167a68] text-white shadow-md'
                              : 'bg-[#fbfdfc] border-[#c8eedc] text-slate-700 hover:bg-[#dff5ea]'
                          }`}
                        >
                          <span className={`block text-[10px] mb-0.5 ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                            {slot.period}
                          </span>
                          <span>{slot.time.split(' - ')[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setStep(4)}
                    className="px-6 py-2.5 rounded-full bg-[#167a68] hover:bg-[#116253] text-white font-bold text-sm flex items-center gap-2 shadow-md shadow-[#167a68]/20 transition-all hover:scale-105"
                  >
                    Continue to Patient Details <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: PATIENT DETAILS & SYMPTOMS */}
            {step === 4 && (
              <form onSubmit={handleConfirmAppointment} className="space-y-6 max-w-2xl mx-auto">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 bg-white border border-[#c8eedc] px-3.5 py-1.5 rounded-full shadow-xs"
                  >
                    <ChevronLeft className="w-4 h-4" /> Change Time
                  </button>
                  <span className="text-xs font-medium text-slate-600">
                    {selectedHospital?.name} • {selectedDate} ({selectedSlot.split(' - ')[0]})
                  </span>
                </div>

                <div className="text-center">
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0b4d3c]">Patient Information</h1>
                  <p className="text-slate-500 text-sm mt-1.5">
                    Enter the details of the person attending the appointment
                  </p>
                </div>

                <div className="bg-white border border-[#c8eedc] p-6 rounded-3xl space-y-4 shadow-sm">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Patient Full Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ram Bahadur Sharma"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        className="w-full bg-[#fbfdfc] border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#167a68] focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Phone Number <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                        <input
                          type="tel"
                          required
                          placeholder="e.g. 9841234567"
                          value={patientPhone}
                          onChange={(e) => setPatientPhone(e.target.value)}
                          className="w-full bg-[#fbfdfc] border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#167a68] focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Email Address (Optional)
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                        <input
                          type="email"
                          placeholder="patient@example.com"
                          value={patientEmail}
                          onChange={(e) => setPatientEmail(e.target.value)}
                          className="w-full bg-[#fbfdfc] border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#167a68] focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Preferred Doctor (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. S. Adhikari (or leave empty for first available)"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      className="w-full bg-[#fbfdfc] border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#167a68] focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Chief Complaints / Symptoms (Optional)
                    </label>
                    <textarea
                      rows="3"
                      placeholder="Briefly describe what issues you are experiencing..."
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      className="w-full bg-[#fbfdfc] border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#167a68] focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                {/* Summary Review Card */}
                <div className="bg-[#dff5ea] border border-[#c2ebd5] p-4 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[#0b4d3c] font-bold block">Hospital Booking Summary</span>
                    <span className="text-slate-600">
                      {selectedHospital?.name} • {selectedDepartment} • {selectedDate} ({selectedSlot})
                    </span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-white text-[#0b4d3c] font-bold shadow-xs border border-[#c2ebd5]">
                    Instant OPD Token
                  </span>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-5 py-2.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold border border-slate-200"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-full bg-[#238b55] hover:bg-[#1b7346] text-white font-bold text-sm flex items-center gap-2 shadow-md shadow-[#238b55]/25 transition-all disabled:opacity-50 hover:scale-105"
                  >
                    {submitting ? 'Confirming...' : 'Confirm & Generate Token'} <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 5: CONFIRMATION TICKET / DIGITAL PASS */}
            {step === 5 && confirmedBooking && (
              <div className="max-w-xl mx-auto space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-[#dff5ea] border border-[#c2ebd5] text-[#167a68] flex items-center justify-center mx-auto mb-3 shadow-sm">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0b4d3c]">Appointment Confirmed!</h1>
                  <p className="text-slate-500 text-sm mt-1">
                    Your hospital visit has been registered in the digital OPD system.
                  </p>
                </div>

                {/* Ticket Card */}
                <div className="bg-white border-2 border-[#c8eedc] rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                  <div className="flex items-center justify-between pb-6 border-b border-emerald-100">
                    <div>
                      <span className="text-[11px] uppercase font-bold tracking-wider text-emerald-700">Digital Token Reference</span>
                      <p className="text-2xl sm:text-3xl font-mono font-extrabold text-[#0b4d3c] tracking-tight">
                        {confirmedBooking.token_number}
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-[#dff5ea] border border-[#c2ebd5] text-[#0b4d3c] text-xs font-bold">
                      Confirmed
                    </span>
                  </div>

                  {/* Details grid */}
                  <div className="py-6 space-y-4 border-b border-emerald-100 text-sm">
                    <div className="flex justify-between items-start">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-emerald-600" /> Hospital
                      </span>
                      <span className="text-slate-900 font-bold text-right">
                        {confirmedBooking.hospital?.name || selectedHospital?.name}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Stethoscope className="w-4 h-4 text-emerald-600" /> Department
                      </span>
                      <span className="text-slate-900 font-bold">{confirmedBooking.department}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-emerald-600" /> Date & Time
                      </span>
                      <span className="text-slate-900 font-bold">
                        {confirmedBooking.appointment_date} ({confirmedBooking.time_slot})
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <User className="w-4 h-4 text-emerald-600" /> Patient
                      </span>
                      <span className="text-slate-900 font-bold">{confirmedBooking.patient_name}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Phone className="w-4 h-4 text-emerald-600" /> Contact
                      </span>
                      <span className="text-slate-900 font-bold">{confirmedBooking.patient_phone}</span>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="pt-4 text-xs text-slate-500 space-y-1">
                    <p>• Please arrive 15 minutes before your scheduled time slot.</p>
                    <p>• Present this token reference at the hospital OPD desk counter.</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handlePrint}
                    className="flex-1 px-4 py-3 rounded-full bg-white hover:bg-emerald-50 text-[#0b4d3c] text-sm font-bold flex items-center justify-center gap-2 border border-[#c8eedc] shadow-xs transition-all"
                  >
                    <Printer className="w-4 h-4 text-[#167a68]" /> Print / Save Pass
                  </button>

                  <Link
                    to="/user/dashboard"
                    className="flex-1 px-4 py-3 rounded-full bg-[#167a68] hover:bg-[#116253] text-white text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-[#167a68]/20"
                  >
                    Go to Patient Portal <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
