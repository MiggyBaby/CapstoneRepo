'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FiHome, FiMap, FiBarChart2, FiSettings, FiChevronDown, FiImage } from 'react-icons/fi';
import { GiRoad } from 'react-icons/gi';

interface MenuItem {
  label: string;
  href: string;
  iconName: 'home' | 'crack' | 'map' | 'chart' | 'gallery' | 'settings';
}

const getIcon = (iconName: string) => {
  switch (iconName) {
    case 'home':
      return <FiHome size={20} className="flex-shrink-0" />;
    case 'crack':
      return <GiRoad size={20} className="flex-shrink-0" />;
    case 'map':
      return <FiMap size={20} className="flex-shrink-0" />;
    case 'chart':
      return <FiBarChart2 size={20} className="flex-shrink-0" />;
    case 'gallery':
      return <FiImage size={20} className="flex-shrink-0" />;
    case 'settings':
      return <FiSettings size={20} className="flex-shrink-0" />;
    default:
      return null;
  }
};

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);

  const menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      href: '/',
      iconName: 'home',
    },
    {
      label: 'Crack Detection',
      href: '/cracks',
      iconName: 'crack',
    },
    {
      label: 'Map View',
      href: '/map',
      iconName: 'map',
    },
    {
      label: 'Analytics',
      href: '/analytics',
      iconName: 'chart',
    },
    {
      label: 'Gallery',
      href: '/gallery',
      iconName: 'gallery',
    },
    {
      label: 'Settings',
      href: '/settings',
      iconName: 'settings',
    },
  ];

  return (
    <aside
      className={`${
        isOpen ? 'w-64' : 'w-20'
      } bg-gradient-to-b from-primary-700 to-primary-900 text-white transition-all duration-300 flex flex-col`}
    >
      {/* Logo */}
      <div className="p-6 flex items-center justify-between">
        {isOpen && <h2 className="text-xl font-bold">Road Cracks</h2>}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded hover:bg-primary-600 transition"
        >
          <FiChevronDown size={20} />
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          return (
            <Link key={item.href} href={item.href} className="block">
              <div className="flex items-center space-x-4 px-4 py-3 rounded-lg hover:bg-primary-600 transition-colors group cursor-pointer">
                {getIcon(item.iconName)}
                {isOpen && <span className="text-sm font-medium">{item.label}</span>}
                {!isOpen && (
                  <div className="absolute left-24 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition">
                    {item.label}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-primary-600">
        {isOpen && (
          <p className="text-xs text-primary-200">
            © 2024 DPWH System v1.0
          </p>
        )}
      </div>
    </aside>
  );
}
