import React from 'react';
import { availableControls } from '../stores/you';
import { useStore } from '@nanostores/react';
import { InputState } from '../lib/input-manager';

const CONTROL_LEGEND: Record<keyof InputState, [string, string]> = {
    isPressingDown: ['down', 'down arrow'],
    isPressingUp: ['up', 'up arrow'],
    isPressingLeft: ['left', 'left arrow'],
    isPressingRight: ['right', 'right arrow'],
    isPressingA: ['a', 'z'],
    isPressingB: ['b', 'x'],
    isPressingSelect: ['select', 'right ctrl'],
    isPressingStart: ['start', 'enter'],
}

export default () => {
    const myControls = useStore(availableControls);

    return (
        <div className="flex flex-col gap-2">
            {myControls.length === 0 ? <span>Not your turn</span> : <span>Available Controls:</span> }
            <ul>
                {myControls.map(c => {
                    const [button, keyName] = CONTROL_LEGEND[c];
                    return <li>{button}: {keyName}</li>
                })}
            </ul>
        </div>
    );
}