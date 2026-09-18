import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getHospitals } from '../../services/hospitalService';
import HospitalCard from '../../components/hospitals/HospitalCard';
import HospitalMap from '../../components/hospitals/HospitalMap';

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
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center">
               <a href="/" className="text-primary-600 hover:text-primary-700 mr-4">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
               </a>
               <h1 className="text-2xl font-bold text-gray-900">Find Hospital</h1>
            </div>
            
            <div className="flex w-full md:w-auto gap-2">
              <div className="relative flex-grow md:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                <input
                  type="text"
                  placeholder="Search name or location"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="block w-full md:w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md border"
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
              >
                <option value="">All Services</option>
                <option value="ICU">ICU</option>
                <option value="Emergency">Emergency</option>
                <option value="Blood Bank">Blood Bank</option>
                <option value="Maternity">Maternity</option>
              </select>
            </div>
            
            {/* Mobile View Toggle */}
            <div className="md:hidden w-full flex rounded-md shadow-sm">
              <button
                type="button"
                onClick={() => setMapActive(false)}
                className={`flex-1 relative inline-flex items-center justify-center px-4 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${!mapActive ? 'bg-primary-50 text-primary-700 z-10 border-primary-500' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                List
              </button>
              <button
                type="button"
                onClick={() => setMapActive(true)}
                className={`flex-1 relative inline-flex items-center justify-center px-4 py-2 rounded-r-md border border-gray-300 text-sm font-medium -ml-px ${mapActive ? 'bg-primary-50 text-primary-700 z-10 border-primary-500' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                Map
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* List View (Left Side on Desktop, Toggled on Mobile) */}
        <div className={`w-full md:w-1/2 lg:w-5/12 xl:w-1/3 flex-col bg-white overflow-y-auto ${mapActive ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 sm:p-6">
            <div className="mb-4 text-sm text-gray-500 font-medium">
              {isLoading ? 'Searching...' : `Found ${hospitals.length} hospitals`}
            </div>
            
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                   <div key={i} className="animate-pulse bg-gray-100 h-40 rounded-xl"></div>
                ))}
              </div>
            ) : hospitals.length > 0 ? (
              <div className="space-y-4">
                {hospitals.map(hospital => (
                  <HospitalCard key={hospital.id} hospital={hospital} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hospitals found</h3>
                <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters.</p>
              </div>
            )}
          </div>
        </div>

        {/* Map View (Right Side on Desktop, Toggled on Mobile) */}
        <div className={`w-full md:w-1/2 lg:w-7/12 xl:w-2/3 flex-1 relative ${!mapActive ? 'hidden md:block' : 'block'}`}>
          <HospitalMap hospitals={hospitals} />
        </div>
      </div>
    </div>
  );
};

export default HospitalList;
