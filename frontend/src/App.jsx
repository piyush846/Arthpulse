// App.jsx
// Root component — sets up page routing.
// React Router maps URLs to page components:
//   /              → Dashboard page
//   /ticker/:symbol → TickerPage for that stock

import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import TickerPage from './pages/TickerPage'
import Navbar from './components/Navbar'

function App() {
  return (
    <div>
      {/* Navbar appears on every page */}
      <Navbar />

      {/* Routes renders whichever component matches current URL */}
      <Routes>
        <Route path="/"               element={<Dashboard />} />
        <Route path="/ticker/:symbol" element={<TickerPage />} />
      </Routes>
    </div>
  )
}

export default App