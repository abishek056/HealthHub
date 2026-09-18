import React, { useState } from 'react';
import { bookOPDToken } from '../../services/opdService';

const TokenBookingModal = ({
  isOpen,
  department = '',
  hospitalId,
  hospitalName = 'Hospital',
  onClose,
  onTokenBooked,
}) => {
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('any');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [error, setError] = useState('');

  // Clean up state when closing
  const handleModalClose = () => {
    setBookingResult(null);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patientName.trim()) {
      setError('Please enter patient name.');
      return;
    }
    if (!phone.trim() || phone.length < 8) {
      setError('Please enter a valid phone number for SMS confirmation.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const result = await bookOPDToken(hospitalId, {
        department,
        patient_name: patientName.trim(),
        phone: phone.trim(),
        age: age ? parseInt(age) : undefined,
        gender,
      });

      setBookingResult(result);
      if (onTokenBooked) {
        onTokenBooked(result);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to book token. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      onClick={handleModalClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-5 text-white flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-primary-200">
              HealthHub OPD Service
            </span>
            <h3 className="text-xl font-bold mt-0.5">
              {bookingResult ? 'Token Confirmation' : 'Book OPD Token'}
            </h3>
            <p className="text-xs text-primary-100 mt-0.5 truncate max-w-xs">
              {department} · {hospitalName}
            </p>
          </div>
          <button
            type="button"
            onClick={handleModalClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {bookingResult ? (
            /* ─── SUCCESS RESULT VIEW ─── */
            <div className="space-y-5 text-center">
              {/* Token Ticket Card */}
              <div className="bg-gradient-to-br from-primary-50 via-sky-50 to-emerald-50 rounded-2xl p-6 border-2 border-dashed border-primary-200 shadow-inner relative overflow-hidden">
                <div className="text-xs font-semibold text-primary-700 uppercase tracking-wider mb-1">
                  Your OPD Token Number
                </div>
                <div className="text-5xl font-black text-primary-600 tracking-tight my-2 animate-bounce">
                  #{bookingResult.token_number}
                </div>
                <div className="text-sm font-medium text-gray-800">
                  {bookingResult.department} Department
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-gray-200 text-xs text-gray-600 mt-3 shadow-sm">
                  <svg className="w-3.5 h-3.5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Est. Wait: ~{bookingResult.estimated_wait_mins} mins</span>
                </div>
              </div>

              {/* SMS Confirmation Badge */}
              {bookingResult.sms_confirmation && (
                <div className="text-left bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-emerald-900 uppercase">SMS Confirmation Sent</h4>
                      <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-medium">Delivered</span>
                    </div>
                    <p className="text-xs text-emerald-800 mt-1 leading-relaxed break-words font-mono bg-white/60 p-2 rounded border border-emerald-100">
                      {bookingResult.sms_confirmation}
                    </p>
                  </div>
                </div>
              )}

              {/* Patient Details Summary */}
              <div className="grid grid-cols-2 gap-2 text-left text-xs bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div>
                  <span className="text-gray-400 block">Patient</span>
                  <span className="font-semibold text-gray-800 truncate block">{bookingResult.patient_name}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Phone</span>
                  <span className="font-semibold text-gray-800 truncate block">{bookingResult.phone || 'N/A'}</span>
                </div>
              </div>

              <div className="text-xs text-gray-500">
                Please present this token at the reception desk upon your arrival.
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Ticket
                </button>
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 shadow-md shadow-primary-500/20 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* ─── BOOKING FORM VIEW ─── */
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Department badge banner */}
              <div className="bg-primary-50 border border-primary-100 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-primary-600 uppercase font-semibold block">Department</span>
                  <span className="text-sm font-bold text-gray-900">{department}</span>
                </div>
                <span className="text-xs bg-white text-primary-700 font-semibold px-2.5 py-1 rounded-lg border border-primary-200 shadow-xs">
                  Instant Queue
                </span>
              </div>

              {/* Patient Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Patient Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Devi Adhikari"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                />
              </div>

              {/* Mobile Phone */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Mobile Number (For SMS Confirmation) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-xs font-medium text-gray-400">
                    +977
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder="98XXXXXXXX"
                    className="w-full pl-14 pr-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  You will receive your token number and live queue reminders via SMS.
                </p>
              </div>

              {/* Age & Gender Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Age (Optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    placeholder="e.g. 35"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Gender (Optional)
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="any">Not specified</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleModalClose}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 shadow-md shadow-primary-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-75 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Booking…</span>
                    </>
                  ) : (
                    <span>Confirm Token</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default TokenBookingModal;
