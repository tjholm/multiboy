import signal from './resources/signal';
import { Game, GuestConnection, db } from './resources/db';

// Store connections for transmitting data
const gamesdb = db.for('reading', 'writing', 'deleting');

const encoder = new TextEncoder();

signal.on('connect', async (ctx) => {
    // get the guest or host query params
    const [ gameName ] = ctx.req.query['game'];
    const [ token ] = ctx.req.query['token'];

    try {
        // get the game
        const game = await gamesdb.doc(`game|${gameName}`).get() as Game;

        if (game && token === game.hostToken) {
            // connect the host
            console.log('connecting a host');
            if (!game.hostConnectionId) {
                game.hostConnectionId = ctx.req.connectionId;
                // update the game
            } else {
                throw new Error('this game is already being hosted!!!')
            }
            
        } else if (game && token === game.guestToken) {
            console.log('connecting a guest');
            // create a guest connection in the DB and associate it with this game
            await gamesdb.doc(`connection|${ctx.req.connectionId}`).set({
                game: gameName,
            });
        } else {
            // fail the connection
            throw new Error("Failed Authentication");
        }

        await gamesdb.doc(`game|${gameName}`).set(game);
        
    } catch (e) {
        console.log(`error getting game: ${gameName}: ${e.message}`)
        // reject the connection request
        ctx.res.success = false;
    }

    return ctx;
});

signal.on('disconnect', async (ctx) => {
    const resp = await gamesdb.query().where('hostConnectionId', '==', ctx.req.connectionId).limit(1).fetch();
    if(resp.documents.length > 0) {
        const document = resp.documents[0];
        const gameName = document.id.split('|')[1];
        // we know they're a game host
        // delete the game and connected clients
        const connections = gamesdb.query().where('game', '==', gameName).stream();

        // close the client connection
        const streamPromise = new Promise<any>(res => {
            connections.on('end', res);
        });

        connections.on('data', async (data) => {
            const connectionId = data.id.split('|')[1];
            // tell the clients the stream is over
            await signal.close(connectionId);
        });

        await streamPromise;

        // delete the game
        console.log('disconnecting host');
        await gamesdb.doc(document.id).delete();
        
        return ctx;
    }

    // remove the client from the client connection pool
    console.log('disconnecting guest');
    await gamesdb.doc(`connection|${ctx.req.connectionId}`).delete();
});

const sendHost = async (gameName: string, data: Record<string, any>) => {
    const game = await gamesdb.doc(`game|${gameName}`).get() as Game;

    const streamData = encoder.encode(JSON.stringify(data));

    await signal.send(game.hostConnectionId!, streamData);
}

signal.on('message', async (ctx) => {
    // if they are a game host
    // we want to relay their messages to the intended guest
    const resp = await gamesdb.query().where('hostConnectionId', '==', ctx.req.connectionId).limit(1).fetch();
    if(resp.documents.length > 0) {
        // responses are for handshakes with guests so should contain the guests original connection ID
        // we'll use this to respond directly to them
        const msg = ctx.req.json();
        if (!msg.connectionId) {
            ctx.res.success = false;
            return ctx
        }

        await signal.send(msg.connectionId, ctx.req.data);

        return ctx;
    }

    // otherwise they are a guest
    // we want to relay their message to the host
    const connection = await gamesdb.doc(`connection|${ctx.req.connectionId}`).get() as GuestConnection;
    const data = ctx.req.json();
    
    await sendHost(connection.game, {
        connectionId: ctx.req.connectionId,
        ...data,
    });
});