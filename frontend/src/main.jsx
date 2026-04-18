// main.jsx
// ─────────────────────────────────────────────────────────────────
// ENTRY POINT of the React application.
//
// React is a Single Page Application (SPA) — there is only ONE
// HTML file (public/index.html). It has a single div:
//   <div id="root"></div>
//
// main.jsx takes your entire App component and injects it into
// that div. Everything you see on screen lives inside App.
// ─────────────────────────────────────────────────────────────────

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// document.getElementById('root') finds the <div id="root"> in index.html
// createRoot() tells React "this div is yours, manage it"
// .render() injects the App component into that div
createRoot(document.getElementById('root')).render(
  // StrictMode helps catch bugs during development
  // It runs certain checks twice in dev mode — has no effect in production
  <StrictMode>
    {/* BrowserRouter enables navigation between pages
        without full page reloads — e.g. / → /ticker/AAPL */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)