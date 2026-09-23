import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getHospitals } from '../../services/hospitalService';
import HospitalCard from '../../components/hospitals/HospitalCard';
import HospitalMap from '../../components/hospitals/HospitalMap';
import { Search, List, Map, SlidersHorizontal } from 'lucide-react';

const SERVICES = ['ICU', 'Emergency', 'Blood Bank', 'Maternity', 'Pediatrics', 'Cardiology'];

const HospitalList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [hospitals, setHospitals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const initialSearch = searchParams.get('search') || '';
  const initialService = searchParams.get('service') || '';

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedService, setSelectedService] = useState(initialService);
  const [mapActive, setMapActive] = useState(false); // For mobile toggle

  useEffect(() => {
    const fetchHospitals = async () => {
      setIsLoading(true);
      try {
        const filters = {};
        if (searchTerm) filters.search = searchTerm;
        if (selectedService) filters.service = selectedService;

        const data = await getHospitals(filters);
        setHospitals(data);
      } catch (error) {
        console.error("Failed to fetch hospitals", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce search slightly
    const timer = setTimeout(() => {
      fetchHospitals();

      // Update URL params
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedService) params.service = selectedService;
      setSearchParams(params);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedService, setSearchParams]);

  return (
    <div className="min-h-screen bg-[#f8fdfa] flex flex-col font-sans">
      {/* ── Search Header ── */}
      <div className="bg-white/95 backdrop-blur-md border-b border-emerald-100 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">

            {/* Brand & Title */}
            <div className="flex items-center gap-3 self-start md:self-center">
              <Link to="/" className="flex items-center gap-2">
                <img
                  src="/healthhub-logo.png"
                  alt="HealthHub"
                  className="h-9 sm:h-10 w-auto object-contain"
                />
              </Link>
              <span className="text-slate-400">/</span>
              <h1 className="font-serif text-lg sm:text-xl font-bold text-[#0b4d3c]">
                Find Hospitals
              </h1>
            </div>

            {/* Search & Filter Controls */}
            <div className="flex w-full md:w-auto gap-2">
              {/* Search Input */}
              <div className="relative flex-grow md:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-emerald-600" />
                </div>
                <input
                  type="text"
                  placeholder="Search name, city..."
                  className="block w-full pl-10 pr-3 py-2.5 border border-[#c8eedc] rounded-xl bg-[#f7fcf9] text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#167a68] focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Service Filter */}
              <div className="relative">
                <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600 pointer-events-none" />
                <select
                  className="block pl-9 pr-8 py-2.5 text-sm border border-[#c8eedc] rounded-xl bg-[#f7fcf9] text-slate-700 focus:outline-none focus:border-[#167a68] focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none cursor-pointer"
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                >
                  <option value="">All Services</option>
                  {SERVICES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mobile View Toggle */}
            <div className="md:hidden w-full flex rounded-xl overflow-hidden border border-[#c8eedc]">
              <button
                type="button"
                onClick={() => setMapActive(false)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold transition-all ${
                  !mapActive
                    ? 'bg-[#167a68] text-white'
                    : 'bg-[#f7fcf9] text-slate-600 hover:bg-[#eef9f4]'
                }`}
              >
                <List className="w-3.5 h-3.5" /> List
              </button>
              <button
                type="button"
                onClick={() => setMapActive(true)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold transition-all ${
                  mapActive
                    ? 'bg-[#167a68] text-white'
                    : 'bg-[#f7fcf9] text-slate-600 hover:bg-[#eef9f4]'
                }`}
              >
                <Map className="w-3.5 h-3.5" /> Map
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* List Panel */}
        <div className={`w-full md:w-1/2 lg:w-5/12 xl:w-1/3 flex-col bg-[#f8fdfa] overflow-y-auto border-r border-emerald-100 ${mapActive ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 sm:p-6">
            {/* Result Count */}
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#167a68] bg-[#dff5ea] border border-[#c2ebd5] px-3 py-1 rounded-full">
                {isLoading ? 'Searching...' : `${hospitals.length} hospitals found`}
              </span>
              {selectedService && (
                <button
                  onClick={() => setSelectedService('')}
                  className="text-xs text-slate-500 hover:text-rose-600 font-medium transition-colors"
                >
                  Clear filter ✕
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse bg-[#dff5ea]/60 h-36 rounded-2xl border border-[#c8eedc]" />
                ))}
              </div>
            ) : hospitals.length > 0 ? (
              <div className="space-y-4">
                {hospitals.map(hospital => (
                  <HospitalCard key={hospital.id} hospital={hospital} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto rounded-full bg-[#dff5ea] flex items-center justify-center mb-4">
                  <Search className="w-7 h-7 text-[#167a68]" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#0b4d3c]">No hospitals found</h3>
                <p className="mt-1.5 text-sm text-slate-500">Try adjusting your search or filters.</p>
                <button
                  onClick={() => { setSearchTerm(''); setSelectedService(''); }}
                  className="mt-4 text-xs font-semibold text-[#167a68] hover:text-[#0b4d3c] underline underline-offset-2 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Map Panel */}
        <div className={`w-full md:w-1/2 lg:w-7/12 xl:w-2/3 flex-1 relative ${!mapActive ? 'hidden md:block' : 'block'}`}>
          <HospitalMap hospitals={hospitals} />
        </div>
      </div>
    </div>
  );
};

export default HospitalList;
