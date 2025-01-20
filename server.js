const { default: axios } = require('axios');
const express = require('express');
const http = require('http');
const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

const API_KEY = '4ca94f8b470d7e34bd3f59c3914295c8';
const BASE_URL = 'https://api.themoviedb.org/3';

app.get('/', (req, res) => {
    const url = `${BASE_URL}/movie/550988?api_key=${API_KEY}`;
    axios.get(url)
        .then(response => {
            const data = response.data;
            const releaseDate = new Date(data.release_date).getFullYear();
            const genres = data.genres.map(genre => genre.name).join(', ') + '.';
            const moviePoster = `https://image.tmdb.org/t/p/w600_and_h900_bestv2${data.poster_path}`;
            const currentYear = new Date().getFullYear();

            // Render the main page with movie data and the chatbot iframe included
            res.render('index', {
                movieData: data,
                releaseDate,
                genres,
                poster: moviePoster,
                year: currentYear
            });
        })
        .catch(error => {
            console.error('Error fetching movie data:', error.message);
            res.render('index', { error: 'Could not fetch movie data.' });
        });
});

app.get('/search', (req, res) => {
    res.render('search', { movieDetails: '' });
});

app.post('/search', (req, res) => {
    const userMovieTitle = req.body.movieTitle;
    const movieUrl = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(userMovieTitle)}`;
    const genresUrl = `${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=en-US`;

    const endpoints = [movieUrl, genresUrl];

    axios.all(endpoints.map(endpoint => axios.get(endpoint)))
        .then(axios.spread((movieResponse, genresResponse) => {
            const movieData = movieResponse.data.results[0];
            const genresList = genresResponse.data.genres;

            if (!movieData) {
                return res.render('search', { movieDetails: { error: 'Movie not found.' } });
            }

            const movieGenres = movieData.genre_ids.map(id => 
                genresList.find(genre => genre.id === id)?.name || 'Unknown'
            ).join(', ') + '.';

            const movieDetails = {
                title: movieData.title,
                year: movieData.release_date ? new Date(movieData.release_date).getFullYear() : 'N/A',
                genres: movieGenres,
                overview: movieData.overview || 'No description available.',
                posterUrl: movieData.poster_path ? `https://image.tmdb.org/t/p/w500${movieData.poster_path}` : '/path/to/default-poster.jpg'
            };

            res.render('search', { movieDetails });
        }))
        .catch(error => {
            console.error('Error fetching search data:', error.message);
            res.render('search', { movieDetails: { error: 'Error fetching movie data.' } });
        });
});

// /getmovie route added here
app.post('/getmovie', (req, res) => {
    const movieToSearch =
        req.body.queryResult && req.body.queryResult.parameters && req.body.queryResult.parameters.movie
            ? req.body.queryResult.parameters.movie
            : '';

    // Using your OMDb API key
    const reqUrl = encodeURI(
        `http://www.omdbapi.com/?t=${movieToSearch}&apikey=e91111a4`
    );

    // Making an HTTP request to OMDb API
    http.get(reqUrl, responseFromAPI => {
        let completeResponse = '';
        
        responseFromAPI.on('data', chunk => {
            completeResponse += chunk;
        });

        responseFromAPI.on('end', () => {
            const movie = JSON.parse(completeResponse);
            
            if (!movie || movie.Response === 'False') {
                return res.json({
                    fulfillmentText: 'Sorry, we could not find the movie you are asking for.',
                    source: 'getmovie'
                });
            }

            // Format the response to send to Dialogflow
            let dataToSend = `${movie.Title} was released in the year ${movie.Year}. It is directed by ${movie.Director} and stars ${movie.Actors}. Here’s a glimpse of the plot: ${movie.Plot}.`;

            return res.json({
                fulfillmentText: dataToSend,
                source: 'getmovie'
            });
        });
    })
    .on('error', error => {
        return res.json({
            fulfillmentText: 'Could not get results at this time',
            source: 'getmovie'
        });
    });
});

app.listen(process.env.PORT || 3000, () => {
    console.log('Server is running on port 3000');
});
