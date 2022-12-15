const express = require('express');
const { google } = require('googleapis');


const API_KEY = 'AIzaSyAMPoSFIIY2k7zEWCctpe5_KTPHG4aJzb0';

// create youtube api object
const youtube = google.youtube('v3');
const app = express();

let userCredentials = null;

app.get('/', (req, res) => {
    // check user is logged in
    if(userCredentials === null) {
        res.send('not logged in');
        return;
    }

    
})


// define async main function so we can use await
async function main() {
    // configure auth
    const auth = new google.auth.GoogleAuth({
        scopes: [
            'https://www.googleapis.com/auth/youtube',
            'https://www.googleapis.com/auth/youtube.force-ssl',
            'https://www.googleapis.com/auth/youtube.readonly',
            'https://www.googleapis.com/auth/youtubepartner',
        ],
        clientOptions: {
            clientId: '279986430801-pld3c39n2092ihud2pri96qckig8qdhq.apps.googleusercontent.com'
        }
    });
    const authClient = await auth.getClient();
    google.options({auth: authClient});

    try {

        // get subscriptions for user
        const subscriptionsResults = await youtube.channels.list({
            part: 'snippet',
            mine: true,
        });
        const subscriptions = subscriptionsResults.data.items;

        console.log(subscriptions);
    } catch(err) {
        console.error(err)
        console.log(err.response.data.error);
        console.log(err.response.data.error.details[0]);
    }
}

// run main
main();