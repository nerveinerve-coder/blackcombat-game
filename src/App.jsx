import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Fight from './pages/Fight'
import RisingStar from './pages/RisingStar'
import RisingStarFight from './pages/RisingStarFight'
import RisingStarArena from './pages/RisingStarArena'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/fight" element={<Fight />} />
        <Route path="/rising-star" element={<RisingStar />} />
        <Route path="/rising-star/fight" element={<RisingStarFight />} />
        <Route path="/rising-star/fight/arena" element={<RisingStarArena />} />
      </Routes>
    </BrowserRouter>
  )
}