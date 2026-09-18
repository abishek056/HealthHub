import React from 'react';
import { Link } from 'react-router-dom';

const HospitalCard = ({ hospital }) => {
  const beds = hospital.beds || {};
  const totalBedsAvailable =
    (beds.icu?.available || 0) +
    (beds.emergency?.available || 0) +
    (beds.general?.available || 0) +
    (beds.private?.available || 0);

  const services = hospital.services || [];

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="p-6">
        <div className="flex justify-between items-start gap-3">
          <div className="min-w-0">
            <h3 className="text-xl font-bold text-gray-900 mb-1 truncate">
              {hospital.name}
            </h3>
            <p className="text-sm text-gray-500 flex items-start mb-3">
              <svg
                className="w-4 h-4 mr-1 mt-0.5 text-gray-400 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="line-clamp-2">{hospital.address}</span>
            </p>
          </div>

          <div
            className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap shrink-0 ${
              totalBedsAvailable > 0
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {totalBedsAvailable > 0
              ? `${totalBedsAvailable} Beds Free`
              : 'No Beds'}
          </div>
        </div>

        {services.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {services.map((service, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
              >
                {service}
              </span>
            ))}
          </div>
        )}

        <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between items-center gap-3">
          <div className="text-sm text-gray-600 flex items-center min-w-0">
            <svg
              className="w-4 h-4 mr-1 text-gray-400 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            <span className="truncate">{hospital.phone || 'N/A'}</span>
          </div>

          <Link
            to={`/hospitals/${hospital.id}`}
            className="text-primary-600 hover:text-primary-800 font-medium text-sm flex items-center transition-colors shrink-0"
          >
            View Details
            <svg
              className="w-4 h-4 ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HospitalCard;