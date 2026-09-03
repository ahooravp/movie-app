import React, { useEffect } from 'react';

const TrailerModal = ({ isOpen, onClose, trailerKey }) => {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#030014]/90 backdrop-blur-md p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(171,139,255,0.3)] border border-white/10"
        onClick={e => e.stopPropagation()} // Prevent clicks inside the video from closing the modal
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-10 text-white bg-black/50 hover:bg-[#ab8bff] rounded-full w-10 h-10 flex items-center justify-center transition-colors cursor-pointer"
        >
          ✕
        </button>
        
        {trailerKey ? (
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
            title="Movie Trailer"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-white gap-4">
            <p className="text-xl font-bold">Trailer not available</p>
            <p className="text-gray-400">We couldn't find an official trailer for this movie.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrailerModal;