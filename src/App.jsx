import React from 'react'
import { Routes, Route } from 'react-router-dom' // Removed 'BrowserRouter as Router'
import Home from './pages/Home' 
import MovieDetails from './pages/MovieDetails'
import './App.css'

const App = () => {
  return (
    // The <Router> tag is removed because it is now in main.jsx
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/movie/:id" element={<MovieDetails />} />
    </Routes>
  )
}

export default App