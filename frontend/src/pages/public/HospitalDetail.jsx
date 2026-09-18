import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getHospitalById } from '../../services/hospitalService';

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
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>;
  }

  if (!hospital) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center flex-col">
       <h2 className="text-2xl font-bold text-gray-900 mb-2">Hospital not found</h2>
       <Link to="/hospitals" className="text-primary-600 hover:underline">Return to directory</Link>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
           <Link to="/hospitals" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-primary-600 mb-2 transition-colors">
              <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Back to list
           </Link>
           <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div>
                 <h1 className="text-3xl font-bold text-gray-900">{hospital.name}</h1>
                 <p className="text-gray-500 flex items-center mt-1">
                    <svg className="w-5 h-5 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    {hospital.address}
                 </p>
                 <p className="text-gray-500 flex items-center mt-1">
                    <svg className="w-5 h-5 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                    {hospital.phone}
                 </p>
              </div>
              <a 
                 href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.location.lat},${hospital.location.lng}`}
                 target="_blank"
                 rel="noreferrer"
                 className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                 <svg className="mr-2 -ml-1 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                 Get Directions
              </a>
           </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {/* Beds Availability */}
        <section>
           <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
             <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
             Bed Availability
           </h2>
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
             {Object.entries(hospital.beds).map(([type, data]) => {
                const isCritical = data.available === 0;
                const isWarning = data.available > 0 && data.available <= 5;
                const colorClass = isCritical ? 'bg-red-50 text-red-700 border-red-200' : isWarning ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-green-50 text-green-700 border-green-200';
                
                return (
                  <div key={type} className={`rounded-xl border p-6 flex flex-col items-center justify-center text-center shadow-sm ${colorClass}`}>
                    <span className="text-sm font-semibold uppercase tracking-wider mb-2 opacity-80">{type} Beds</span>
                    <span className="text-4xl font-extrabold">{data.available}</span>
                    <span className="text-xs mt-1 opacity-75">out of {data.total} total</span>
                  </div>
                );
             })}
           </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Blood Bank */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center">
               <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
               <h2 className="text-lg font-bold text-gray-900">Blood Bank Stock</h2>
             </div>
             <div className="p-6">
                <div className="grid grid-cols-4 gap-4">
                  {Object.entries(hospital.blood_bank).map(([group, units]) => (
                     <div key={group} className="text-center">
                        <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center font-bold text-lg mb-1 shadow-sm border border-red-100 text-red-600 bg-red-50">
                           {group}
                        </div>
                        <div className="text-sm font-medium text-gray-900">{units} <span className="text-xs text-gray-500 font-normal">units</span></div>
                     </div>
                  ))}
                </div>
             </div>
          </section>

          {/* OPD Queue */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center">
               <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
               <h2 className="text-lg font-bold text-gray-900">OPD Live Queue</h2>
             </div>
             <div className="p-0">
               <ul className="divide-y divide-gray-200">
                 {Object.entries(hospital.opd_queue).map(([dept, waiting]) => (
                   <li key={dept} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                     <span className="text-sm font-medium text-gray-900">{dept}</span>
                     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                       {waiting} waiting
                     </span>
                   </li>
                 ))}
               </ul>
             </div>
          </section>
        </div>

        {/* Ambulances */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
               <div className="flex items-center">
                 <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"></path></svg>
                 <h2 className="text-lg font-bold text-gray-900">Network Ambulances</h2>
               </div>
               <span className="text-sm text-gray-500 font-medium">{hospital.ambulances.length} total</span>
             </div>
             <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                   {hospital.ambulances.map(amb => (
                      <div key={amb.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                         <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 mr-3">
                               #{amb.id}
                            </div>
                            <div className="text-sm font-medium capitalize text-gray-900">{amb.status}</div>
                         </div>
                         <div className={`w-3 h-3 rounded-full ${amb.status === 'available' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
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
