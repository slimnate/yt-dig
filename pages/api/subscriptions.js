import { authOptions } from "./auth/[...nextAuth]";
import { unstable_getServerSession } from "next-auth/next";
import Subscriptions from "../../components/Subscriptions";

const channelUrl = 'https://youtube.googleapis.com/youtube/v3/channels?part=id&mine=true';
const getSubscriptionsUrl = (channelId) => `https://youtube.googleapis.com/youtube/v3/subscriptions?part=snippet%2CcontentDetails&maxResults=50&channelId=${channelId}`;


function fetchAuth(url, accessToken) {
    return fetch(url, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
        },
    });
}

async function getChannelId(session) {
    if(!session.channel_id) {
        const res = await fetchAuth(channelUrl, session.accessToken);
        const data = await res.json();
        const channelId = data.items[0].id;
        session.channel_id = channelId;
        
        return channelId;
    }

    console.log('using stored channel_id from session');
}

async function getSubscriptions(session) {
    const subscriptions = [];
    const subsUrl = getSubscriptionsUrl(session.channel_id);

    function normalize(items) {
        return items.map(item => {
            return {
                channelId: item.snippet.channelId,
                title: item.snippet.title,
                description: item.snippet.description,
                thumbnails: item.snippet.thumbnails
            };
        });
    }

    let res = await fetchAuth(subsUrl, session.accessToken);
    let data = await res.json();
    let nextPageToken = data.nextPageToken;

    subscriptions.push(...normalize(data.items));
    
    while(nextPageToken) {
        console.log(`fetching net page of results: ${nextPageToken}`);
        res = await fetchAuth(`${subsUrl}&pageToken=${nextPageToken}`, session.accessToken);
        data = await res.json();
        nextPageToken = data.nextPageToken;
        subscriptions.push(...normalize(data.items));
    }

    return subscriptions;
}

export default async function handler(req, res) {
    const session = await unstable_getServerSession(req, res, authOptions);

    if(!session) {
        res.status(401).json({message: 'Must be logged in to access subscriptions API'});
        return;
    }

    const channelId = await getChannelId(session);
    const subscriptions =  await getSubscriptions(session);

    // console.log('channelId', channelId);
    // console.log('subscriptions', subscriptions);

    return res.json(subscriptions);
};