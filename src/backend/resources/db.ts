import { collection } from '@nitric/sdk';

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

export const db = collection<Game | GuestConnection>('db');