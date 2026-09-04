'use client';

import React from 'react';
import { FiBell, FiMenu, FiUser, FiLogOut } from 'react-icons/fi';
import { FiSearch } from 'react-icons/fi';

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      {/* Left Side */}
      <div className="flex items-center space-x-4">
        <h1 className="text-2xl font-bold text-primary-600">DPWH</h1>
        <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-4 py-2">
          <FiSearch className="text-gray-500" />
          <input
            type="text"
            placeholder="Search cracks, locations..."
            className="bg-transparent ml-2 outline-none text-sm w-48"
          />
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center space-x-6">
        {/* Notifications */}
        <button className="relative text-gray-600 hover:text-primary-600 transition">
          <FiBell size={20} />
          <span className="absolute top-0 right-0 w-2 h-2 bg-secondary-500 rounded-full"></span>
        </button>

        {/* User Menu */}
        <div className="flex items-center space-x-3 border-l border-gray-200 pl-6">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900">Admin</p>
            <p className="text-xs text-gray-500">System Administrator</p>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold">
            A
          </div>
        </div>
      </div>
    </nav>
  );
}
