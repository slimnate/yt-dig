
/**
 * Fetch a `url` using the specified `accessToken` for authorization.
 * 
 * @param {string} url Url to fetch
 * @param {string} accessToken Access token to use for auth
 * @returns {Promise<Response>} Promise that will resolve to the response.
 */
 function fetchAuth(url, accessToken) {
    try {
        return fetch(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
            },
        });
    } catch (err) {
        console.log('Error fetching ' + url);
        console.log(err);
    }
}

async function fetchAuthPaginated(url, accessToken) {
    let results = [];

    let res = await fetchAuth(url, accessToken);
    let data = await res.json();
    let nextPageToken = data.nextPageToken;

    results.push(...data.items);
    
    while(nextPageToken) {
        console.log(`fetching next page of results: ${nextPageToken}`);
        res = await fetchAuth(`${subsUrl}&pageToken=${nextPageToken}`, session.accessToken);
        data = await res.json();
        nextPageToken = data.nextPageToken;
        results.push(...data.items);
    }

    return results;
}

export {
    fetchAuth,
    fetchAuthPaginated
};