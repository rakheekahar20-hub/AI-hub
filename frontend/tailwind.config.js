/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        hub: {
          dark: '#0f141c',
          card: '#161d27',
          sidebar: '#0d1117',
          border: '#232e3d',
          accent: '#2563eb',
          'accent-hover': '#1d4ed8',
          text: '#f1f5f9',
          muted: '#8b949e',
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
          highlight: '#38bdf8'
        }
      }
    },
  },
  plugins: [],
}

