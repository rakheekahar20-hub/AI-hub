import React from 'react';
import './App.css';
import GitHubConnect from './components/GitHubConnect';
import RepositoryList from './components/RepositoryList';

function App() {
  return <div className="App">
    <GitHubConnect />
    <RepositoryList />
  </div>;
}
export default App;