import React, { useState } from "react";
import { Link } from "react-router-dom"; 
import TrailerModal from "./TrailerModal";

const API_BASE_URL = 'https://api.themoviedb.org/3'
const API_KEY = import.meta.env.VITE_TMDB_API_KEY
const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
}

const MovieCard = ({ movie: { id, title, vote_average, release_date, original_language, poster_path } }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [trailerKey, setTrailerKey] = useState(null);
  const [isFetchingTrailer, setIsFetchingTrailer] = useState(false);

  const handlePlayTrailer = async (e) => {
    e.preventDefault(); // Prevents the <Link> from navigating to the details page
    e.stopPropagation(); // Stops the click event from bubbling up
    
    // If we already fetched it, just open the modal
    if (trailerKey) {
      setIsModalOpen(true);
      return;
    }

    setIsFetchingTrailer(true);
    try {
      const response = await fetch(`${API_BASE_URL}/movie/${id}/videos`, API_OPTIONS);
      const data = await response.json();
      
      const trailer = data.results?.find(vid => vid.type === 'Trailer' && vid.site === 'YouTube');
      setTrailerKey(trailer ? trailer.key : null);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch trailer:", error);
    } finally {
      setIsFetchingTrailer(false);
    }
  };

  return (
    <>
      <div className="movie-card relative transition-transform hover:scale-105 group">
        <Link to={`/movie/${id}`}>
          
          {/* Image Container with Hover Overlay */}
          <div className="relative overflow-hidden rounded-lg">
            <img 
              src={poster_path ? `https://image.tmdb.org/t/p/w500/${poster_path}` : '/no-movie.png'} 
              alt={title}
              className="w-full h-auto"
            /> 
            
            {/* Glassmorphism Play Button Overlay (Visible on Hover) */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <button 
                onClick={handlePlayTrailer}
                className="bg-white/20 hover:bg-[#ab8bff] text-white rounded-full p-4 transition-all duration-300 shadow-xl hover:scale-110 cursor-pointer"
                disabled={isFetchingTrailer}
              >
                {isFetchingTrailer ? (
                   <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="mt-4">
            <h3>{title}</h3>

            <div className="content">
              <div className="rating">
                <img src="star.svg" alt="Star Icon" />
                <p>{vote_average ? vote_average.toFixed(1) : 'N/A'}</p>
              </div>

              <span>•</span>
              <p className="lang">{original_language}</p>

              <span>•</span>
              <p className="year">{release_date ? release_date.split('-')[0] : 'N/A'}</p>
            </div>
          </div>
        </Link>
      </div>

      <TrailerModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        trailerKey={trailerKey} 
      />
    </>
  )
}

export default MovieCard