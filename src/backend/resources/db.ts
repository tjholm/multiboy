import { kv } from '@nitric/sdk';

// define available key permutations
// game|<gameName> -> Game
// guest|<connectionId> -> GuestConnection
// host|<connectionId> -> HostConnection
// game|<gameName>|guest|<connectionId> -> GuestGameConnection

export interface Game {
    // The connection ID of the host
    hostConnectionId?: string,
    // The hosts connection token (that they will use to authenticate with the game)
    hostToken: string,
    // The token guests use to connect
    guestToken: string,
}

export interface GuestConnection {
    game: string;
}

export interface GuestGameConnection {}

export interface HostConnection {
    game: string;
}

export const db = kv<Game | GuestConnection | HostConnection | GuestGameConnection>('db');