import { Client, Databases, ID, Query, Account } from 'appwrite'

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID
const TABLE_ID = import.meta.env.VITE_APPWRITE_TABLE_ID // Used for trending searches
const WATCHLIST_COLLECTION_ID = import.meta.env.VITE_APPWRITE_WATCHLIST_COLLECTION_ID // Used for user watchlists
const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID

const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject(PROJECT_ID)

const database = new Databases(client)
export const account = new Account(client) // Export account for frontend UI access

// --- TRENDING SEARCH FUNCTIONS ---

export const updateSearchCount = async (searchTerm, movie) => {
  try {
    const result = await database.listDocuments(DATABASE_ID, TABLE_ID, [
      Query.equal('searchTerm', searchTerm),
    ])

    if (result.documents.length > 0) {
      const doc = result.documents[0]
      await database.updateDocument(DATABASE_ID, TABLE_ID, doc.$id, { count: doc.count + 1 })
    } else {
      await database.createDocument(DATABASE_ID, TABLE_ID, ID.unique(), {
        searchTerm,
        count: 1,
        movie_id: movie.id,
        poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      })
    }
  } catch (error) {
    console.error(error)
  }
}

export const getTrendingMovies = async () => {
  try {
    const result = await database.listDocuments(DATABASE_ID, TABLE_ID, [
      Query.limit(10),
      Query.orderDesc("count")
    ])
    return result.documents
  } catch (error) {
    console.log(error)
  }
}


// --- AUTHENTICATION FUNCTIONS ---

export const registerUser = async (email, password, name) => {
  try {
    await account.create(ID.unique(), email, password, name);
    return await loginUser(email, password); // Auto-login immediately after registration
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
};

export const loginUser = async (email, password) => {
  try {
    return await account.createEmailPasswordSession(email, password);
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    return await account.deleteSession('current');
  } catch (error) {
    console.error('Logout failed:', error);
  }
};

export const getCurrentUser = async () => {
  try {
    return await account.get();
  } catch (error) {
    console.error('Failed to get current user:', error);
    // If no session exists, it throws an error. We catch it and return null gracefully.
    return null; 
  }
};


// --- WATCHLIST FUNCTIONS ---

export const getWatchlist = async () => {
  try {
    const user = await getCurrentUser();
    if (!user) return []; // Must be logged in

    const result = await database.listDocuments(
      DATABASE_ID,
      WATCHLIST_COLLECTION_ID,
      [Query.equal('user_id', user.$id)]
    );
    return result.documents;
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return [];
  }
};

export const toggleWatchlist = async (movie) => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("You must be logged in to save movies.");
    
    // Check if the movie is already saved by this specific user
    const existing = await database.listDocuments(
      DATABASE_ID,
      WATCHLIST_COLLECTION_ID,
      [
        Query.equal('user_id', user.$id),
        Query.equal('movie_id', movie.id)
      ]
    );

    if (existing.documents.length > 0) {
      // It exists -> DELETE it (Remove from watchlist)
      await database.deleteDocument(
        DATABASE_ID,
        WATCHLIST_COLLECTION_ID,
        existing.documents[0].$id
      );
      return { status: 'removed', id: movie.id };
    } else {
      // It doesn't exist -> CREATE it (Add to watchlist)
      await database.createDocument(
        DATABASE_ID,
        WATCHLIST_COLLECTION_ID,
        ID.unique(),
        {
          movie_id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path || '',
          user_id: user.$id
        }
      );
      return { status: 'added', id: movie.id };
    }
  } catch (error) {
    console.error('Error toggling watchlist:', error);
    throw error;
  }
};