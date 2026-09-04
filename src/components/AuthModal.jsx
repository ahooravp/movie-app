import React, { useState, useEffect } from 'react';
import { loginUser, registerUser } from '../appwrite';

const AuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => document.body.style.overflow = 'unset';
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLoginMode) {
        await loginUser(email, password);
      } else {
        await registerUser(email, password, name);
      }
      onAuthSuccess(); // Refresh user state in parent component
      onClose(); // Close the modal
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError('');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#030014]/90 backdrop-blur-md p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-[#0f0d23] p-8 rounded-2xl border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-10 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full w-8 h-8 flex items-center justify-center transition-colors cursor-pointer"
        >
          ✕
        </button>

<h2 className="text-3xl font-bold text-white mb-2">
          {isLoginMode ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-gray-400 mb-6">
          {isLoginMode ? 'Log in to access your Watchlist.' : 'Sign up to start saving your favorite movies.'}
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLoginMode && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
              <input 
                type="text" 
                required 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#1a1725] border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-[#ab8bff] transition-colors"
                placeholder="John Doe"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#1a1725] border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-[#ab8bff] transition-colors"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input 
              type="password" 
              required 
              minLength="8"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1a1725] border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-[#ab8bff] transition-colors"
              placeholder="••••••••"
            />
          </div>

<button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#ab8bff] hover:bg-[#8689FF] text-white font-bold py-3 rounded-lg mt-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed  cursor-pointer"
          >
            {loading ? 'Processing...' : (isLoginMode ? 'Log In' : 'Sign Up')}
          </button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-6">
          {isLoginMode ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button" 
            onClick={toggleMode}
            className="text-[#ab8bff] hover:text-white font-bold transition-colors cursor-pointer"
          >
            {isLoginMode ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthModal;