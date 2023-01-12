import Surreal from 'surrealdb.js';
import { getChannelId } from './fetch';

//create database
const db = new Surreal('http://127.0.0.1:8000/rpc');

async function init() {
    // Connect to database
    await db.signin({
        user: 'root',
        pass: 'root',
    });

    // use namespace and db
    await db.use('yt-dig', 'yt-dig');
}

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
            requiresUpdate: true,
        }

        // insert
        const results = await db.create(`user:${userId}`, user);
        return results[0];
    }
}

async function selectUserSubscriptions(user) {
    const q = await db.query('SELECT subscriptions.*.* FROM $user', {
        user: user,
    });
    // console.log(q[0].result[0].subscriptions);

    return q[0].result[0].subscriptions;
}

async function associateRecordViaField(recordId, recordField, foreignTable, foreignId) {
    const q = `UPDATE $recordId SET ${recordField} += type::thing($tb, $id)`;
    // console.log(`UPDATE ${recordId} SET ${recordField} += type::thing(${foreignTable}, ${foreignId})`);
    const res = await db.query(q, {
        recordId: recordId,
        tb: foreignTable,
        id: foreignId,
    });

    // return total number of records associated to the recordField
    return res[0].result[0][recordField].length;
}

/**
 * Update existing channel object, or create a new one, and return result.
 * 
 * @param {string} id id of channel
 * @param {Object} channel channel object to update/create
 * @returns {Object} channel object
 */
 async function updateOrCreate(table, object, id) {
    try {
        // console.log('==== updateOrCreate ====');
        // console.log(id);
        // console.log(object);
        const results = await db.select(`${table}:\`${id}\``);
        return results[0];
    } catch (err) {
        // console.log(err);
        console.log('object not found, creating...', id);
        
        const results = await db.create(`${table}:\`${id}\``, object);
        // console.log(results);

        // account for difference in query results returning obj/array
        if(typeof(results) === 'object') {
            return results;
        }

        return results[0];
    }
}

export {
    init,
    updateOrCreate,
    findOrCreateUser,
    selectUserSubscriptions,
    associateRecordViaField,
    db,
}