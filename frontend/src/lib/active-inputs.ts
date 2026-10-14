import type { Input } from '../stores/strategy';

// A disconnected guest's last message must not keep a button pressed.
export function activeInputs(host: Input, guestInputs: Record<string, Input>, connectedGuests: string[]): Record<string, Input> {
    return Object.fromEntries([
        ...connectedGuests.filter(id => guestInputs[id]).map(id => [id, guestInputs[id]]),
        ['host', host],
    ]);
}
