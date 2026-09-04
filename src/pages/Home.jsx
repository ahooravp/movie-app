import { useEffect, useState, useRef } from 'react'
import '../App.css'
import Search from '../components/search'
import Spinner from '../components/spinner'
import MovieCard from '../components/MovieCard'
import AuthModal from '../components/AuthModal'
import { useDebounce } from 'react-use'
import { updateSearchCount, getTrendingMovies, getCurrentUser, logoutUser } from '../appwrite'
import { Link } from 'react-router-dom'

const API_BASE_URL = 'https://api.themoviedb.org/3'
const API_KEY = import.meta.env.VITE_TMDB_API_KEY

const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
}

const MOVIE_GENRES = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 878, name: 'Sci-Fi' },
  { id: 27, name: 'Horror' }
];

const Home = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [activeGenre, setActiveGenre] = useState(null)

  const [movieList, setMovieList] = useState([])
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [trendingMovies, setTrendingMovies] = useState([])
  const trendingListRef = useRef(null)
  const [isTrendingLoading, setIsTrendingLoading] = useState(false)

  const [heroMovies, setHeroMovies] = useState([])
  const [activeHeroIndex, setActiveHeroIndex] = useState(0)

  // Auth State
  const [currentUser, setCurrentUser] = useState(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false) // NEW: Dropdown state

  const isFiltering = debouncedSearchTerm.trim() !== '' || activeGenre !== null;

  useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm])

  // Check session on mount
  const checkSession = async () => {
    setIsAuthLoading(true);
    const user = await getCurrentUser();
    setCurrentUser(user);
    setIsAuthLoading(false);
  };

  useEffect(() => {
    checkSession();
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
  };

  const fetchMovies = async (query = '', page = 1, genre = null) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      let endpoint;
      if (query) {
        endpoint = `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&page=${page}`;
      } else if (genre) {
        endpoint = `${API_BASE_URL}/discover/movie?sort_by=popularity.desc&with_genres=${genre.id}&page=${page}`;
      } else {
        endpoint = `${API_BASE_URL}/discover/movie?sort_by=popularity.desc&page=${page}`;
      }

      const response = await fetch(endpoint, API_OPTIONS);
      if (!response.ok) throw new Error('Failed to fetch movies');

      const data = await response.json();

      if (data.Response === 'False') {
        setErrorMessage(data.Error || 'Failed to fetch movies');
        setMovieList([]);
        return;
      }

      setMovieList(data.results || []);
      setTotalPages(data.total_pages > 500 ? 500 : data.total_pages);

      if (query && data.results.length > 0) {
        await updateSearchCount(query, data.results[0]);
      }
    } catch (error) {
      console.error(`Error fetching movies: ${error}`);
      setErrorMessage('Error fetching movies. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHeroMovies = async () => {
    try {
      const today = new Date();
      const lastMonth = new Date(today);
      lastMonth.setDate(today.getDate() - 30);

      const todayStr = today.toISOString().split('T')[0];
      const lastMonthStr = lastMonth.toISOString().split('T')[0];

      const url = `${API_BASE_URL}/discover/movie?sort_by=popularity.desc&primary_release_date.gte=${lastMonthStr}&primary_release_date.lte=${todayStr}&vote_count.gte=50`;

      const response = await fetch(url, API_OPTIONS);
      if (!response.ok) throw new Error('Failed to fetch hero movies');

      const data = await response.json();
      const validMovies = data.results.filter(movie => movie.backdrop_path !== null);

      setHeroMovies(validMovies.slice(0, 10));
    } catch (error) {
      console.error(`Error fetching hero movies: ${error}`);
    }
  }

  useEffect(() => {
    if (heroMovies.length === 0) return
    const interval = setInterval(() => {
      setActiveHeroIndex((prev) => (prev + 1) % heroMovies.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [heroMovies])

  useEffect(() => {
    fetchMovies(debouncedSearchTerm, currentPage, activeGenre);
  }, [debouncedSearchTerm, currentPage, activeGenre]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, activeGenre]);

  const scrollTrending = (direction) => {
    if (trendingListRef.current) {
      const { current } = trendingListRef;
      const scrollAmount = direction === 'left' ? -500 : 500;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const loadTrendingMovies = async () => {
    setIsTrendingLoading(true)
    try {
      const movies = await getTrendingMovies()
      setTrendingMovies(movies)
    } catch (error) {
      console.error(`Error fetching movies: ${error}`)
    } finally {
      setIsTrendingLoading(false)
    }
  }

  useEffect(() => {
    loadTrendingMovies();
    fetchHeroMovies();
  }, [])

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    if (value.trim() !== '') {
      setActiveGenre(null);
    }
  };

  const handleGenreClick = (genre) => {
    if (activeGenre?.id === genre.id) {
      setActiveGenre(null);
    } else {
      setActiveGenre(genre);
      setSearchTerm('');
    }
  };

  return (
    <main>
      <div className='pattern' />
      <div className='w-full h-1 bg-purple-800'></div>

      {/* 1. EDGE-TO-EDGE CINEMATIC HERO */}
      <div className="relative w-full h-[65vh] lg:h-[80vh] flex flex-col items-center justify-center overflow-hidden">

        {/* Auth Button Overlay */}
        {/* Auth Button Overlay */}
        <div className="absolute top-6 right-6 z-50 flex items-center gap-4">
          {!isAuthLoading && (
            currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-3 bg-black/40 backdrop-blur-md pl-2 pr-4 py-1.5 rounded-full border border-white/10 hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <div className="bg-[#ab8bff] text-white rounded-full p-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className="text-gray-200 text-sm font-medium">
                    {currentUser.name}
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-[#0f0d23] border border-white/10 rounded-xl  py-2 animate-fade-in">
                    <div className="px-4 py-2 border-b border-white/10 mb-1">
                      <p className="text-xs text-gray-400 truncate">{currentUser.email}</p>
                    </div>

                    {/* NEW: Watchlist Link */}
                    <Link
                      to="/watchlist"
                      className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/5 transition-colors font-bold cursor-pointer flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#ab8bff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                      My Watchlist
                    </Link>

                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5 transition-colors font-bold cursor-pointer flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-[#ab8bff]/90 hover:bg-[#8689FF]  text-white px-5 py-2 rounded-full text-sm font-normal transition-all hover:scale-105 cursor-pointer duration-300"
               >
                Log In / Sign Up
              </button>
            )
          )}
        </div>

        {/* Dynamic Image Layers */}
        {heroMovies.length > 0 ? (
          <>
            {heroMovies.map((movie, index) => {
              const isActive = index === activeHeroIndex;
              return (
                <div
                  key={movie.id}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${isActive ? 'opacity-100 z-0' : 'opacity-0 -z-10 pointer-events-none'}`}
                >
                  <img
                    src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`}
                    alt={movie.title || 'Trending Movie'}
                    className="w-full h-full object-cover object-[50%_25%] saturate-[1.1] contrast-[1.15] brightness-[0.85]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t via-[#030014]/20 to-transparent"></div>
                  <div className="absolute inset-0 bg-black/20"></div>
                </div>
              );
            })}
          </>
        ) : (
          <div className="absolute inset-0 bg-[#0f0d23] animate-pulse z-0"></div>
        )}

        {/* Foreground Content */}
        <div className="relative z-10 w-full px-5 flex flex-col items-center text-center mt-20">
          <h1>Find <span className="text-gradient">Movies</span> You'll Enjoy Without The Hassle</h1>

          <Search searchTerm={searchTerm} setSearchTerm={handleSearchChange} />

          {/* Genre Filter Pills */}
          <div className="flex flex-wrap justify-center gap-3 mt-6 max-w-3xl">
            {MOVIE_GENRES.map((genre) => (
              <button
                key={genre.id}
                onClick={() => handleGenreClick(genre)}
                className={`cursor-pointer px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 border ${activeGenre?.id === genre.id
                    ? 'bg-[#ab8bff] text-white border-[#ab8bff] '
                    : 'bg-[#1a1725]/80 backdrop-blur-md text-gray-300 border-[#2a2735] hover:border-[#ab8bff]/50 hover:text-white'
                  }`}
              >
                {genre.name}
              </button>
            ))}
          </div>

          {heroMovies.length > 0 && (
            <div className="flex gap-3 mt-12">
              {heroMovies.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveHeroIndex(index)}
                  className={`cursor-pointer h-1.5 rounded-full transition-all duration-500 ${index === activeHeroIndex
                    ? 'w-10 bg-[#ab8bff] '
                    : 'w-3 bg-white/30 hover:bg-white/60'
                    }`}
                  title={`View slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. MAIN CONTENT */}
      <div className='wrapper'>
        {!isFiltering && trendingMovies.length > 0 && (
          <>
            <section className='trending'>
              <h2>Popular On MovieHub</h2>
              {isTrendingLoading ? (
                <Spinner />
              ) : errorMessage ? (
                <p className='text-red-500'>{errorMessage}</p>
              ) : (
                <div className="relative group mt-6">
                  <button
                    className="trending-arrow cursor-pointer -left-4 sm:-left-8 lg:-left-12"
                    onClick={() => scrollTrending('left')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <path d="M15 6L9 12L15 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  <ul ref={trendingListRef}>
                    {trendingMovies.map((movie, index) => (
                      <li key={movie.$id}>
                        <Link
                          to={`/movie/${movie.movie_id}`}
                          className="flex flex-row items-center gap-4"
                        >
                          <p>{index + 1}</p>
                          <img src={movie.poster_url} alt={movie.title} />
                        </Link>
                      </li>
                    ))}
                  </ul>

                  <button
                    className="trending-arrow cursor-pointer -right-4 sm:-right-8 lg:-right-12"
                    onClick={() => scrollTrending('right')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              )}
            </section>
            <div className="w-full h-px bg-gradient-to-r from-transparent via-[#ab8bff]/20 to-transparent mb-14"></div>
          </>
        )}

        <section className='all-movies'>
          <h2 className="text-2xl font-bold">
            {debouncedSearchTerm
              ? `Search results for "${debouncedSearchTerm}"`
              : activeGenre
                ? `${activeGenre.name} Movies`
                : 'Trending today'}
          </h2>

          {isLoading ? (
            <div className="flex justify-center mt-20"><Spinner /></div>
          ) : errorMessage ? (
            <p className='text-red-500 text-center mt-10'>{errorMessage}</p>
          ) : (
            <ul className="mt-8 gap-8">
              {movieList.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </ul>
          )}

          {!isLoading && !errorMessage && movieList.length > 0 && (
            <div className="flex justify-center items-center gap-4 mt-16 mb-24">
              <button
                className="pagination-btn cursor-pointer"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Prev
              </button>

              <div className="flex gap-2">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`pagination-number cursor-pointer ${currentPage === pageNum ? 'active' : ''}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                className="pagination-btn cursor-pointer"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next
              </button>
            </div>
          )}
        </section>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={checkSession}
      />
    </main>
  )
}

export default Home