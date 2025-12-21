import { useEffect, useState, useRef } from 'react'
import '../App.css'
import Search from '../components/search'
import Spinner from '../components/spinner'
import MovieCard from '../components/MovieCard'
import { useDebounce } from 'react-use'
import { updateSearchCount, getTrendingMovies } from '../appwrite'
import { Link } from 'react-router-dom' // Ensure this is imported

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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1); // To know when to stop
  const [trendingMovies, setTrendingMovies] = useState([])
  const trendingListRef = useRef(null);
  const [isTrendingLoading, setIsTrendingLoading] = useState(false)


  useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm])

  // 2. Update fetchMovies to accept a page number
  const fetchMovies = async (query = '', page = 1) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const endpoint = query
        ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&page=${page}`
        : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc&page=${page}`;

      const response = await fetch(endpoint, API_OPTIONS);

      if (!response.ok) {
        throw new Error('Failed to fetch movies');
      }

      const data = await response.json();

      if (data.Response === 'False') {
        setErrorMessage(data.Error || 'Failed to fetch movies');
        setMovieList([]);
        return;
      }

      setMovieList(data.results || []);
      setTotalPages(data.total_pages > 500 ? 500 : data.total_pages); // TMDB limits search to 500 pages

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

  // 3. Update the UseEffect to include currentPage
  useEffect(() => {
    fetchMovies(debouncedSearchTerm, currentPage);
  }, [debouncedSearchTerm, currentPage]);

  // 4. Reset page to 1 when a new search is performed
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  // 3. Add this helper function to handle scrolling
  const scrollTrending = (direction) => {
    if (trendingListRef.current) {
      const { current } = trendingListRef;
      const scrollAmount = direction === 'left' ? -500 : 500; // Adjust scroll distance as needed
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
    loadTrendingMovies()
  }, [])

  return (

    <main>
      <div className='pattern' />
      <div className='wrapper'>
        <header>
          <img src="./hero.png" alt="hero Banner" />
          <h1>Find <span className='text-gradient'>Movies</span> You'll Enjoy Without The Hassle</h1>

          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

        </header>

        {trendingMovies.length > 0 && (
          <section className='trending mt-15 mb-10'>
            <h2>Trending Movies</h2>

            {isTrendingLoading ? (
              <Spinner />
            ) : errorMessage ? (
              <p className='text-red-500'>{errorMessage}</p>
            ) : (
              // 4. Wrap the list in a relative div to position arrows
              <div className="relative group">

                {/* Left Arrow Button */}
                <button className="trending-arrow left-0" onClick={() => scrollTrending('left')}>
                  &#8249; {/* Left Chevron Code */}
                </button>

                <button className="trending-arrow right-0" onClick={() => scrollTrending('right')}>
                  &#8250; {/* Right Chevron Code */}
                </button>

                {/* Attach the ref here */}
                <ul ref={trendingListRef}>
                  {trendingMovies.map((movie, index) => (
                    <li key={movie.$id}>
                      <Link
                        to={`/movie/${movie.movie_id}`}
                        className="flex flex-row items-center"
                      >
                        <p>{index + 1}</p>
                        <img src={movie.poster_url} alt={movie.title} />
                      </Link>
                    </li>
                  ))}
                </ul>

                {/* Right Arrow Button */}
                <button className="trending-arrow left-0" onClick={() => scrollTrending('left')}>
                  &#8249; {/* Left Chevron Code */}
                </button>

                <button className="trending-arrow right-0" onClick={() => scrollTrending('right')}>
                  &#8250; {/* Right Chevron Code */}
                </button>
              </div>
            )}
          </section>
        )}

        <section className='all-movies'>

          {isLoading ? (
            <Spinner></Spinner>
          ) : errorMessage ? (
            <p className='text-red-500'>{errorMessage}</p>
          ) :
            (
              <ul>
                {movieList.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </ul>
            )}
          {/* Pagination UI */}
          {!isLoading && !errorMessage && movieList.length > 0 && (
            <div className="flex justify-center items-center gap-4 mt-10 mb-20">
              <button
                className="pagination-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Prev
              </button>

              <div className="flex gap-2">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  // Simple logic to show pages around the current page
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
