

const channelUrl = 'https://youtube.googleapis.com/youtube/v3/channels?part=id&mine=true';

const getSubscriptionsUrl = channelId =>
    `https://youtube.googleapis.com/youtube/v3/subscriptions?part=snippet%2CcontentDetails&maxResults=50&channelId=${channelId}`;

const getChannelDetailsUrl = channelId =>
    `https://youtube.googleapis.com/youtube/v3/channels?part=snippet%2CcontentDetails%2Cstatistics&id=${channelId}`;

const getVideosUrl = playlistId =>
    `https://youtube.googleapis.com/youtube/v3/playlistItems?part=id%2CcontentDetails%2Csnippet%2Cstatus&maxResults=50&playlistId=${playlistId}`;

const getVideoDetailsUrl = videoId =>
    `https://youtube.googleapis.com/youtube/v3/videos?part=snippet%2CcontentDetails%2Cstatistics%2CliveStreamingDetails%2Cplayer%2CtopicDetails&id=${videoId}`;

/**
 * Fetch a `url` using the specified `accessToken` for authorization.
 * 
 * @param {string} url Url to fetch
 * @param {string} accessToken Access token to use for auth
 * @returns {Promise<Response>} Promise that will resolve to the response.
 */
 async function fetchAuth(url, accessToken) {
    let data;
    try {
        const res = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
            },
        });
        data = await res.json();
    } catch (err) {
        console.log('Error fetching ' + url);
        console.log(err);
    }

    if(data.error) {
        throw new Error(`Error fetching ${url} - ${data.error.code}: ${data.error.message}`);
    }

    return data;
}

/**
 * Fetch a paginated list of generic objects from the Youtube Data API,
 * using the `nextPageToken` provided byt the initial response
 * 
 * @param {string} url url to fetch from
 * @param {string} accessToken jst access token
 * @returns object[]
 */
async function fetchAuthPaginated(url, accessToken) {
    let results = [];

    let data = await fetchAuth(url, accessToken);
    let nextPageToken = data.nextPageToken;

    results.push(...data.items);
    
    // while(nextPageToken) {
    //     console.log(`fetching next page of results: ${nextPageToken}`);
    //     res = await fetchAuth(`${url}&pageToken=${nextPageToken}`, accessToken);
    //     data = await res.json();
    //     nextPageToken = data.nextPageToken;
    //     results.push(...data.items);
    // }

    return results;
}

/**
 * Get the channel_id for the currently logged in Youtube user, will return
 * the value stored in session, or request it from the Youtube Data API if
 * session does not have a stored value.
 * 
 * @param {Object} session Web Session object
 * @returns {string} channel_id for the currently logged in Youtube account.
 */
 async function getChannelId(session) {
    if(!session.channel_id) {
        const data = await fetchAuth(channelUrl, session.accessToken);

        const channelId = data.items[0].id;
        session.channel_id = channelId;
        
        return channelId;
    }

    console.log('using stored channel_id from session');
    return session.channel_id;
}

/**
 * Fetch all the subscriptions for the current signed-in user from the Youtube Data API.
 * 
 * @param {Object} session Web session
 * @returns channel[]
 */
async function fetchSubscriptions(session) {
    const subsUrl = getSubscriptionsUrl(session.channel_id);

    function normalize(items) {
        return items.map(item => {
            return {
                channelId: item.snippet.resourceId.channelId,
                title: item.snippet.title,
                description: item.snippet.description,
                thumbnails: item.snippet.thumbnails
            };
        });
    }

    const subscriptions = await fetchAuthPaginated(subsUrl, session.accessToken);

    return normalize(subscriptions);
}

/**
 * Fetch details for the channel with specified `channelId`, and normalize the resulting object
 * 
 * @param {*} session Next.js session object
 * @param {string} channelId channel id to fetch details for
 * @returns channel
 */
async function fetchChannelDetails(session, channelId) {
    const channelDetailsUrl = getChannelDetailsUrl(channelId);

    function normalize(item) {
        return {
            viewCount: item.statistics.viewCount,
            subscriberCount: item.statistics.subscriberCount,
            videoCount: item.statistics.videoCount,
            uploadPlaylistId: item.contentDetails.relatedPlaylists.uploads,
        }
    }

    const data = await fetchAuth(channelDetailsUrl, session.accessToken);

    return normalize(data.items[0]);
}

/**
 * Fetch list of all videos on the provided playlist id
 * 
 * @param {*} session Next.js session object
 * @param {string} playlistId playlist id to fetch videos for
 * @returns video[]
 */
async function fetchPlaylistVideos(session, playlistId) {
    console.log(`fetching playlistId - ${playlistId}`);

    const videosUrl = getVideosUrl(playlistId);

    function normalize(items) {
        return items.map(item => {
            return {
                title: item.snippet.title,
                description: item.snippet.description,
                publishedAt: item.snippet.publishedAt,
                thumbnails: {
                    small: item.snippet.thumbnails.default.url,
                    medium: item.snippet.thumbnails.medium.url,
                    large: item.snippet.thumbnails.high.url,
                },
                position: item.snippet.position,
                videoId: item.contentDetails.videoId,
                privacyStatus: item.status.privacyStatus,
            };
        });
    }

    const videos = await fetchAuthPaginated(videosUrl, session.accessToken);

    return normalize(videos);
}

/**
 * Fetch details for a video by `videoId`, and normalize the resulting object
 * 
 * @param {*} session Next.js session object
 * @param {string} videoId id of video to fetch details
 * @returns video details
 */
async function fetchVideoDetails(session, videoId) {
    const videoDetailsUrl = getVideoDetailsUrl(videoId);

    function normalize(item) {
        let res = {
            tags: item.snippet.tags,
            categoryId: item.snippet.categoryId,
            duration: item.contentDetails.duration,
            viewCount: item.statistics.viewCount,
            likeCount: item.statistics.likeCount,
            commentCount: item.statistics.commentCount,
        };
        
        if(item.topicDetails && item.topicDetails.topicCategories) {
            res.topics = item.topicDetails.topicCategories;
        }

        return res;
    };

    const data = await fetchAuth(videoDetailsUrl, session.accessToken);

    // console.log(data.items[0]);

    return normalize(data.items[0]);
}

export {
    fetchAuth,
    fetchAuthPaginated,
    getChannelId,
    fetchSubscriptions,
    fetchChannelDetails,
    fetchPlaylistVideos,
    fetchVideoDetails,
};