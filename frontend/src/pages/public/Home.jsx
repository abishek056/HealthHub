import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    const query = e.target.search.value;
    navigate(`/hospitals?search=${encodeURIComponent(query)}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <svg className="w-8 h-8 text-primary-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-4H5v-2h4V7h2v4h4v2h-4v4z"/></svg>
              <span className="ml-2 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-700 to-primary-500">
                HealthHub
              </span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link to="/hospitals" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">Find Hospital</Link>
              <a href="#services" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">Services</a>
              <Link to="/login" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">Partner Login</Link>
            </nav>
            <div className="md:hidden">
               {/* Mobile menu button could go here */}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <div className="relative overflow-hidden bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32 pt-16 sm:pt-24 lg:pt-32 px-4 sm:px-6 lg:px-8">
              <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block xl:inline">Emergency Care,</span>{' '}
                <span className="block text-primary-600 xl:inline">Simplified.</span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                Real-time tracking for hospital beds, ambulances, and blood availability. Find the right care when every second counts.
              </p>
              
              <div className="mt-8 sm:max-w-lg sm:mx-auto lg:mx-0">
                <form onSubmit={handleSearch} className="flex bg-white rounded-full shadow-lg p-2 border border-gray-100 focus-within:ring-2 focus-within:ring-primary-500 transition-all">
                  <div className="flex-grow flex items-center pl-4">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    <input type="text" name="search" placeholder="Search hospitals by name or location..." className="w-full pl-3 pr-3 py-2 border-transparent text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0 sm:text-sm bg-transparent" />
                  </div>
                  <button type="submit" className="ml-3 inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-primary-600 hover:bg-primary-700 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5">
                    Search
                  </button>
                </form>
              </div>
            </div>
          </div>
          <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 bg-gray-50">
            <div className="h-56 w-full sm:h-72 md:h-96 lg:w-full lg:h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-secondary-50 relative overflow-hidden">
                {/* Decorative background elements instead of generic img */}
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse"></div>
                <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-secondary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse" style={{ animationDelay: '2s' }}></div>
                <div className="relative z-10 flex flex-col items-center">
                   <svg className="w-32 h-32 text-primary-500 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                   <div className="mt-4 bg-white/80 backdrop-blur rounded-full px-6 py-2 text-primary-900 font-bold shadow-sm border border-white/40">Connected Care Network</div>
                </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="services" className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">Features</h2>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Everything you need in an emergency
              </p>
            </div>

            <div className="mt-16">
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                
                {/* Feature 1 */}
                <div className="pt-6">
                  <div className="flow-root bg-white rounded-2xl px-6 pb-8 shadow-sm hover:shadow-xl transition-shadow duration-300 border border-gray-100 h-full transform hover:-translate-y-1">
                    <div className="-mt-6">
                      <div>
                        <span className="inline-flex items-center justify-center p-3 bg-blue-500 rounded-xl shadow-lg">
                          <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                        </span>
                      </div>
                      <h3 className="mt-8 text-lg font-bold text-gray-900 tracking-tight">Live Bed Tracker</h3>
                      <p className="mt-5 text-base text-gray-500">
                        Check real-time availability of ICU, Emergency, and General beds across all network hospitals.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="pt-6">
                  <div className="flow-root bg-white rounded-2xl px-6 pb-8 shadow-sm hover:shadow-xl transition-shadow duration-300 border border-gray-100 h-full transform hover:-translate-y-1">
                    <div className="-mt-6">
                      <div>
                        <span className="inline-flex items-center justify-center p-3 bg-red-500 rounded-xl shadow-lg">
                          <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                        </span>
                      </div>
                      <h3 className="mt-8 text-lg font-bold text-gray-900 tracking-tight">GPS Ambulance</h3>
                      <p className="mt-5 text-base text-gray-500">
                        Request an ambulance and track its live location on the map as it approaches your destination.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="pt-6">
                  <div className="flow-root bg-white rounded-2xl px-6 pb-8 shadow-sm hover:shadow-xl transition-shadow duration-300 border border-gray-100 h-full transform hover:-translate-y-1">
                    <div className="-mt-6">
                      <div>
                        <span className="inline-flex items-center justify-center p-3 bg-green-500 rounded-xl shadow-lg">
                          <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </span>
                      </div>
                      <h3 className="mt-8 text-lg font-bold text-gray-900 tracking-tight">OPD Queue</h3>
                      <p className="mt-5 text-base text-gray-500">
                        View current OPD queues by department to save waiting time at the hospital.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Feature 4 */}
                <div className="pt-6">
                  <div className="flow-root bg-white rounded-2xl px-6 pb-8 shadow-sm hover:shadow-xl transition-shadow duration-300 border border-gray-100 h-full transform hover:-translate-y-1">
                    <div className="-mt-6">
                      <div>
                        <span className="inline-flex items-center justify-center p-3 bg-purple-500 rounded-xl shadow-lg">
                          <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                        </span>
                      </div>
                      <h3 className="mt-8 text-lg font-bold text-gray-900 tracking-tight">Blood Donor</h3>
                      <p className="mt-5 text-base text-gray-500">
                        Check real-time blood bank stock levels across different hospitals for your required group.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Emergency Button */}
      <button 
        onClick={() => alert("Calling Emergency Services (102)...")}
        className="fixed bottom-8 right-8 bg-red-600 text-white p-4 rounded-full shadow-2xl hover:bg-red-700 hover:scale-105 transition-all focus:outline-none focus:ring-4 focus:ring-red-500 focus:ring-opacity-50 z-50 group flex items-center justify-center animate-bounce"
        aria-label="Emergency Call"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out font-bold whitespace-nowrap group-hover:ml-3">
          EMERGENCY
        </span>
      </button>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-auto">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center">
                 <svg className="w-6 h-6 text-primary-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-4H5v-2h4V7h2v4h4v2h-4v4z"/></svg>
                 <span className="ml-2 text-lg font-bold text-white">HealthHub</span>
              </div>
              <p className="mt-4 text-sm text-gray-400">
                Transforming emergency healthcare access through real-time data and tracking.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300">Quick Links</h3>
              <ul className="mt-4 space-y-2 text-sm text-gray-400">
                <li><Link to="/hospitals" className="hover:text-white transition-colors">Find Hospitals</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Hospital Login</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300">Legal</h3>
              <ul className="mt-4 space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
            <p>&copy; 2026 Swasthya Sahayak (HealthHub). All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
