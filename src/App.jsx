import React from 'react'
import { Routes, Route } from 'react-router-dom' // Removed 'BrowserRouter as Router'
import Home from './pages/Home' 
import MovieDetails from './pages/MovieDetails'
import './App.css'
import Watchlist from './pages/WatchList' // NEW IMPORT

const App = () => {
  return (
    // The <Router> tag is removed because it is now in main.jsx
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/movie/:id" element={<MovieDetails />} />
      <Route path="/watchlist" element={<Watchlist />} /> {/* NEW ROUTE */}
    </Routes>
  )
}

export default App