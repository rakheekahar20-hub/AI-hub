import React from 'react';

export default function Navbar() {
  return (
    <nav className="flex justify-between items-center p-4 bg-white shadow">
      <div className="logo">MyBrand</div>
      <div className="links flex gap-4">
        <a href="/">Home</a>
        <a href="/about">About</a>
        <a href="/services">Services</a>
      </div>
      <a href="#contact" className="btn btn-primary px-4 py-2 bg-blue-600 text-white rounded">
        Contact Us
      </a>
    </nav>
  );
}