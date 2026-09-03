import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Spinner from '../components/spinner'
import TrailerModal from '../components/TrailerModal'

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
  const { id } = useParams()
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Trailer State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [trailerKey, setTrailerKey] = useState(null)

  useEffect(() => {
    const fetchMovieDetails = async () => {
      setLoading(true)
      try {
        const response = await fetch(`${API_BASE_URL}/movie/${id}?append_to_response=videos`, API_OPTIONS)
        if (!response.ok) throw new Error('Failed to fetch movie details')
        const data = await response.json()
        
        setMovie(data)
        
        if (data.videos && data.videos.results) {
          const officialTrailer = data.videos.results.find(
            vid => vid.type === 'Trailer' && vid.site === 'YouTube'
          );
          setTrailerKey(officialTrailer ? officialTrailer.key : null);
        }

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
      <div className='pattern' />
      
      <div className="wrapper relative z-10 max-w-5xl mx-auto px-5 py-12">
        <Link to="/" className="text-gray-100 hover:text-[#ab8bff] mb-8 inline-block transition-colors font-bold">
          ← Back to Movies
        </Link>

        {/* 1. Added a min-height to ensure short movies don't look squished */}
        <div className="flex flex-col md:flex-row gap-10 bg-dark-100 p-8 rounded-2xl shadow-[0_20px_60px_rgba(171,139,255,0.15)] border border-white/5 min-h-[500px]">
          
          <div className="shrink-0 w-full md:w-[320px]">
             {/* 2. Forced aspect-[2/3] and object-cover so all posters are perfectly uniform */}
             <img 
               src={movie.poster_path ? `https://image.tmdb.org/t/p/w500/${movie.poster_path}` : '/no-movie.png'} 
               alt={movie.title} 
               className="w-full aspect-[2/3] object-cover rounded-xl shadow-2xl"
             />
          </div>

          <div className="flex flex-col justify-start text-white w-full">
            <h1 className="text-2xl md:text-4xl font-bold mb-4 line-clamp-1 min-h-[96px]">
              {movie.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-gray-100 mb-6 font-medium">
                {movie.release_date && (
                    <span className="bg-light-100/10 px-3 py-1.5 rounded-full text-sm">
                        📅 {movie.release_date.split('-')[0]}
                    </span>
                )}
                {movie.vote_average && (
                    <span className="bg-light-100/10 px-3 py-1.5 rounded-full text-sm flex items-center gap-1">
                        ⭐ {movie.vote_average.toFixed(1)}
                    </span>
                )}
                 {movie.runtime > 0 && (
                    <span className="bg-light-100/10 px-3 py-1.5 rounded-full text-sm">
                        ⏱️ {movie.runtime} min
                    </span>
                )}

                {/* Your updated button styling */}
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="ml-auto bg-[#8689FF] text-white px-5 py-1.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 cursor-pointer hover:scale-110 duration-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Play Trailer
                </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-8">
                {movie.genres?.map((genre) => (
                    <span key={genre.id} className="text-sm text-gray-300 border border-gray-700 px-3 py-1 rounded-full bg-white/5">
                        {genre.name}
                    </span>
                ))}
            </div>

            <h3 className="text-xl font-bold mb-3 text-white">Overview</h3>
            {/* 3. Capped the overview height and allowed scrolling for massively long descriptions */}
            <div className="max-h-[160px] overflow-y-auto hide-scrollbar pr-2 mb-6">
              <p className="text-gray-300 leading-relaxed text-lg">
                  {movie.overview || "No overview available."}
              </p>
            </div>
            
             <div className="mt-auto pt-6 border-t border-gray-800">
                <p className="text-gray-400 text-sm">
                    Original Language: <span className="uppercase text-white ml-2 font-bold">{movie.original_language}</span>
                </p>
             </div>
          </div>
        </div>
      </div>

      <TrailerModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        trailerKey={trailerKey} 
      />
    </main>
  )
}

export default MovieDetails