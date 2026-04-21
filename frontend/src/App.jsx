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
  <Route path="/"               element={<Dashboard key="global" />} />
  <Route path="/india"          element={<IndiaDashboard key="india" />} />
  <Route path="/ticker/:symbol" element={<TickerPage />} />
</Routes>
    </div>
  )
}

export default App