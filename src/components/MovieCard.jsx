import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom"; 
import TrailerModal from "./TrailerModal";
import { toggleWatchlist } from "../appwrite";

const API_BASE_URL = 'https://api.themoviedb.org/3'
const API_KEY = import.meta.env.VITE_TMDB_API_KEY
const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
}

const MovieCard = ({ movie, savedMovieIds = [] }) => {
  const { id, title, vote_average, release_date, original_language, poster_path } = movie;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [trailerKey, setTrailerKey] = useState(null);
  const [isFetchingTrailer, setIsFetchingTrailer] = useState(false);
  
  const [isSaved, setIsSaved] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  // --- UPDATED: Sync UI instantly when the parent's array changes ---
  useEffect(() => {
    setIsSaved(savedMovieIds.includes(id));
  }, [savedMovieIds, id]);

  const handlePlayTrailer = async (e) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    
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

  const handleBookmark = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isToggling) return;

    setIsToggling(true);
    // Optimistic UI update for a snappy feel
    setIsSaved(!isSaved); 

    try {
      const result = await toggleWatchlist(movie);
      // Sync state with reality
      setIsSaved(result.status === 'added');
    } catch (error) {
      // Revert if failed
      setIsSaved(isSaved);
      // Catch unauthorized error thrown from appwrite.js
      if (error.message.includes("logged in")) {
        setShowAuthPrompt(true);
      }
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <>
      <div className="movie-card relative transition-transform hover:scale-105 group">
        <Link to={`/movie/${id}`}>
          <div className="relative overflow-hidden rounded-lg">
            <img 
              src={poster_path ? `https://image.tmdb.org/t/p/w500/${poster_path}` : '/no-movie.png'} 
              alt={title}
              className="w-full h-auto"
            /> 
            
            {/* Watchlist Bookmark Button */}
            <button 
              onClick={handleBookmark}
              disabled={isToggling}
              className="absolute top-3 right-3 z-20 bg-black/50  p-2.5 rounded-full hover:bg-[#ab8bff] transition-colors cursor-pointer"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="w-5 h-5 transition-colors" 
                viewBox="0 0 24 24" 
                fill={isSaved ? "#ab8bff" : "none"} 
                stroke={isSaved ? "#ab8bff" : "currentColor"} 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
            </button>

            {/* Play Button Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10">
              <button 
                onClick={handlePlayTrailer}
                className="bg-white/20  hover:bg-[#ab8bff] text-white rounded-full p-4 transition-all duration-300 shadow-xl hover:scale-110 cursor-pointer"
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

      {/* Unauthorized Action Prompt */}
      {showAuthPrompt && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#030014]/90  p-4 animate-fade-in cursor-default"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAuthPrompt(false); }}
        >
          <div 
            className="relative w-full max-w-sm bg-[#0f0d23] p-6 rounded-2xl shadow-[0_0_40px_rgba(171,139,255,0.15)] border border-white/10 text-center"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#ab8bff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Log In Required</h3>
            <p className="text-gray-400 mb-6 text-sm">You need to log in or create an account to save movies to your personal Watchlist.</p>
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAuthPrompt(false); }} 
              className="w-full bg-[#ab8bff] hover:bg-[#8689FF] text-white font-bold py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default MovieCard