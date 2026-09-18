import { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Loader, RefreshCw, Droplets, AlertCircle } from 'lucide-react';
import BloodBankCard from './BloodBankCard';
import DonorList from './DonorList';
import RequestDonorModal from './RequestDonorModal';
import { fetchBloodBanks, fetchDonors } from '../../services/bloodService';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function BloodBankFinder() {
  const [bloodGroup, setBloodGroup]     = useState('');
  const [banks, setBanks]               = useState([]);
  const [donors, setDonors]             = useState([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [loadingDonors, setLoadingDonors] = useState(false);
  const [coords, setCoords]             = useState(null);
  const [locating, setLocating]         = useState(false);
  const [locationLabel, setLocationLabel] = useState('');
  const [activeTab, setActiveTab]       = useState('banks'); // 'banks' | 'donors'
  const [modalOpen, setModalOpen]       = useState(false);
  const [modalGroup, setModalGroup]     = useState('');
  const [error, setError]               = useState('');

  // ── Load blood banks ────────────────────────────────────────────────────────
  const loadBanks = useCallback(async () => {
    setLoadingBanks(true);
    setError('');
    const params = {};
    if (bloodGroup)          params.blood_group = bloodGroup;
    if (coords) {
      params.latitude  = coords.lat;
      params.longitude = coords.lon;
      params.radius    = 50;
    }
    const data = await fetchBloodBanks(params);
    setBanks(Array.isArray(data) ? data : []);
    setLoadingBanks(false);
  }, [bloodGroup, coords]);

  // ── Load donors ─────────────────────────────────────────────────────────────
  const loadDonors = useCallback(async () => {
    setLoadingDonors(true);
    const params = {};
    if (bloodGroup)          params.blood_group = bloodGroup;
    if (coords) {
      params.latitude  = coords.lat;
      params.longitude = coords.lon;
      params.radius    = 30;
    }
    const data = await fetchDonors(params);
    setDonors(Array.isArray(data) ? data : []);
    setLoadingDonors(false);
  }, [bloodGroup, coords]);

  useEffect(() => { loadBanks(); }, [loadBanks]);
  useEffect(() => {
    if (activeTab === 'donors') loadDonors();
  }, [activeTab, loadDonors]);

  // ── GPS ─────────────────────────────────────────────────────────────────────
  const getLocation = () => {
    if (!navigator.geolocation) return alert('Geolocation not supported.');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lon: longitude });
        setLocationLabel(`${latitude.toFixed(3)}, ${longitude.toFixed(3)}`);
        setLocating(false);
      },
      () => { setLocating(false); alert('Location permission denied.'); }
    );
  };

  const clearLocation = () => {
    setCoords(null);
    setLocationLabel('');
  };

  // ── Open request modal ───────────────────────────────────────────────────────
  const handleRequestDonor = (group = '') => {
    setModalGroup(group || bloodGroup);
    setModalOpen(true);
  };

  // Sorted: stock desc, then distance asc
  const sortedBanks = [...banks].sort((a, b) => {
    if (a.distance_km != null && b.distance_km != null)
      return a.distance_km - b.distance_km;
    return (b.units_available ?? 0) - (a.units_available ?? 0);
  });

  const stockWarning = banks.length > 0 && banks.every(b => (b.units_available ?? 0) === 0);

  return (
    <div className="bbf-wrap">
      {/* ── Header ── */}
      <div className="bbf-header">
        <div className="bbf-title-row">
          <Droplets size={22} color="#ef5350" />
          <h2 className="bbf-title">Blood Bank Finder</h2>
        </div>
        <p className="bbf-subtitle">Find blood availability and nearby donors in real time</p>
      </div>

      {/* ── Filters ── */}
      <div className="bbf-filters">
        {/* Blood group selector */}
        <div className="bbf-group-pills">
          <button
            className={`bbf-pill ${bloodGroup === '' ? 'bbf-pill--active' : ''}`}
            onClick={() => setBloodGroup('')}
          >All</button>
          {BLOOD_GROUPS.map(g => (
            <button
              key={g}
              className={`bbf-pill ${bloodGroup === g ? 'bbf-pill--active' : ''}`}
              onClick={() => setBloodGroup(g === bloodGroup ? '' : g)}
            >{g}</button>
          ))}
        </div>

        {/* Location row */}
        <div className="bbf-loc-row">
          {coords ? (
            <div className="bbf-loc-set">
              <MapPin size={14} color="#4caf50" />
              <span>{locationLabel}</span>
              <button className="bbf-loc-clear" onClick={clearLocation}>✕</button>
            </div>
          ) : (
            <button className="bbf-loc-btn" onClick={getLocation} disabled={locating}>
              {locating ? <Loader size={14} className="spin" /> : <MapPin size={14} />}
              {locating ? 'Locating…' : 'Use my location'}
            </button>
          )}

          <button
            className="bbf-refresh-btn"
            onClick={activeTab === 'banks' ? loadBanks : loadDonors}
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* ── Stock warning ── */}
      {stockWarning && !loadingBanks && (
        <div className="bbf-warning">
          <AlertCircle size={16} />
          All blood banks are currently out of stock for this group.
          <button className="bbf-warn-btn" onClick={() => handleRequestDonor()}>
            Find Donors Instead
          </button>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="bbf-tabs">
        <button
          className={`bbf-tab ${activeTab === 'banks' ? 'bbf-tab--active' : ''}`}
          onClick={() => setActiveTab('banks')}
        >
          Blood Banks {!loadingBanks && `(${sortedBanks.length})`}
        </button>
        <button
          className={`bbf-tab ${activeTab === 'donors' ? 'bbf-tab--active' : ''}`}
          onClick={() => setActiveTab('donors')}
        >
          Donors {!loadingDonors && `(${donors.length})`}
        </button>
        <button
          className="bbf-request-btn"
          onClick={() => handleRequestDonor()}
        >
          <Droplets size={14} /> Request Donor
        </button>
      </div>

      {/* ── Content ── */}
      <div className="bbf-content">
        {activeTab === 'banks' && (
          loadingBanks
            ? <div className="bbf-skeleton-list">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bbf-skeleton" />
                ))}
              </div>
            : sortedBanks.length === 0
              ? <div className="bbf-empty">
                  <Droplets size={36} opacity={0.2} />
                  <p>No blood banks found{bloodGroup ? ` with ${bloodGroup}` : ''}.</p>
                </div>
              : <div className="bbf-list">
                  {sortedBanks.map(b => (
                    <BloodBankCard
                      key={b.id ?? b.blood_group}
                      bank={b}
                      onRequestDonor={handleRequestDonor}
                    />
                  ))}
                </div>
        )}

        {activeTab === 'donors' && (
          <DonorList donors={donors} loading={loadingDonors} bloodGroup={bloodGroup} />
        )}
      </div>

      {/* ── Request Modal ── */}
      <RequestDonorModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultBloodGroup={modalGroup}
      />

      <style>{`
        .bbf-wrap { display:flex; flex-direction:column; gap:1.25rem; }
        .bbf-header {}
        .bbf-title-row { display:flex; align-items:center; gap:.6rem; margin-bottom:.25rem; }
        .bbf-title { font-size:1.4rem; font-weight:800; color:#fff; margin:0; }
        .bbf-subtitle { font-size:.85rem; color:rgba(255,255,255,.45); margin:0; }

        .bbf-filters { display:flex; flex-direction:column; gap:.75rem; }
        .bbf-group-pills { display:flex; flex-wrap:wrap; gap:.4rem; }
        .bbf-pill {
          padding:.3rem .7rem; border-radius:999px; border:1px solid rgba(255,255,255,.15);
          background:transparent; color:rgba(255,255,255,.6); font-size:.78rem; font-weight:600;
          cursor:pointer; transition:all .15s;
        }
        .bbf-pill:hover { background:rgba(255,255,255,.1); color:#fff; }
        .bbf-pill--active { background:#ef5350; border-color:#ef5350; color:#fff; }

        .bbf-loc-row { display:flex; align-items:center; gap:.6rem; }
        .bbf-loc-btn {
          display:inline-flex; align-items:center; gap:.4rem;
          background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.12);
          border-radius:9px; color:rgba(255,255,255,.75); padding:.4rem .9rem;
          font-size:.82rem; cursor:pointer; transition:background .15s;
        }
        .bbf-loc-btn:hover { background:rgba(255,255,255,.12); }
        .bbf-loc-btn:disabled { opacity:.5; cursor:not-allowed; }
        .bbf-loc-set {
          display:inline-flex; align-items:center; gap:.45rem;
          background:rgba(76,175,80,.1); border:1px solid rgba(76,175,80,.3);
          border-radius:9px; padding:.35rem .9rem; font-size:.8rem; color:rgba(255,255,255,.75);
        }
        .bbf-loc-clear { background:none; border:none; color:rgba(255,255,255,.4); cursor:pointer; padding:0; font-size:.9rem; }
        .bbf-loc-clear:hover { color:#fff; }
        .bbf-refresh-btn {
          margin-left:auto;
          background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.12);
          border-radius:9px; width:34px; height:34px; display:flex; align-items:center; justify-content:center;
          color:rgba(255,255,255,.6); cursor:pointer;
        }
        .bbf-refresh-btn:hover { background:rgba(255,255,255,.12); color:#fff; }

        .bbf-warning {
          display:flex; align-items:center; gap:.6rem; flex-wrap:wrap;
          background:rgba(255,160,0,.1); border:1px solid rgba(255,160,0,.25);
          border-radius:12px; padding:.75rem 1rem;
          font-size:.83rem; color:#ffd54f;
        }
        .bbf-warn-btn {
          margin-left:auto; background:rgba(255,160,0,.2); border:1px solid rgba(255,160,0,.35);
          border-radius:7px; color:#ffd54f; padding:.3rem .7rem; font-size:.78rem;
          font-weight:600; cursor:pointer;
        }

        .bbf-tabs {
          display:flex; align-items:center; gap:.5rem;
          border-bottom:1px solid rgba(255,255,255,.08); padding-bottom:.75rem;
        }
        .bbf-tab {
          background:none; border:none; color:rgba(255,255,255,.45);
          font-size:.88rem; font-weight:600; padding:.35rem .6rem;
          cursor:pointer; border-radius:8px; transition:all .15s;
        }
        .bbf-tab:hover { color:#fff; background:rgba(255,255,255,.07); }
        .bbf-tab--active { color:#fff; background:rgba(255,255,255,.1); }
        .bbf-request-btn {
          margin-left:auto; display:inline-flex; align-items:center; gap:.4rem;
          background:linear-gradient(135deg,#ef5350,#b71c1c);
          border:none; border-radius:9px; color:#fff;
          padding:.4rem .9rem; font-size:.8rem; font-weight:700; cursor:pointer;
        }

        .bbf-content {}
        .bbf-list { display:flex; flex-direction:column; gap:.75rem; }
        .bbf-skeleton-list { display:flex; flex-direction:column; gap:.75rem; }
        .bbf-skeleton {
          height:96px; border-radius:14px;
          background:linear-gradient(90deg,rgba(255,255,255,.04) 25%,rgba(255,255,255,.08) 50%,rgba(255,255,255,.04) 75%);
          background-size:200% 100%; animation:shimmer 1.4s infinite;
        }
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        .bbf-empty {
          display:flex; flex-direction:column; align-items:center; gap:.6rem;
          padding:3rem 0; color:rgba(255,255,255,.3); text-align:center;
        }
        .bbf-empty p { margin:0; font-size:.9rem; }
        .spin { animation:spin 1s linear infinite; }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
