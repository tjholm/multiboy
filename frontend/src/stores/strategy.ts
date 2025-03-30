import { computed } from 'nanostores';
import { gameState } from './game';

export type Input = {
    isPressingDown: boolean,
    isPressingUp: boolean,
    isPressingLeft: boolean,
    isPressingRight: boolean,
    isPressingA: boolean,
    isPressingB: boolean,
    isPressingSelect: boolean,
    isPressingStart: boolean,
};

type FilterMap = {
    [key: string]: (keyof Input)[]
}

type InputMap = Record<string, Input>;

const DEFAULT_INPUT: Input = {
    isPressingDown: false,
    isPressingUp: false,
    isPressingLeft: false,
    isPressingRight: false,
    isPressingA: false,
    isPressingB: false,
    isPressingSelect: false,
    isPressingStart: false,
};

type InputStrategy = (inputs: InputMap) => Input;

// merge all truthy values
export const chaos: InputStrategy = (inputs) => {
    return Object.values(inputs).reduce((acc, input) => {
        Object.keys(acc).forEach((k) => {
            acc[k] = acc[k] || input[k]
        });

        return acc;
    }, { ...DEFAULT_INPUT });
};

// accept inputs from a single player
// this can be used to facilitate hotseat play
export const selective: (id: string) => InputStrategy = (id) => (inputs) => {
    return inputs[id] || DEFAULT_INPUT;
};

// accepts only specific inputs from each user
// (i.e each user can only press specific buttons)
export const octodad: (filters: FilterMap) => InputStrategy = (filters) => (inputs) => {
    return Object.entries(inputs).reduce((acc, [id, input]) => {
        Object.keys(acc).filter(k => filters[id] && filters[id].includes(k as keyof Input)).forEach((k) => {
            acc[k] = acc[k] || input[k];
        });

        return acc;
    }, { ...DEFAULT_INPUT });
};

export const strategy = computed(gameState, (state) => {
    switch(state.mode) {
        case 'chaos':
            return chaos;
        case 'hotseat':
            return selective(state.controllingPlayer);
        case 'shuffle':
            return octodad(state.inputMap);
        default:
            return chaos;
    }
});