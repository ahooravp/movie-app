import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
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

const MovieDetails = () => {
  const { id } = useParams() // Get the ID from the URL
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchMovieDetails = async () => {
      setLoading(true)
      try {
        const response = await fetch(`${API_BASE_URL}/movie/${id}`, API_OPTIONS)
        if (!response.ok) throw new Error('Failed to fetch movie details')
        const data = await response.json()
        setMovie(data)
      } catch (err) {
        console.error(err)
        setError('Failed to load movie details.')
      } finally {
        setLoading(false)
      }
    }

    fetchMovieDetails()
  }, [id])

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-primary">
      <Spinner />
    </div>
  )

  if (error) return <div className="text-red-500 text-center mt-10">{error}</div>

  if (!movie) return null

  return (
    <main className="min-h-screen bg-primary relative overflow-hidden">
      {/* Reusing your background pattern */}
      <div className='pattern' />
      
      <div className="wrapper relative z-10 max-w-5xl mx-auto px-5 py-12">
        {/* Back Button */}
        <Link to="/" className="text-gray-100 hover:text-white mb-8 inline-block transition-colors">
          ← Back to Movies
        </Link>

        <div className="flex flex-col md:flex-row gap-10 bg-dark-100 p-8 rounded-2xl shadow-[0_20px_60px_rgba(126,34,206,0.5)]">
          
          {/* Poster Image */}
          <div className="shrink-0 w-full md:w-[300px]">
             <img 
               src={movie.poster_path ? `https://image.tmdb.org/t/p/w500/${movie.poster_path}` : '/no-movie.png'} 
               alt={movie.title} 
               className="w-full h-auto rounded-xl shadow-lg"
             />
          </div>

          {/* Movie Info */}
          <div className="flex flex-col justify-start text-white">
            <h1 className="text-4xl font-bold mb-4">{movie.title}</h1>
            
            <div className="flex flex-wrap gap-4 text-gray-100 mb-6 font-medium">
                {movie.release_date && (
                    <span className="bg-light-100/10 px-3 py-1 rounded-full text-sm">
                        📅 {movie.release_date.split('-')[0]}
                    </span>
                )}
                {movie.vote_average && (
                    <span className="bg-light-100/10 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                        ⭐ {movie.vote_average.toFixed(1)}
                    </span>
                )}
                 {movie.runtime && (
                    <span className="bg-light-100/10 px-3 py-1 rounded-full text-sm">
                        ⏱️ {movie.runtime} min
                    </span>
                )}
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2 mb-6">
                {movie.genres?.map((genre) => (
                    <span key={genre.id} className="text-sm text-gray-400 border border-gray-700 px-3 py-1 rounded-full">
                        {genre.name}
                    </span>
                ))}
            </div>

            <h3 className="text-xl font-bold mb-2 text-white">Overview</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
                {movie.overview}
            </p>
            
             <div className="mt-auto pt-6 border-t border-gray-800">
                <p className="text-gray-400 text-sm">
                    Original Language: <span className="uppercase text-white ml-2">{movie.original_language}</span>
                </p>
             </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default MovieDetails