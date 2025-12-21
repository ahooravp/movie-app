import React from "react";
import { Link } from "react-router-dom"; // Import Link

// Add 'id' to the destructuring
const MovieCard = ({ movie: { id, title, vote_average, release_date, original_language, poster_path } }) => {
  return (
    // Wrap everything in a Link pointing to the specific movie ID
    <div className="movie-card relative transition-transform hover:scale-105 cursor-pointer">
      <Link to={`/movie/${id}`}>
        <img src={poster_path ? `https://image.tmdb.org/t/p/w500/${poster_path}` : '/no-movie.png'} alt={title}
        /> 

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
            <p className="year">{release_date ? release_date.split('-')[0] : 'N/A'}
            </p>
          </div>
        </div>
      </Link>
    </div>
  )
}

export default MovieCard