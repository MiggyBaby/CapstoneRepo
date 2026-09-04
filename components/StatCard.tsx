'use client';

import React from 'react';
import { IconType } from 'react-icons';

interface StatCardProps {
  icon: IconType;
  label: string;
  value: string | number;
  change?: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning';
}

export default function StatCard({
  icon: Icon,
  label,
  value,
  change,
  color = 'primary',
}: StatCardProps) {
  const colorClasses = {
    primary: 'bg-blue-100 text-primary-600',
    secondary: 'bg-red-100 text-secondary-600',
    success: 'bg-green-100 text-green-600',
    warning: 'bg-yellow-100 text-yellow-600',
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {change && (
            <p className="text-xs text-gray-500 mt-2">
              {change.startsWith('+') ? (
                <span className="text-green-600">{change}</span>
              ) : (
                <span className="text-red-600">{change}</span>
              )}{' '}
              from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}
