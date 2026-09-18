import { useState, useEffect } from 'react';
import { X, Droplets, MapPin, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { requestBloodDonors } from '../../services/bloodService';
import DonorList from './DonorList';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function RequestDonorModal({ isOpen, onClose, defaultBloodGroup = '' }) {
  const [bloodGroup, setBloodGroup] = useState(defaultBloodGroup);
  const [radius, setRadius]         = useState(25);
  const [donors, setDonors]         = useState([]);
  const [loading, setLoading]       = useState(false);
  const [searched, setSearched]     = useState(false);
  const [locating, setLocating]     = useState(false);
  const [coords, setCoords]         = useState(null);
  const [message, setMessage]       = useState('');

  // Sync default blood group when prop changes
  useEffect(() => { setBloodGroup(defaultBloodGroup); }, [defaultBloodGroup]);

  // Close on Escape
  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const getLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocating(false);
      },
      () => { setLocating(false); alert('Location access denied.'); }
    );
  };

  const handleSearch = async () => {
    if (!bloodGroup) return alert('Please select a blood group.');
    setLoading(true);
    setSearched(false);
    const payload = {
      blood_group: bloodGroup,
      radius,
      ...(coords ? { latitude: coords.lat, longitude: coords.lon } : {}),
    };
    const result = await requestBloodDonors(payload);
    setDonors(Array.isArray(result?.donors?.data) ? result.donors.data
              : Array.isArray(result?.donors) ? result.donors : []);
    setMessage(result?.message ?? '');
    setLoading(false);
    setSearched(true);
  };

  if (!isOpen) return null;

  return (
    <div className="rdm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="rdm-modal">
        {/* Header */}
        <div className="rdm-header">
          <div className="rdm-title-row">
            <Droplets size={20} color="#ef5350" />
            <h2 className="rdm-title">Request Blood Donor</h2>
          </div>
          <button className="rdm-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Form */}
        <div className="rdm-form">
          <div className="rdm-field">
            <label className="rdm-label">Blood Group *</label>
            <select
              className="rdm-select"
              value={bloodGroup}
              onChange={e => setBloodGroup(e.target.value)}
            >
              <option value="">Select group</option>
              {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div className="rdm-field">
            <label className="rdm-label">Search Radius</label>
            <div className="rdm-radius-row">
              <input
                type="range" min={5} max={100} step={5}
                value={radius}
                onChange={e => setRadius(Number(e.target.value))}
                className="rdm-range"
              />
              <span className="rdm-radius-val">{radius} km</span>
            </div>
          </div>

          <div className="rdm-loc-row">
            <button className="rdm-loc-btn" onClick={getLocation} disabled={locating}>
              {locating ? <Loader size={14} className="spin" /> : <MapPin size={14} />}
              {coords ? 'Location set ✓' : 'Use my location'}
            </button>
            {coords && (
              <span className="rdm-loc-note">
                {coords.lat.toFixed(4)}, {coords.lon.toFixed(4)}
              </span>
            )}
          </div>

          <button
            className="rdm-search-btn"
            onClick={handleSearch}
            disabled={loading || !bloodGroup}
          >
            {loading ? <Loader size={16} className="spin" /> : <Droplets size={16} />}
            {loading ? 'Searching…' : 'Find Donors'}
          </button>
        </div>

        {/* Results */}
        {(loading || searched) && (
          <div className="rdm-results">
            <div className="rdm-results-header">
              {searched && !loading && (
                donors.length > 0
                  ? <span className="rdm-found"><CheckCircle size={14} /> {donors.length} donor(s) found</span>
                  : <span className="rdm-none"><AlertCircle size={14} /> {message || 'No donors found nearby'}</span>
              )}
            </div>
            <DonorList donors={donors} loading={loading} bloodGroup={bloodGroup} />
          </div>
        )}
      </div>

      <style>{`
        .rdm-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,.65); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          padding: 1rem;
        }
        .rdm-modal {
          width: 100%; max-width: 520px; max-height: 90vh;
          background: #1a1a2e; border: 1px solid rgba(255,255,255,.12);
          border-radius: 20px; overflow: hidden;
          display: flex; flex-direction: column;
          box-shadow: 0 24px 60px rgba(0,0,0,.6);
          animation: slideUp .25s ease;
        }
        @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
        .rdm-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,.08);
        }
        .rdm-title-row { display:flex; align-items:center; gap:.6rem; }
        .rdm-title { font-size:1.1rem; font-weight:700; color:#fff; margin:0; }
        .rdm-close {
          background: rgba(255,255,255,.08); border: none; border-radius: 8px;
          width:32px; height:32px; display:flex; align-items:center; justify-content:center;
          color:rgba(255,255,255,.6); cursor:pointer;
        }
        .rdm-close:hover { background:rgba(255,255,255,.15); color:#fff; }
        .rdm-form { padding:1.25rem 1.5rem; display:flex; flex-direction:column; gap:1rem; border-bottom:1px solid rgba(255,255,255,.08); }
        .rdm-field { display:flex; flex-direction:column; gap:.4rem; }
        .rdm-label { font-size:.8rem; font-weight:600; color:rgba(255,255,255,.55); }
        .rdm-select {
          background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.12);
          border-radius:10px; color:#fff; padding:.55rem .85rem; font-size:.9rem; outline:none;
        }
        .rdm-radius-row { display:flex; align-items:center; gap:.75rem; }
        .rdm-range { flex:1; accent-color:#ef5350; }
        .rdm-radius-val { font-size:.85rem; font-weight:700; color:#ef5350; min-width:50px; }
        .rdm-loc-row { display:flex; align-items:center; gap:.75rem; flex-wrap:wrap; }
        .rdm-loc-btn {
          display:inline-flex; align-items:center; gap:.4rem;
          background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.12);
          border-radius:9px; color:rgba(255,255,255,.8); padding:.4rem .9rem;
          font-size:.82rem; cursor:pointer;
        }
        .rdm-loc-btn:hover { background:rgba(255,255,255,.14); }
        .rdm-loc-btn:disabled { opacity:.5; cursor:not-allowed; }
        .rdm-loc-note { font-size:.72rem; color:rgba(255,255,255,.4); font-family:monospace; }
        .rdm-search-btn {
          display:flex; align-items:center; justify-content:center; gap:.5rem;
          background:linear-gradient(135deg,#ef5350,#b71c1c);
          border:none; border-radius:12px; color:#fff;
          padding:.7rem 1.25rem; font-size:.9rem; font-weight:700; cursor:pointer;
          transition:opacity .15s;
        }
        .rdm-search-btn:hover { opacity:.9; }
        .rdm-search-btn:disabled { opacity:.5; cursor:not-allowed; }
        .rdm-results { flex:1; overflow-y:auto; padding:1.25rem 1.5rem; }
        .rdm-results-header { margin-bottom:.75rem; }
        .rdm-found { display:inline-flex; align-items:center; gap:4px; font-size:.82rem; font-weight:600; color:#81c784; }
        .rdm-none  { display:inline-flex; align-items:center; gap:4px; font-size:.82rem; font-weight:600; color:#ffd54f; }
        .spin { animation:spin 1s linear infinite; }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
