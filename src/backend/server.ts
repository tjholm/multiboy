import { http } from "@nitric/sdk";
import express from "express"
import { generateUsername } from "unique-username-generator";
import { db } from './resources/db';
import short from 'short-uuid';
import signal from "./resources/signal";

const MAX_AGE = process.env.MAX_AGE || 3600000;

// Store connections for transmitting data
const gamesdb = db.for('reading', 'writing', 'deleting');

const app = express();

app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    next();
});
// host static assets
app.use(express.static('./public', { maxAge: MAX_AGE }));

// use express json middleware
app.use(express.json());

// get the websocket address
app.get("/address", async (req, res) => {
    const url =  await signal.url();
    res.status(200).contentType('text/plain').send(url);
});

// create a new game (should be a POST but being lazy...)
app.post("/game", async (req, res) => {
    // generate a unique random name for the game
    const gameName = generateUsername('-')

    // generate host and guest tokens for authentication
    const hostToken = short.generate();
    const guestToken = short.generate();

    // create the new game and redirect to the host portal
    await gamesdb.doc(`game|${gameName}`).set({
        guestToken,
        hostToken,
    });

    res.status(201).json({
        name: gameName,
        guestToken,
        hostToken,
    }).send();
});

http(app);
