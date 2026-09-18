import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getOPDQueues } from '../../services/opdService';
import useWebSocket from '../../hooks/useWebSocket';
import TokenBookingModal from './TokenBookingModal';

// ─── Crowd Level Colors & Badge Config ───────────────────────────────────────
const CROWD_CONFIG = {
  low: {
    label: 'Low Crowd',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    cardBorder: 'hover:border-emerald-300',
    dot: 'bg-emerald-500',
    progress: 'bg-emerald-500',
    barBg: 'bg-emerald-100',
  },
  medium: {
    label: 'Moderate',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    cardBorder: 'hover:border-amber-300',
    dot: 'bg-amber-500',
    progress: 'bg-amber-500',
    barBg: 'bg-amber-100',
  },
  high: {
    label: 'High Crowd',
    badge: 'bg-rose-100 text-rose-800 border-rose-200',
    cardBorder: 'hover:border-rose-300',
    dot: 'bg-rose-500',
    progress: 'bg-rose-500',
    barBg: 'bg-rose-100',
  },
};

// ─── Relative time helper ───────────────────────────────────────────────────
const getRelativeTime = (timestamp) => {
  if (!timestamp) return 'Just now';
  const diffSec = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr}h ago`;
};

// ─── Department Icon Mapping ────────────────────────────────────────────────
const getDepartmentIcon = (deptName = '') => {
  const name = deptName.toLowerCase();
  if (name.includes('cardio')) {
    return (
      <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    );
  }
  if (name.includes('ortho')) {
    return (
      <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
      </svg>
    );
  }
  if (name.includes('pediatric')) {
    return (
      <svg className="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  if (name.includes('gyne') || name.includes('maternity')) {
    return (
      <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    );
  }
  if (name.includes('surg')) {
    return (
      <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879a3 3 0 11-4.242-4.242L10.758 10.758m0 0l2.879-2.879a3 3 0 114.242 4.242L14.121 14.121z" />
      </svg>
    );
  }
  // Default general medicine icon
  return (
    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
};

const OPDQueue = ({
  hospitalId = 1,
  hospitalName = 'Hospital',
  className = '',
}) => {
  const [queues, setQueues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCrowd, setSelectedCrowd] = useState('all');
  const [bookingDepartment, setBookingDepartment] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [, setTick] = useState(0);

  // Fetch initial OPD queue data
  useEffect(() => {
    let active = true;
    getOPDQueues(hospitalId)
      .then((data) => {
        if (active) {
          setQueues(Array.isArray(data) ? data : []);
          setLastUpdated(new Date());
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('[OPDQueue] Failed to load OPD queues:', err);
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [hospitalId]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const data = await getOPDQueues(hospitalId);
      setQueues(Array.isArray(data) ? data : []);
      setLastUpdated(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  // Tick timer for relative time updates every 30s
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  // WebSocket live updates handler
  const handleWsMessage = useCallback((payload) => {
    if (!payload) return;
    setQueues((prevQueues) => {
      const idx = prevQueues.findIndex(
        (q) => q.department?.toLowerCase() === payload.department?.toLowerCase()
      );
      if (idx !== -1) {
        const updated = [...prevQueues];
        updated[idx] = {
          ...updated[idx],
          current_token: payload.current_token ?? updated[idx].current_token,
          estimated_wait_mins: payload.estimated_wait_mins ?? updated[idx].estimated_wait_mins,
          crowd_level: payload.crowd_level ?? updated[idx].crowd_level,
          last_updated: payload.last_updated ?? new Date().toISOString(),
        };
        return updated;
      }
      return [...prevQueues, payload];
    });
    setLastUpdated(new Date());
  }, []);

  const { isConnected } = useWebSocket(
    `hospital.${hospitalId}`,
    'OPDQueueUpdated',
    handleWsMessage
  );

  // Filter queues
  const filteredQueues = useMemo(() => {
    return queues.filter((q) => {
      const matchSearch =
        !searchQuery ||
        q.department?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCrowd =
        selectedCrowd === 'all' || q.crowd_level === selectedCrowd;
      return matchSearch && matchCrowd;
    });
  }, [queues, searchQuery, selectedCrowd]);

  // Stats calculation
  const totalWaiting = useMemo(
    () => queues.reduce((acc, q) => acc + (q.current_token || 0), 0),
    [queues]
  );
  const avgWait = useMemo(() => {
    if (!queues.length) return 0;
    const totalMins = queues.reduce(
      (acc, q) => acc + (q.estimated_wait_mins || 0),
      0
    );
    return Math.round(totalMins / queues.length);
  }, [queues]);

  const handleTokenBooked = (result) => {
    // Optimistically bump current token for that department
    setQueues((prev) =>
      prev.map((q) =>
        q.department === result.department
          ? {
              ...q,
              current_token: result.token_number,
              estimated_wait_mins: result.estimated_wait_mins,
              last_updated: new Date().toISOString(),
            }
          : q
      )
    );
    setLastUpdated(new Date());
  };

  return (
    <div className={`bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden font-sans ${className}`}>
      {/* ─── Header ─── */}
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 via-white to-sky-50/30">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                OPD Live Queue & Token Booking
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {hospitalName} · Real-time queue counters with automatic SMS confirmation
            </p>
          </div>

          {/* Live Indicator & Refresh */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-xs">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'
                }`}
              />
              <span
                className={`text-xs font-semibold ${
                  isConnected ? 'text-emerald-700' : 'text-gray-500'
                }`}
              >
                {isConnected ? 'Live WebSocket' : 'Polling'}
              </span>
            </div>

            <span className="text-xs text-gray-400 hidden sm:inline">
              Updated {getRelativeTime(lastUpdated)}
            </span>

            <button
              onClick={handleRefresh}
              title="Refresh queue"
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* ─── Metric Chips ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
          <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <span className="text-[11px] text-gray-400 font-medium block">Departments</span>
              <span className="text-lg font-bold text-gray-900">{queues.length} Active</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <span className="text-[11px] text-gray-400 font-medium block">Total Served / Queue</span>
              <span className="text-lg font-bold text-gray-900">{totalWaiting} Tokens</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-xs flex items-center gap-3 col-span-2 sm:col-span-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <span className="text-[11px] text-gray-400 font-medium block">Avg. Wait Time</span>
              <span className="text-lg font-bold text-gray-900">~{avgWait} mins</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Search and Filters Bar ─── */}
      <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-center justify-between bg-gray-50/40">
        <div className="relative w-full sm:w-72">
          <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search department..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Crowd Filter Pills */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <span className="text-xs text-gray-400 font-medium mr-1 hidden md:inline">Filter:</span>
          {['all', 'low', 'medium', 'high'].map((level) => (
            <button
              key={level}
              onClick={() => setSelectedCrowd(level)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition cursor-pointer shrink-0 ${
                selectedCrowd === level
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {level === 'all' ? 'All Wards' : level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Department Queue Grid ─── */}
      <div className="p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-44 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredQueues.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredQueues.map((queue) => {
              const crowd = CROWD_CONFIG[queue.crowd_level] || CROWD_CONFIG.low;
              const waitMins = queue.estimated_wait_mins || 15;

              return (
                <div
                  key={queue.id || queue.department}
                  className={`group rounded-2xl border border-gray-200 p-5 bg-white shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between ${crowd.cardBorder}`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 group-hover:bg-primary-50 transition-colors">
                          {getDepartmentIcon(queue.department)}
                        </div>
                        <h3 className="font-bold text-gray-900 text-base truncate">
                          {queue.department}
                        </h3>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border shrink-0 ${crowd.badge}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${crowd.dot}`} />
                        {crowd.label}
                      </span>
                    </div>

                    {/* Token Number & Wait Time Display */}
                    <div className="bg-gray-50/70 rounded-xl p-3 border border-gray-100 flex items-center justify-between mb-4">
                      <div>
                        <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold block">
                          Current Token
                        </span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-3xl font-black text-gray-900 tracking-tight">
                            #{queue.current_token || 0}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold block">
                          Est. Wait Time
                        </span>
                        <div className="flex items-center gap-1 text-sm font-bold text-gray-700 mt-1 justify-end">
                          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>~{waitMins} mins</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Book Token Button */}
                  <button
                    onClick={() => setBookingDepartment(queue.department)}
                    className="w-full mt-2 py-2.5 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 active:scale-98 text-white font-semibold text-xs transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Book Token
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-14 h-14 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-base font-bold text-gray-800">No departments match your search</h4>
            <p className="text-xs text-gray-500 mt-1">Try resetting the crowd filter or searching for another clinic.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCrowd('all');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 transition"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* ─── Token Booking Modal ─── */}
      <TokenBookingModal
        isOpen={Boolean(bookingDepartment)}
        department={bookingDepartment || ''}
        hospitalId={hospitalId}
        hospitalName={hospitalName}
        onClose={() => setBookingDepartment(null)}
        onTokenBooked={handleTokenBooked}
      />
    </div>
  );
};

export default OPDQueue;
