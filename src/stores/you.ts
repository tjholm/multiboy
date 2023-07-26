import { atom, computed } from 'nanostores';
import { gameState } from './game';
import { InputState } from '../lib/input-manager';

export const you = atom<string | undefined>(undefined);

type AvailableKeys = (keyof InputState)[];

const AllKeys: AvailableKeys = ['isPressingDown', 'isPressingUp', 'isPressingLeft', 'isPressingRight', 'isPressingA', 'isPressingB', 'isPressingSelect', 'isPressingStart'];
export const availableControls = computed([gameState, you], (gameState, you) => {
    switch(gameState.mode) {
        case 'chaos':
            // all the controls!!!
            return AllKeys;
        case 'hotseat':
            if (gameState.controllingPlayer === you) {
                // return all the controls
                return AllKeys;
            }

            // otherwise none of the controls
            return [];
        case 'shuffle':
            return gameState.inputMap[you] || [];
    }
});