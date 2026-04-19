import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import TickerPage from './pages/TickerPage'
import Navbar from './components/Navbar'
import MarketBreadthBar from './components/MarketBreadthBar'

function App() {
  return (
    <div>
      <Navbar />
      <MarketBreadthBar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/ticker/:symbol" element={<TickerPage />} />
      </Routes>
    </div>
  )
}

export default App