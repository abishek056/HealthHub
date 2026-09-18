import { useState, useEffect } from 'react';
import { fetchBloodBanks } from '../../services/bloodService';
import { useWebSocket } from '../../hooks/useWebSocket';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const GROUP_COLORS = {
  'A+': '#e53935', 'A-': '#d32f2f',
  'B+': '#1976d2', 'B-': '#1565c0',
  'AB+': '#7b1fa2', 'AB-': '#6a1b9a',
  'O+': '#388e3c', 'O-': '#2e7d32',
};

function StockBadge({ units }) {
  if (units === 0) return <span className="bb-badge bb-badge--critical">Out of Stock</span>;
  if (units < 5)  return <span className="bb-badge bb-badge--low">Low ({units} units)</span>;
  return <span className="bb-badge bb-badge--ok">{units} units</span>;
}

export default function BloodBank({ hospitalId }) {
  const [banks, setBanks]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadBanks = async () => {
    setLoading(true);
    const data = await fetchBloodBanks(hospitalId ? { hospital_id: hospitalId } : {});
    setBanks(data);
    setLastUpdated(new Date());
    setLoading(false);
  };

  useEffect(() => { loadBanks(); }, [hospitalId]);

  // Real-time updates via Reverb
  useWebSocket({
    channel: hospitalId ? `hospital.${hospitalId}` : null,
    event: 'BloodStockUpdated',
    onMessage: (payload) => {
      setBanks(prev =>
        prev.map(b => b.blood_group === payload.blood_group
          ? { ...b, units_available: payload.units_available }
          : b
        )
      );
      setLastUpdated(new Date());
    },
  });

  const filtered = filter ? banks.filter(b => b.blood_group === filter) : banks;

  const timeAgo = lastUpdated
    ? `${Math.round((Date.now() - lastUpdated) / 60000)} min ago`
    : '—';

  return (
    <div className="bb-wrapper">
      <div className="bb-header">
        <div>
          <h3 className="bb-title">🩸 Blood Bank</h3>
          <p className="bb-subtitle">Updated {timeAgo}</p>
        </div>
        <select
          className="bb-filter"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        >
          <option value="">All Groups</option>
          {BLOOD_GROUPS.map(g => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="bb-skeleton-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bb-skeleton-card" />
          ))}
        </div>
      ) : (
        <div className="bb-grid">
          {filtered.map((bank) => (
            <div
              key={bank.id ?? bank.blood_group}
              className="bb-card"
              style={{ borderTopColor: GROUP_COLORS[bank.blood_group] ?? '#666' }}
            >
              <span
                className="bb-group-label"
                style={{ color: GROUP_COLORS[bank.blood_group] ?? '#666' }}
              >
                {bank.blood_group}
              </span>
              <StockBadge units={bank.units_available} />
              {bank.hospital && (
                <p className="bb-hospital-name">{bank.hospital.name}</p>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="bb-empty">No blood bank data available for the selected group.</p>
          )}
        </div>
      )}

      <style>{`
        .bb-wrapper { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:16px; padding:1.5rem; }
        .bb-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:1.25rem; flex-wrap:wrap; gap:0.5rem; }
        .bb-title { font-size:1.15rem; font-weight:700; color:#fff; margin:0; }
        .bb-subtitle { font-size:0.78rem; color:rgba(255,255,255,0.45); margin:0.15rem 0 0; }
        .bb-filter { background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); border-radius:8px; color:#fff; padding:0.35rem 0.75rem; font-size:0.85rem; outline:none; cursor:pointer; }
        .bb-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(130px,1fr)); gap:0.75rem; }
        .bb-card { background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.08); border-top-width:3px; border-radius:12px; padding:0.9rem 0.75rem; display:flex; flex-direction:column; align-items:center; gap:0.4rem; transition:transform 0.15s,box-shadow 0.15s; }
        .bb-card:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,0,0,0.3); }
        .bb-group-label { font-size:1.6rem; font-weight:800; line-height:1; }
        .bb-hospital-name { font-size:0.7rem; color:rgba(255,255,255,0.4); text-align:center; margin:0; }
        .bb-badge { font-size:0.7rem; font-weight:600; padding:0.2rem 0.55rem; border-radius:999px; white-space:nowrap; }
        .bb-badge--ok { background:rgba(56,142,60,0.25); color:#81c784; }
        .bb-badge--low { background:rgba(255,160,0,0.25); color:#ffd54f; }
        .bb-badge--critical { background:rgba(229,57,53,0.25); color:#ef9a9a; }
        .bb-skeleton-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(130px,1fr)); gap:0.75rem; }
        .bb-skeleton-card { height:100px; border-radius:12px; background:linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .bb-empty { grid-column:1/-1; text-align:center; color:rgba(255,255,255,0.4); font-size:0.9rem; padding:2rem 0; }
      `}</style>
    </div>
  );
}
