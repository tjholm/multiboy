const DOWN = 'ArrowDown';
const UP = 'ArrowUp';
const LEFT = 'ArrowLeft';
const RIGHT = 'ArrowRight';

const A = 'KeyZ';
const B = 'KeyX';

const START = 'Enter';
const SELECT = 'ControlRight';

export interface InputState {
    isPressingDown: boolean,
    isPressingUp: boolean,
    isPressingLeft: boolean,
    isPressingRight: boolean,
    isPressingA: boolean,
    isPressingB: boolean,
    isPressingSelect: boolean,
    isPressingStart: boolean,
}

export class KeyboardManager {
    input: InputState = {
        isPressingDown: false,
        isPressingUp: false,
        isPressingLeft: false,
        isPressingRight: false,
        isPressingA: false,
        isPressingB: false,
        isPressingSelect: false,
        isPressingStart: false,
    };

    changeListener = null;

    constructor() {
        document.addEventListener('keydown', event => this.handleKeyEvent(event.code, true));
        document.addEventListener('keyup', event => this.handleKeyEvent(event.code, false));
    }

    handleKeyEvent(keyCode, isPressed) {
        if (keyCode === DOWN && this.input.isPressingDown !== isPressed) {
            this.input.isPressingDown = isPressed;
            this.changeListener && this.changeListener();
        }

        if (keyCode === UP && this.input.isPressingUp !== isPressed) {
            this.input.isPressingUp = isPressed;
            this.changeListener && this.changeListener();
        }

        if (keyCode === LEFT && this.input.isPressingLeft !== isPressed) {
            this.input.isPressingLeft = isPressed;
            this.changeListener && this.changeListener();
        }

        if (keyCode === RIGHT && this.input.isPressingRight !== isPressed) {
            this.input.isPressingRight = isPressed;
            this.changeListener && this.changeListener();
        }

        if (keyCode === A && this.input.isPressingA !== isPressed) {
            this.input.isPressingA = isPressed;
            this.changeListener && this.changeListener();
        }

        if (keyCode === B && this.input.isPressingB !== isPressed ) {
            this.input.isPressingB = isPressed;
            this.changeListener && this.changeListener();
        }

        if (keyCode === START && this.input.isPressingStart !== isPressed) {
            this.input.isPressingStart = isPressed;
            this.changeListener && this.changeListener();
        }

        if (keyCode === SELECT && this.input.isPressingSelect !== isPressed) {
            this.input.isPressingSelect = isPressed;
            this.changeListener && this.changeListener();
        }
    }

    // callback on change
    onChange(func) {
        this.changeListener = func;
    }
}

export default new KeyboardManager();
