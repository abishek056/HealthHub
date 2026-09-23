import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, ChevronRight, BedDouble } from 'lucide-react';

const HospitalCard = ({ hospital }) => {
  const beds = hospital.beds || {};
  const totalBedsAvailable =
    (beds.icu?.available || 0) +
    (beds.emergency?.available || 0) +
    (beds.general?.available || 0) +
    (beds.private?.available || 0);

  const services = hospital.services || [];

  return (
    <div className="bg-white rounded-2xl border border-[#c8eedc] overflow-hidden hover:shadow-lg hover:border-emerald-300 hover:-translate-y-0.5 transition-all duration-300 group">
      <div className="p-5">
        <div className="flex justify-between items-start gap-3">
          <div className="min-w-0">
            <h3 className="font-serif text-base font-bold text-[#0b4d3c] mb-1 truncate group-hover:text-[#167a68] transition-colors">
              {hospital.name}
            </h3>
            <p className="text-xs text-slate-500 flex items-start gap-1.5 mb-3">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-emerald-600 mt-0.5" />
              <span className="line-clamp-2">{hospital.address}</span>
            </p>
          </div>

          <div
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap shrink-0 border ${
              totalBedsAvailable > 0
                ? 'bg-[#dff5ea] border-[#c2ebd5] text-[#0b4d3c]'
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}
          >
            {totalBedsAvailable > 0 ? (
              <span className="flex items-center gap-1">
                <BedDouble className="w-3 h-3" />
                {totalBedsAvailable} Free
              </span>
            ) : (
              'Full'
            )}
          </div>
        </div>

        {services.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {services.slice(0, 4).map((service, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#dff5ea] text-[#0b4d3c] border border-[#c2ebd5]"
              >
                {service}
              </span>
            ))}
            {services.length > 4 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                +{services.length - 4} more
              </span>
            )}
          </div>
        )}

        <div className="border-t border-[#e8f7f0] pt-3.5 flex justify-between items-center gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5 min-w-0">
            <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">{hospital.phone || 'N/A'}</span>
          </div>

          <Link
            to={`/hospitals/${hospital.id}`}
            className="flex items-center gap-1 text-xs font-bold text-[#167a68] hover:text-[#0b4d3c] transition-colors shrink-0"
          >
            View Details
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HospitalCard;