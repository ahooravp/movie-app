import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getWatchlist, getCurrentUser } from '../appwrite'
import MovieCard from '../components/MovieCard'
import Spinner from '../components/spinner'

const API_BASE_URL = 'https://api.themoviedb.org/3'
const API_KEY = import.meta.env.VITE_TMDB_API_KEY
const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
}

const Watchlist = () => {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchFullWatchlist = async () => {
      setLoading(true)
      try {
        // 1. Verify user is actually logged in
        const user = await getCurrentUser()
        if (!user) {
          navigate('/') // Kick them back to home if they somehow bypass the UI
          return
        }

        // 2. Get the basic list from Appwrite
        const savedItems = await getWatchlist()
        
        if (savedItems.length === 0) {
          setMovies([])
          setLoading(false)
          return
        }

        // 3. Fetch full TMDB details for every saved ID simultaneously
        const moviePromises = savedItems.map(item => 
          fetch(`${API_BASE_URL}/movie/${item.movie_id}`, API_OPTIONS)
            .then(res => res.json())
        )
        
        const fullMoviesData = await Promise.all(moviePromises)
        setMovies(fullMoviesData)

      } catch (err) {
        console.error("Error loading watchlist:", err)
        setError("Failed to load your watchlist.")
      } finally {
        setLoading(false)
      }
    }

    fetchFullWatchlist()
  }, [navigate])

  return (
    <main className="min-h-screen relative bg-[#0f0d14] overflow-hidden">
      <div className='pattern' />
      
      <div className="wrapper relative z-10 max-w-7xl mx-auto px-5 py-12">
        <header className="flex justify-between items-center mb-10">
          <Link to="/" className="text-gray-100 hover:text-[#ab8bff] transition-colors font-bold flex items-center gap-2">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            My <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ab8bff] to-[#7c5eea]">Watchlist</span>
          </h1>
        </header>

        {loading ? (
          <div className="flex justify-center mt-20"><Spinner /></div>
        ) : error ? (
          <p className="text-red-500 text-center mt-10">{error}</p>
        ) : movies.length > 0 ? (
          <section className="all-movies">
<ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {movies.map((movie) => (
                <MovieCard 
                  key={movie.id} 
                  movie={movie} 
                  savedMovieIds={movies.map(m => m.id)} // Pass IDs so bookmarks show as filled
                />
              ))}
            </ul>
          </section>
        ) : (
          <div className="text-center mt-20 bg-dark-100 border border-white/5 p-10 rounded-2xl max-w-lg mx-auto shadow-2xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <h2 className="text-2xl font-bold text-white mb-2">Your list is empty</h2>
            <p className="text-gray-400 mb-6">Looks like you haven't saved any movies yet.</p>
            <Link to="/" className="bg-[#ab8bff] hover:bg-[#8689FF] text-white px-6 py-2.5 rounded-full text-sm font-bold transition-colors">
              Discover Movies
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}

export default Watchlist