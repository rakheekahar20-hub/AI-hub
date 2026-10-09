import React from 'react';

export default function FeatureCard({ feature }) {
  return (
    <div className="bg-white shadow rounded-lg p-4 border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900">{feature.title}</h3>
      <p className="mt-1 text-sm text-gray-500">{feature.description}</p>
    </div>
  );
}