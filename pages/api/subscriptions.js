import { authOptions } from "./auth/[...nextAuth]";
import { unstable_getServerSession } from "next-auth/next";
import moment from "moment";
import { fetchChannelDetails, fetchPlaylistVideos, fetchSubscriptions, fetchVideoDetails, getChannelId } from "../../lib/fetch";
import { associateRecordViaField, db, findOrCreateUser, init, selectUserSubscriptions, updateOrCreate } from "../../lib/database";
import { merge } from "../../lib/object";

/**
 * Check the last updated time for the current user, and if it was more than 24 hours ago,
 * request a new list of subscriptions from the Youtube API, update the database, and return
 * the new data.
 * @param {Object} session current web session
 * @returns list of subscriptions
 */
async function updateSubscriptions(session, user) {
    const now = moment(new Date());
    const oneDayAgo = now.subtract(1, 'day');
    const lastUpdate = moment(user.subscriptionsUpdatedAt);

    console.log(`oneDayAgo`, oneDayAgo);
    console.log(`lastUpdate`, lastUpdate);

    if(lastUpdate.isBefore(oneDayAgo) || user.requiresUpdate) {
        // get subs from Youtube API
        console.log(`Last updated: ${lastUpdate}, refreshing Youtube data`);
        const channels = await fetchSubscriptions(session);

        // update all subscribed channels in the database
        const updatedChannelCount = await updateChannels(session, user, channels);

        db.change(user.id, { requiresUpdate: false});
    }

    return await selectUserSubscriptions(user);
}

/**
 * Update or create a collection of different channels in the database
 * 
 * @param {object} session current Next.js session
 * @param {channel[]} channels list of channels to update or create in the database
 * @return number of channels updated
 */
async function updateChannels(session, user, channels) {
    console.log(`updating ${channels.length} channels...`);
    let updated = 0;

    db.change(user.id, { subscriptions: [] });

    for(const c of channels) {
        // fetch and merge channel details
        const details = await fetchChannelDetails(session, c.channelId);
        const merged = merge(c, details);

        // update/create channel record
        const channel = await updateOrCreate('channel', merged, merged.channelId);

        // associate channel with user
        await associateRecordViaField(user.id, 'subscriptions', 'channel', channel.id);

        // fetch videos
        const videos = await fetchPlaylistVideos(session, channel.uploadPlaylistId);

        // update videos
        const videosUpdatedCount = await updateVideos(session, channel, videos);

        console.log(`added ${videosUpdatedCount} videos for ${channel.id}`);

        updated++;
    }

    console.log(`updated ${updated} channels successfully`);
    return updated;
}

async function updateVideos(session, channel, videos) {
    // console.log(`updating ${videos.length} videos...`);
    let updated = 0;

    db.change(channel.id, { videos: [] });

    for (const v of videos.slice(0, 1)) {
        // fetch video details
        const details = await fetchVideoDetails(session, v.videoId);
        const merged = merge(v, details);

        // update/create video
        const video = await updateOrCreate('video', merged, merged.videoId);

        await associateRecordViaField(channel.id, 'videos', 'video', video.id);
        updated++;
    }

    return updated;
}

export default async function handler(req, res) {
    const session = await unstable_getServerSession(req, res, authOptions);

    if(!session) {
        res.status(401).json({message: 'Must be logged in to access subscriptions API'});
        return;
    }

    // init database
    init();

    // get user
    const user = await findOrCreateUser(session);

    // update subscriptions
    let subscriptions = await updateSubscriptions(session, user);

    // console.log('subscriptions', subscriptions);
    // console.log('user', user);

    return res.json(subscriptions);
};