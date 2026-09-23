import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getHospitalById } from '../../services/hospitalService';
import OPDQueue from '../../components/opd/OPDQueue';
import { MapPin, Phone, Calendar, Map, BedDouble, Droplets, Ambulance, ArrowLeft, ChevronRight } from 'lucide-react';

const HospitalDetail = () => {
  const { id } = useParams();
  const [hospital, setHospital] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHospital = async () => {
      try {
        const data = await getHospitalById(id);
        setHospital(data);
      } catch (error) {
        console.error("Failed to fetch hospital details", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHospital();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fdfa] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#167a68]"></div>
          <p className="text-sm text-slate-500 font-medium">Loading hospital details...</p>
        </div>
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="min-h-screen bg-[#f8fdfa] flex items-center justify-center flex-col gap-4">
        <div className="w-16 h-16 rounded-full bg-[#dff5ea] flex items-center justify-center">
          <BedDouble className="w-8 h-8 text-[#167a68]" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#0b4d3c]">Hospital not found</h2>
        <Link to="/hospitals" className="text-sm font-semibold text-[#167a68] hover:text-[#0b4d3c] underline underline-offset-2 transition-colors">
          Return to hospital directory
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fdfa] font-sans pb-16">
      {/* ── Header ── */}
      <div className="bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-xs sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center justify-between mb-3">
            <Link to="/" className="flex items-center gap-2">
              <img src="/healthhub-logo.png" alt="HealthHub" className="h-9 w-auto object-contain" />
            </Link>
            <Link
              to="/hospitals"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#167a68] hover:text-[#0b4d3c] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to hospital directory
            </Link>
          </div>

          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0b4d3c]">{hospital.name}</h1>
              <p className="text-slate-500 flex items-center mt-1 text-sm">
                <MapPin className="w-4 h-4 mr-1.5 text-emerald-600 shrink-0" />
                {hospital.address}
              </p>
              <p className="text-slate-500 flex items-center mt-1 text-sm">
                <Phone className="w-4 h-4 mr-1.5 text-emerald-600 shrink-0" />
                {hospital.phone}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                to={`/book-appointment?hospitalId=${hospital.id}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#167a68] hover:bg-[#116253] text-white text-sm font-semibold shadow-md shadow-[#167a68]/20 transition-all hover:scale-[1.02]"
              >
                <Calendar className="w-4 h-4" />
                Book Appointment
              </Link>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.location?.lat ?? ''},${hospital.location?.lng ?? ''}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border-2 border-[#167a68] text-[#167a68] hover:bg-[#167a68]/10 text-sm font-semibold transition-all"
              >
                <Map className="w-4 h-4" />
                Get Directions
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">

        {/* Beds Availability */}
        <section>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <BedDouble className="w-4 h-4 text-[#167a68]" />
            </div>
            <h2 className="font-serif text-xl font-bold text-[#0b4d3c]">Bed Availability</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {Object.entries(hospital.beds).map(([type, data]) => {
              const isCritical = data.available === 0;
              const isWarning = data.available > 0 && data.available <= 5;
              const colorClass = isCritical
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : isWarning
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-[#dff5ea] border-[#c2ebd5] text-[#0b4d3c]';

              return (
                <div key={type} className={`rounded-2xl border p-6 flex flex-col items-center justify-center text-center shadow-sm ${colorClass}`}>
                  <span className="text-xs font-bold uppercase tracking-wider mb-2 opacity-80">{type} Beds</span>
                  <span className="text-4xl font-extrabold">{data.available}</span>
                  <span className="text-xs mt-1 opacity-70">out of {data.total} total</span>
                </div>
              );
            })}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Blood Bank */}
          <section className="bg-white rounded-2xl shadow-sm border border-[#c8eedc] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#dff5ea] bg-[#f7fcf9] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center">
                  <Droplets className="w-4 h-4 text-rose-600" />
                </div>
                <h2 className="text-base font-bold text-[#0b4d3c]">Blood Bank Stock</h2>
              </div>
              {hospital.blood_bank && Object.keys(hospital.blood_bank).length > 0 && (
                <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                  Live Stock
                </span>
              )}
            </div>
            <div className="p-6">
              {hospital.blood_bank && Object.keys(hospital.blood_bank).length > 0 ? (
                <div className="grid grid-cols-4 gap-4">
                  {Object.entries(hospital.blood_bank).map(([group, units]) => (
                    <div key={group} className="text-center">
                      <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center font-bold text-sm mb-1.5 shadow-sm border border-rose-100 text-rose-600 bg-rose-50">
                        {group}
                      </div>
                      <div className="text-sm font-semibold text-slate-800">
                        {units} <span className="text-xs text-slate-500 font-normal">units</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 px-4">
                  <Droplets className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No Blood Bank Facility</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    This hospital does not operate an on-site blood bank repository. Please consult Bir Hospital or TUTH central blood banks.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* OPD Live Queue & Token Booking */}
          <div className="col-span-1 lg:col-span-2">
            <OPDQueue hospitalId={hospital.id} hospitalName={hospital.name} />
          </div>
        </div>

        {/* Ambulances */}
        <section className="bg-white rounded-2xl shadow-sm border border-[#c8eedc] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#dff5ea] bg-[#f7fcf9] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Ambulance className="w-4 h-4 text-[#167a68]" />
              </div>
              <h2 className="text-base font-bold text-[#0b4d3c]">Network Ambulances</h2>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-[#dff5ea] border border-[#c2ebd5] px-2.5 py-1 rounded-full">
              {hospital.ambulances.length} total
            </span>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {hospital.ambulances.map(amb => (
                <div key={amb.id} className="border border-[#c8eedc] rounded-xl p-4 flex items-center justify-between bg-[#f7fcf9] hover:bg-[#eef9f4] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#dff5ea] border border-[#c2ebd5] flex items-center justify-center text-xs font-bold text-[#167a68]">
                      #{amb.id}
                    </div>
                    <div className="text-sm font-semibold capitalize text-slate-800">{amb.status}</div>
                  </div>
                  <div className={`w-2.5 h-2.5 rounded-full ${amb.status === 'available' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default HospitalDetail;
