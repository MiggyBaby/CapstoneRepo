'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiMapPin, FiCalendar, FiImage } from 'react-icons/fi';

interface CrackCardProps {
  id: string;
  imageUrl?: string | null;
  location: string;
  crackType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export default function CrackCard({
  id,
  imageUrl,
  location,
  crackType,
  severity,
  detectedAt,
  coordinates,
}: CrackCardProps) {
  const severityConfig = {
    low: { bg: 'bg-green-100', text: 'text-green-800', label: 'Low' },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Medium' },
    high: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'High' },
    critical: { bg: 'bg-red-100', text: 'text-red-800', label: 'Critical' },
  };

  const config = severityConfig[severity];

  return (
    <Link href={`/cracks/${id}`}>
      <div className="card cursor-pointer hover:shadow-lg transition-shadow">
        {/* Image */}
        <div className="relative w-full h-48 rounded-lg overflow-hidden mb-4">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={`Crack at ${location}`}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center text-gray-400">
              <FiImage size={28} />
              <span className="text-xs mt-2">No image available</span>
            </div>
          )}
          {/* Severity Badge */}
          <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
            {config.label}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
          {/* Location */}
          <div className="flex items-start space-x-2">
            <FiMapPin className="text-primary-600 flex-shrink-0 mt-1" size={16} />
            <div>
              <p className="text-sm font-medium text-gray-900">{location}</p>
              <p className="text-xs text-gray-500">
                {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
              </p>
            </div>
          </div>

          {/* Crack Type */}
          <div>
            <p className="text-xs text-gray-600 uppercase tracking-wide">Type</p>
            <p className="text-sm font-medium text-gray-900">{crackType}</p>
          </div>

          {/* Detected At */}
          <div className="flex items-center space-x-2 text-xs text-gray-500 pt-3 border-t border-gray-200">
            <FiCalendar size={14} />
            <span>{new Date(detectedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
