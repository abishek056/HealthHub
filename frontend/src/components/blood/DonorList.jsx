import { User, MapPin, CheckCircle, XCircle, Clock } from 'lucide-react';

const GROUP_COLORS = {
  'A+':'#e53935','A-':'#d32f2f','B+':'#1976d2','B-':'#1565c0',
  'AB+':'#7b1fa2','AB-':'#6a1b9a','O+':'#388e3c','O-':'#2e7d32',
};

function DonorCard({ donor }) {
  const color = GROUP_COLORS[donor.blood_group] ?? '#888';

  return (
    <div className="dl-card">
      <div className="dl-avatar" style={{ background: `${color}25`, border: `2px solid ${color}` }}>
        <User size={18} color={color} />
      </div>

      <div className="dl-info">
        <div className="dl-row">
          <span className="dl-name">{donor.name}</span>
          <span className="dl-group" style={{ color }}>{donor.blood_group}</span>
        </div>

        <div className="dl-meta">
          {donor.city && (
            <span className="dl-meta-item">
              <MapPin size={11} /> {donor.city}
            </span>
          )}
          {donor.distance_km != null && (
            <span className="dl-meta-item">
              {donor.distance_km} km
            </span>
          )}
          {donor.last_donation_date && (
            <span className="dl-meta-item">
              <Clock size={11} /> Last donated: {new Date(donor.last_donation_date).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      <div className="dl-status">
        {donor.eligible !== false ? (
          <span className="dl-eligible">
            <CheckCircle size={14} /> Eligible
          </span>
        ) : (
          <span className="dl-ineligible">
            <XCircle size={14} /> Not eligible
          </span>
        )}
      </div>

      <style>{`
        .dl-card {
          display: flex; align-items: center; gap: .85rem;
          padding: .8rem 1rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          transition: background .15s;
        }
        .dl-card:hover { background: rgba(255,255,255,0.07); }
        .dl-avatar {
          flex-shrink: 0;
          width: 40px; height: 40px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
        }
        .dl-info { flex: 1; min-width: 0; }
        .dl-row { display: flex; align-items: center; gap: .5rem; margin-bottom: .2rem; }
        .dl-name { font-size: .88rem; font-weight: 600; color: #fff; }
        .dl-group { font-size: .82rem; font-weight: 800; }
        .dl-meta { display: flex; flex-wrap: wrap; gap: .25rem .75rem; }
        .dl-meta-item { display: flex; align-items: center; gap: 3px; font-size: .72rem; color: rgba(255,255,255,.45); }
        .dl-status { flex-shrink: 0; }
        .dl-eligible, .dl-ineligible {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: .72rem; font-weight: 600;
          padding: .2rem .55rem; border-radius: 999px;
        }
        .dl-eligible   { background: rgba(56,142,60,.2);  color: #81c784; }
        .dl-ineligible { background: rgba(100,100,100,.2); color: rgba(255,255,255,.35); }
      `}</style>
    </div>
  );
}

export default function DonorList({ donors = [], loading = false, bloodGroup }) {
  if (loading) {
    return (
      <div className="dl-list">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="dl-skeleton" />
        ))}
        <style>{`
          .dl-list { display: flex; flex-direction: column; gap: .6rem; }
          .dl-skeleton { height: 64px; border-radius: 12px; background: linear-gradient(90deg,rgba(255,255,255,.04) 25%,rgba(255,255,255,.08) 50%,rgba(255,255,255,.04) 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
          @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        `}</style>
      </div>
    );
  }

  if (donors.length === 0) {
    return (
      <div className="dl-empty">
        <User size={32} opacity={0.3} />
        <p>No donors found{bloodGroup ? ` for ${bloodGroup}` : ''} in your area.</p>
        <style>{`
          .dl-empty { display:flex; flex-direction:column; align-items:center; gap:.5rem; padding:2rem 0; color:rgba(255,255,255,.35); font-size:.88rem; text-align:center; }
          .dl-empty p { margin:0; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="dl-list">
      {donors.map(d => <DonorCard key={d.id} donor={d} />)}
      <style>{`.dl-list{display:flex;flex-direction:column;gap:.6rem;}`}</style>
    </div>
  );
}
