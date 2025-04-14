import { useState } from 'react';
import ReactPlayer from 'react-player';
import axios from 'axios';
import './App.css'; // Import the CSS for UI styling

function App() {
    const [query, setQuery] = useState("");  // The search input
    const [videoURL, setVideoURL] = useState("");  // The URL of the trailer
    const [description, setDescription] = useState("");  // The description of the trailer
    const [director, setDirector] = useState("");  // The director of the movie
    const [releaseYear, setReleaseYear] = useState("");  // The release year of the movie
    const [loading, setLoading] = useState(false);  // Loading state
    const [error, setError] = useState(null);  // Error state

    // YouTube API Key
    const YOUTUBE_API_KEY = 'YOUR API KEY'; 
    // TMDb API Key (for movie/game metadata)
    const TMDB_API_KEY = 'YOUR TMDB KEY'; 
    // Function to search for trailers (movies/games)
    function handleSearch() {
        if (!query.trim()) return; // Don't search if query is empty
        setLoading(true);
        setError(null);

        // Create a search query string for YouTube API
        const searchQuery = `${query} trailer`;
        const youtubeAPI = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&key=${YOUTUBE_API_KEY}`;

        // Making a request to the YouTube Data API to search for the trailer
        axios.get(youtubeAPI)
            .then((response) => {
                const items = response.data.items;
                if (items && items.length > 0) {
                    const firstVideo = items[0];
                    const videoUrl = `https://www.youtube.com/watch?v=${firstVideo.id.videoId}`;
                    setVideoURL(videoUrl);  // Set the URL of the first video found

                    // Fetch movie/game metadata from TMDb API
                    fetchMovieMetadata(query, videoUrl);
                } else {
                    setError("No trailer found for this search.");
                }
            })
            .catch((error) => {
                console.error("Error fetching video:", error);
                setError("Error fetching trailer.");
            })
            .finally(() => setLoading(false));  // Stop loading once done
    }

    // Function to fetch movie/game metadata (description, director, release year) using TMDb API
    function fetchMovieMetadata(title, fallbackUrl) {
        const tmdbAPI = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`;

        axios.get(tmdbAPI)
            .then((response) => {
                if (response.data.results && response.data.results.length > 0) {
                    const movie = response.data.results[0];  // Get the first movie result
                    setDescription(movie.overview || "Description not available");  // Set description (use default if not available)
                    setReleaseYear(movie.release_date || "Release date not available");  // Set release year
                    fetchDirector(movie.id);  // Fetch director info
                } else {
                    // Fallback to YouTube description if TMDb data is unavailable
                    setDescription("Description not available");
                    setReleaseYear("Release year not available");
                    setDirector("Director info not available");
                    fetchYoutubeDescription(fallbackUrl);  // Fetch YouTube description as a fallback
                }
            })
            .catch((error) => {
                console.error("Error fetching movie data:", error);
                setError("Error fetching movie metadata.");
                setDescription("Description not available");
                fetchYoutubeDescription(fallbackUrl);  // Fetch YouTube description in case of error
            });
    }

    // Function to fetch the director info using TMDb API
    function fetchDirector(movieId) {
        const tmdbDirectorAPI = `https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${TMDB_API_KEY}`;

        axios.get(tmdbDirectorAPI)
            .then((response) => {
                if (response.data.crew && response.data.crew.length > 0) {
                    const directorData = response.data.crew.find(person => person.job === "Director");
                    if (directorData) {
                        setDirector(directorData.name);  // Set the director's name
                    } else {
                        setDirector("Director info not available");
                    }
                } else {
                    setDirector("Director info not available");
                }
            })
            .catch((error) => {
                console.error("Error fetching director info:", error);
                setError("Error fetching director info.");
                setDirector("Director info not available");
            });
    }

    // Function to fetch YouTube description as a fallback
    function fetchYoutubeDescription(url) {
        const videoId = new URL(url).searchParams.get("v");
        const youtubeAPI = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`;

        axios.get(youtubeAPI)
            .then((response) => {
                const snippet = response.data.items[0]?.snippet;
                if (snippet) {
                    setDescription(snippet.description || "Description not available");
                } else {
                    setDescription("Description not available");
                }
            })
            .catch((error) => {
                console.error("Error fetching YouTube description:", error);
                setDescription("Description not available");
            });
    }

    return (
        <div className="App">
            <div className="search-box">
                <label>
                    Search for movie or game trailers:{" "}
                </label>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}  // Update query state
                    placeholder="Enter movie or game title"
                />

                <button onClick={handleSearch}>Search</button>
            </div>

            {loading && <p>Loading...</p>}  {/* Show loading message */}
            {error && <p>{error}</p>}  {/* Show error message if any */}

            {videoURL && !loading && !error && (
                <div>
                    <ReactPlayer url={videoURL} controls={true} />  {/* Display the video player */}
                    <div>
                        <h3>Description:</h3>
                        <p>{description}</p>  {/* Display the trailer description */}
                    </div>
                    <div>
                        <h3>Director:</h3>
                        <p>{director}</p>  {/* Display director */}
                    </div>
                    <div>
                        <h3>Release Year:</h3>
                        <p>{releaseYear}</p>  {/* Display release year */}
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
