const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser'); // Added for parsing JSON request bodies

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json()); // Added for Dialogflow requests

const API_KEY = '4ca94f8b470d7e34bd3f59c3914295c8';
const BASE_URL = 'https://api.themoviedb.org/3';

// ... (rest of your movie search routes)

// Dialogflow fulfillment route
app.post('/getmovie', async (req, res) => {
  try {
    const { queryResult } = req.body; // Access Dialogflow request data
    const movieToSearch = queryResult.parameters.movie || ''; // Extract movie title

    // Using your OMDb API key
    const reqUrl = encodeURI(
      `http://www.omdbapi.com/?t=${movieToSearch}&apikey=e91111a4`
    );

    // Make the request to OMDb API using Axios (recommended)
    const response = await axios.get(reqUrl);
    const movie = response.data;

    if (!movie || movie.Response === 'False') {
      return res.json({
        fulfillmentText: 'Sorry, we could not find the movie you are asking for.',
        source: 'getmovie'
      });
    }

    // Format the response to send to Dialogflow
    const dataToSend = `${movie.Title} was released in the year ${movie.Year}. It is directed by ${movie.Director} and stars ${movie.Actors}. Here’s a glimpse of the plot: ${movie.Plot}.`;

    return res.json({
      fulfillmentText: dataToSend,
      source: 'getmovie'
    });
  } catch (error) {
    console.error('Error processing Dialogflow request:', error);
    return res.json({
      fulfillmentText: 'Could not get results at this time',
      source: 'getmovie'
    });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Server is running on port 3000');
});