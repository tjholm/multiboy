import signal from './resources/signal';
import { Game, GuestConnection, GuestGameConnection, HostConnection, db } from './resources/db';

// Store connections for transmitting data
const gamesdb = db.allow('get', 'set', 'delete');

const encoder = new TextEncoder();

signal.on('connect', async (ctx) => {
    // get the guest or host query params
    const [ gameName ] = ctx.req.query['game'];
    const [ token ] = ctx.req.query['token'];

    try {
        // get the game
        const game = await gamesdb.get(`game|${gameName}`) as Game;

        if (game && token === game.hostToken) {
            // connect the host
            console.log('connecting a host');
            if (!game.hostConnectionId) {
                game.hostConnectionId = ctx.req.connectionId;

                // Create a document for the game host
                await gamesdb.set(`host|${ctx.req.connectionId}`, {
                    game: gameName,
                });
            } else {
                throw new Error('this game is already being hosted!!!')
            }
        } else if (game && token === game.guestToken) {
            console.log('connecting a guest');
            // create a guest connection in the DB and associate it with this game
            await gamesdb.set(`guest|${ctx.req.connectionId}`, {
                game: gameName,
            });
            await gamesdb.set(`game|${gameName}|guest|${ctx.req.connectionId}`, {});
        } else {
            // fail the connection
            throw new Error("Failed Authentication");
        }

        await gamesdb.set(`game|${gameName}`, game);
        
    } catch (e) {
        console.log(`error getting game: ${gameName}: ${e.message}`)
        // reject the connection request
        ctx.res.success = false;
    }

    return ctx;
});

signal.on('disconnect', async (ctx) => {
    // if they are a game host
    // we want to delete the game and connected clients
    const host = await gamesdb.get(`host|${ctx.req.connectionId}`).catch(() => null) as HostConnection | null;

    if (host) {
        console.log('disconnecting host');
        // disconnect the guests
        const guestGameConnectionKeyPrefix = `game|${host.game}|guest|`;
        // Send a message to each guest
        const guestKeys = gamesdb.keys(guestGameConnectionKeyPrefix);
        // for each guest connection send the message
        for await (const key of guestKeys) {
            const guestConnectionId = key.replace(guestGameConnectionKeyPrefix, '');

            // send the message to the guest
            await signal.close(guestConnectionId);
        }

        await gamesdb.delete(`game|${host.game}`);
        await gamesdb.delete(`host|${ctx.req.connectionId}`);

        return  ctx;
    }

    console.log('disconnecting guest');
    const guestConnection = await gamesdb.get(`guest|${ctx.req.connectionId}`) as GuestConnection;

    await gamesdb.delete(`guest|${ctx.req.connectionId}`);
    await gamesdb.delete(`game|${guestConnection.game}|guest|${ctx.req.connectionId}`);
});

const sendHost = async (gameName: string, data: Record<string, any>) => {
    const game = await gamesdb.get(`game|${gameName}`) as Game;

    const streamData = encoder.encode(JSON.stringify(data));

    console.log(`sending message to host: ${game.hostConnectionId}`);

    await signal.send(game.hostConnectionId!, streamData).catch(() => console.error('host connection not found'));
}

signal.on('message', async (ctx) => {
    // if they are a game host
    // we want to relay their messages to the intended guest
    const host = await gamesdb.get(`host|${ctx.req.connectionId}`).catch(() => null) as HostConnection || null;

    if (host) {
        const guestGameConnectionKeyPrefix = `game|${host.game}|guest|`;
        // Send a message to each guest
        const guestKeys = gamesdb.keys(guestGameConnectionKeyPrefix);
        // for each guest connection send the message
        for await (const key of guestKeys) {
            const guestConnectionId = key.replace(guestGameConnectionKeyPrefix, '');

            console.log(`sending message to guest: ${guestConnectionId}`);
            // send the message to the guest
            await signal.send(guestConnectionId, ctx.req.data);
        }

        return ctx;
    }

    const connection = await gamesdb.get(`guest|${ctx.req.connectionId}`) as GuestConnection;
    const data = ctx.req.json();
    
    await sendHost(connection.game, {
        connectionId: ctx.req.connectionId,
        ...data,
    });
});