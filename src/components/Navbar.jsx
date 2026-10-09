import React from 'react';

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between p-4 bg-white shadow-md">
      <div className="flex items-center space-x-2">
        <span className="px-2 py-1 text-xs font-semibold text-white bg-sky-600 rounded">
          HPlus
        </span>
        <span className="text-xl font-bold text-gray-800">Health Clinic</span>
      </div>
      <div className="hidden md:flex space-x-6 text-gray-600">
        <a href="#services" className="hover:text-gray-900">Services</a>
        <a href="#doctors" className="hover:text-gray-900">Doctors</a>
        <a href="#about" className="hover:text-gray-900">About</a>
      </div>
      <div>
        <button className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md transition duration-150">
          Book a visit
        </button>
      </div>
    </nav>
  );
}