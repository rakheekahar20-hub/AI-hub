import React from 'react';

export default function RepositoryList({ repos = [] }) {
  return <div className="grid gap-2">{repos.map(r => <div key={r.id}>{r.name}</div>)}</div>;
}