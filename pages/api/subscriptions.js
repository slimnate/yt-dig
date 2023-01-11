import { authOptions } from "./auth/[...nextAuth]";
import { unstable_getServerSession } from "next-auth/next";
import Surreal from 'surrealdb.js';
import moment from "moment";
import { fetchAuth, fetchAuthPaginated, fetchChannelDetails, fetchSubscriptions, getChannelId } from "../../lib/fetch";

const db = new Surreal('http://127.0.0.1:8000/rpc');

/**
 * Search the database for an existing user based on `session.user.id`, returning
 * that user if found, otherwise create a new user object, insert into db, and
 * return that user object.
 * 
 * @param {Object} session web session
 * @returns {Object} user object
 */
async function findOrCreateUser(session) {
    const userId = session.user.id;

    // get channelId
    const channelId = await getChannelId(session);

    try {
        const results = await db.select(`user:${userId}`);
        return results[0];
    } catch (err) {
        console.log('user not found, creating...');
        const user = {
            channelId: channelId,
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
            subscriptions: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            subscriptionsUpdatedAt: new Date(),
        }

        // insert
        const results = await db.create(`user:${userId}`, user);
        return results[0];
    }
}

/**
 * Check the last updated time for the current user, and if it was more than 24 hours ago,
 * request a new list of subscriptions from the Youtube API, update the database, and return
 * the new data.
 * @param {Object} session current web session
 * @returns {[Object]} list of subscriptions
 */
async function getSubscriptions(session, user) {
    // console.log(user);
    const now = moment(new Date());
    const oneDayAgo = now.subtract(1, 'day');
    const lastUpdate = moment(user.subscriptionsUpdatedAt);

    console.log(`oneDayAgo`, oneDayAgo);
    console.log(`lastUpdate`, lastUpdate);

    if(true){//lastUpdate.isBefore(oneDayAgo) /* TODO check if newly created account */) {
        // get subs from Youtube API
        console.log(`Last updated: ${lastUpdate}, refreshing Youtube data`);
        const newSubscriptions = await fetchSubscriptions(session);

        // console.log(newSubscriptions);

        // update all subscribed channels in the database
        const updatedChannelCount = await updateOrCreateChannels(session, newSubscriptions);

        // update user with references to subscribed channels
        const updatedUserChannelCount = await updateSubscriptionsOnUser(user, newSubscriptions);
    }

    // TODO get subs from database
    // console.log('query');
    const q = await db.query('SELECT subscriptions.*.* FROM $user', {
        user: user,
    });
    // console.log(q[0].result[0].subscriptions);

    return q[0].result[0].subscriptions;
}

/**
 * Associate the provided `channels` with the provided `user` in the database
 * 
 * @param {object} user the user object to update
 * @param {channel[]} channels list of channels to associate with user
 * @return number of subs added to user
 */
async function updateSubscriptionsOnUser(user, channels) {
    // clear subscriptions so unsubbed channels will be pruned every update
    db.change(user.id, { subscriptions: [] });

    console.log(`adding ${channels.length} subscriptions`);
    let added = 0;

    // associate each subscription to the user
    for(const channel of channels) {
        try {
            const res = await db.query(`UPDATE $user SET subscriptions += type::thing($tb, $id)`, {
                user: user.id,
                tb: 'channel',
                id: channel.channelId,
            });
            console.log(res[0].result[0].subscriptions.length);
            added++;
        } catch(err) {
            console.log(`error: ${err}`);
        }
    }

    console.log(`added ${added} subs to user`);

    return added;
}

/**
 * Update or create a collection of different channels in the database
 * 
 * @param {object} session current Next.js session
 * @param {channel[]} subscriptions list of channels to update or create in the database
 * @return number of channels updated
 */
async function updateOrCreateChannels(session, subscriptions) {
    console.log(`updating ${subscriptions.length} new channels...`);
    let updated = 0;

    function merge(channel, details) {
        return {
            ...channel,
            ...details
        };
    }

    for(const channel of subscriptions) {
        // console.log(channel);
        const details = await fetchChannelDetails(session, channel.channelId);
        const channelDetails = merge(channel, details);

        // console.log('channelDetails', channelDetails);

        // TODO fetch and update videos for the channel
        
        await updateOrCreateChannel(channel.channelId, channelDetails);
        updated++;
    }

    console.log(`updated ${updated} channels successfully`);
    return updated;
}

/**
 * Update existing channel object, or create a new one, and return result.
 * 
 * @param {string} id id of channel
 * @param {Object} channel channel object to update/create
 * @returns {Object} channel object
 */
async function updateOrCreateChannel(id, channel) {
    try {
        // console.log(id);
        const results = await db.select(`channel:\`${id}\``);
        return results[0];
    } catch (err) {
        console.log(err);
        console.log('channel not found, creating...', id);
        
        const results = await db.create(`channel:\`${id}\``, channel);
        return results[0];
    }
}

export default async function handler(req, res) {
    const session = await unstable_getServerSession(req, res, authOptions);

    if(!session) {
        res.status(401).json({message: 'Must be logged in to access subscriptions API'});
        return;
    }

    // Connect to database
    await db.signin({
        user: 'root',
        pass: 'root',
    });

    await db.use('yt-dig', 'yt-dig');

    const user = await findOrCreateUser(session);

    const subscriptions =  await getSubscriptions(session, user);

    // console.log('subscriptions', subscriptions);
    // console.log('user', user);

    return res.json(subscriptions);
};