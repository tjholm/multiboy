import { map, MapStore } from 'nanostores'
import { Input } from './strategy';

export type GameMode = 'chaos' | 'hotseat' | 'shuffle';

interface GameState<T extends GameMode> {
    mode: T,
}

export const CONTROL_KEYS: (keyof Input)[] = [
    "isPressingDown",
    "isPressingUp",
    "isPressingLeft",
    "isPressingRight",
    "isPressingA",
    "isPressingB",
    "isPressingSelect",
    "isPressingStart"
];

export const DEFAULT_STATES: Record<GameMode | 'default', GameStates> = {
    'chaos': {
        mode: 'chaos',
    },
    'hotseat': {
        mode: 'hotseat',
        controllingPlayer: 'host',
    },
    'shuffle': {
        mode: 'shuffle',
        inputMap: {
            'host': CONTROL_KEYS,
        },
    },
    'default': {
        mode: 'chaos',
    }
}

// All players are inputting at once
interface ChaosGameState extends GameState<'chaos'> {}

// Only one player is in control for a period of time and then switches to a new player
interface HotseatGamestate extends GameState<'hotseat'> {
    controllingPlayer: string;
}

interface ShuffleGameState extends GameState<'shuffle'> {
    inputMap: Record<string, (keyof Input)[]>;
}

export type GameStates = ChaosGameState | HotseatGamestate | ShuffleGameState;

export const gameState = map<GameStates>(DEFAULT_STATES['default']) as MapStore<GameStates>;