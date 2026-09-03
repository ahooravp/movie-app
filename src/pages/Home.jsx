import { useEffect, useState, useRef } from 'react'
import '../App.css'
import Search from '../components/search'
import Spinner from '../components/spinner'
import MovieCard from '../components/MovieCard'
import { useDebounce } from 'react-use'
import { updateSearchCount, getTrendingMovies } from '../appwrite'
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

const Home = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')

  const [movieList, setMovieList] = useState([])
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [trendingMovies, setTrendingMovies] = useState([])
  const trendingListRef = useRef(null)
  const [isTrendingLoading, setIsTrendingLoading] = useState(false)

  // Carousel State
  const [heroMovies, setHeroMovies] = useState([])
  const [activeHeroIndex, setActiveHeroIndex] = useState(0)

  useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm])

  const fetchMovies = async (query = '', page = 1) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const endpoint = query
        ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&page=${page}`
        : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc&page=${page}`;

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

      setHeroMovies(validMovies.slice(0, 8));
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
    fetchMovies(debouncedSearchTerm, currentPage);
  }, [debouncedSearchTerm, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

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

  return (
    <main>
      <div className='pattern' />

      <div className='w-full h-1 bg-purple-800'></div>

      {/* 1. EDGE-TO-EDGE CINEMATIC HERO */}
      <div className="relative w-full h-[65vh] lg:h-[80vh] flex flex-col items-center justify-center overflow-hidden">
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

          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

          {heroMovies.length > 0 && (
            <div className="flex gap-3 mt-12">
              {heroMovies.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveHeroIndex(index)}
                  className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${index === activeHeroIndex
                    ? 'w-10 bg-[#ab8bff] shadow-[0_0_12px_rgba(171,139,255,0.8)]'
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
        {trendingMovies.length > 0 && (
          <section className='trending'>
            <h2>Popular On MovieHub</h2>

            {isTrendingLoading ? (
              <Spinner />
            ) : errorMessage ? (
              <p className='text-red-500'>{errorMessage}</p>
            ) : (
              <div className="relative group ">
                
                {/* SVG Left Arrow - Pushed Outward */}
                <button 
                  className="trending-arrow -left-4 sm:-left-8 lg:-left-12" 
                  onClick={() => scrollTrending('left')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <path d="M15 6L9 12L15 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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

                {/* SVG Right Arrow - Pushed Outward */}
                <button 
                  className="trending-arrow -right-4 sm:-right-8 lg:-right-12" 
                  onClick={() => scrollTrending('right')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            )}
          </section>
        )}

        {/* Elegant Section Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-[#ab8bff]/20 to-transparent mb-14"></div>

        <section className='all-movies'>
          <h2>Trending today</h2>

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

          {/* Pagination UI */}
          {!isLoading && !errorMessage && movieList.length > 0 && (
            <div className="flex justify-center items-center gap-4 mt-16 mb-24">
              <button
                className="pagination-btn"
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
                      className={`pagination-number ${currentPage === pageNum ? 'active' : ''}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                className="pagination-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default Home