import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import TickerPage from './pages/TickerPage'
import Navbar from './components/Navbar'
import MarketBreadthBar from './components/MarketBreadthBar'
import IndiaDashboard from './pages/IndiaDashboard'
function App() {
  return (
    <div>
      <Navbar />
      <MarketBreadthBar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/ticker/:symbol" element={<TickerPage />} />
        <Route path="/india" element={<IndiaDashboard />} />
      </Routes>
    </div>
  )
}

export default App