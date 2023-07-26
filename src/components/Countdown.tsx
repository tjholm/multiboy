import React, { useEffect } from 'react';
import { gameState } from '../stores/game';
import { countdown } from '../stores/countdown';
import { useStore } from '@nanostores/react';

export default () => {
    const cd = useStore(countdown);
    const gs = useStore(gameState);

    // FIXME: Bad form coupling logic to this component, but adding here for now
    useEffect(() => {
        const interval = setInterval(() => countdown.set(countdown.get() - 1), 1000);

        return () => clearInterval(interval);
    }, []);

    return gs.mode === 'chaos' ? undefined : <div className="w-full text-center">{cd} seconds until next switch</div>;
}