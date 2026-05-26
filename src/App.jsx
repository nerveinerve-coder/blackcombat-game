import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Fight from './pages/Fight'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/fight" element={<Fight />} />
      </Routes>
    </BrowserRouter>
  )
}