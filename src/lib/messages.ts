import { GameStates } from "../stores/game";
import { InputState } from "./input-manager";


type HostMessageTypes = 'game'
interface BaseHostMessage<T extends HostMessageTypes> {
    type: T
}

type GameStateMessage = { state: GameStates & { you: string, forSeconds?: number } } & BaseHostMessage<'game'>;

export type HostMessage = GameStateMessage;

type GuestMessageTypes = 'input';

interface BaseGuestMessage<T extends GuestMessageTypes> {
    type: T;
}

type InputMessage = BaseGuestMessage<'input'> & {
    inputs: InputState
};

export type GuestMessages = InputMessage;