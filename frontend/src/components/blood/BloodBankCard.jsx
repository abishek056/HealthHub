import { Phone, MapPin, Droplets, Clock, AlertCircle, CheckCircle } from 'lucide-react';

const GROUP_COLORS = {
  'A+':'#e53935','A-':'#d32f2f','B+':'#1976d2','B-':'#1565c0',
  'AB+':'#7b1fa2','AB-':'#6a1b9a','O+':'#388e3c','O-':'#2e7d32',
};

function timeAgo(iso) {
  if (!iso) return 'Unknown';
  const mins = Math.round((Date.now() - new Date(iso)) / 60000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function StockLevel({ units }) {
  if (units === 0) return (
    <span className="bbc-stock bbc-stock--empty">
      <AlertCircle size={12} /> Out of stock
    </span>
  );
  if (units < 5) return (
    <span className="bbc-stock bbc-stock--low">
      <AlertCircle size={12} /> Low — {units} units
    </span>
  );
  return (
    <span className="bbc-stock bbc-stock--ok">
      <CheckCircle size={12} /> {units} units
    </span>
  );
}

export default function BloodBankCard({ bank, onRequestDonor }) {
  const color = GROUP_COLORS[bank.blood_group] ?? '#888';
  const phone = bank.hospital?.phone;

  return (
    <div className="bbc-card" style={{ '--accent': color }}>
      {/* Blood group badge */}
      <div className="bbc-badge" style={{ background: color }}>
        {bank.blood_group}
      </div>

      <div className="bbc-body">
        <div className="bbc-top">
          <h4 className="bbc-hospital">{bank.hospital?.name ?? 'Unknown Hospital'}</h4>
          <StockLevel units={bank.units_available ?? 0} />
        </div>

        <div className="bbc-meta">
          {bank.hospital?.address && (
            <span className="bbc-meta-item">
              <MapPin size={12} />
              {bank.hospital.address}
            </span>
          )}
          {bank.distance_km != null && (
            <span className="bbc-meta-item">
              <Droplets size={12} />
              {bank.distance_km} km away
            </span>
          )}
          <span className="bbc-meta-item">
            <Clock size={12} />
            Updated {timeAgo(bank.last_updated)}
          </span>
        </div>

        <div className="bbc-actions">
          {phone && (
            <a href={`tel:${phone}`} className="bbc-btn bbc-btn--primary">
              <Phone size={14} /> Contact Blood Bank
            </a>
          )}
          {(bank.units_available === 0 || bank.units_available < 3) && (
            <button
              className="bbc-btn bbc-btn--secondary"
              onClick={() => onRequestDonor?.(bank.blood_group)}
            >
              <Droplets size={14} /> Find Donors
            </button>
          )}
        </div>
      </div>

      <style>{`
        .bbc-card {
          display: flex;
          gap: 1rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.09);
          border-left: 3px solid var(--accent);
          border-radius: 14px;
          padding: 1rem 1.1rem;
          transition: transform .15s, box-shadow .15s;
        }
        .bbc-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.25); }
        .bbc-badge {
          flex-shrink: 0;
          width: 52px; height: 52px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1rem; font-weight: 800; color: #fff;
        }
        .bbc-body { flex: 1; min-width: 0; }
        .bbc-top { display: flex; align-items: flex-start; justify-content: space-between; gap: .5rem; flex-wrap: wrap; margin-bottom: .4rem; }
        .bbc-hospital { font-size: .95rem; font-weight: 700; color: #fff; margin: 0; }
        .bbc-stock { display: inline-flex; align-items: center; gap: 4px; font-size: .72rem; font-weight: 600; padding: .2rem .55rem; border-radius: 999px; white-space: nowrap; }
        .bbc-stock--ok     { background: rgba(56,142,60,.2);  color: #81c784; }
        .bbc-stock--low    { background: rgba(255,160,0,.2);  color: #ffd54f; }
        .bbc-stock--empty  { background: rgba(229,57,53,.2);  color: #ef9a9a; }
        .bbc-meta { display: flex; flex-wrap: wrap; gap: .35rem .9rem; margin-bottom: .75rem; }
        .bbc-meta-item { display: flex; align-items: center; gap: 4px; font-size: .75rem; color: rgba(255,255,255,.45); }
        .bbc-actions { display: flex; gap: .5rem; flex-wrap: wrap; }
        .bbc-btn {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: .78rem; font-weight: 600;
          padding: .35rem .85rem; border-radius: 8px; border: none;
          cursor: pointer; text-decoration: none; transition: opacity .15s;
        }
        .bbc-btn:hover { opacity: .85; }
        .bbc-btn--primary   { background: var(--accent); color: #fff; }
        .bbc-btn--secondary { background: rgba(255,255,255,.1); color: rgba(255,255,255,.85); }
      `}</style>
    </div>
  );
}
