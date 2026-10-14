const { test } = require('node:test');
const assert = require('node:assert/strict');
const { activeInputs } = require('../frontend/src/lib/active-inputs');
const { chaos } = require('../frontend/src/stores/strategy');

const released = {
    isPressingDown: false, isPressingUp: false, isPressingLeft: false,
    isPressingRight: false, isPressingA: false, isPressingB: false,
    isPressingSelect: false, isPressingStart: false,
};

test('a disconnected guest cannot keep a button pressed in chaos mode', () => {
    const guestInputs = { guest1: { ...released, isPressingA: true } };
    assert.equal(chaos(activeInputs(released, guestInputs, ['guest1'])).isPressingA, true);
    assert.equal(chaos(activeInputs(released, guestInputs, [])).isPressingA, false);
    assert.equal(chaos(activeInputs(released, guestInputs, ['guest2'])).isPressingA, false);
});

test('host input remains active', () => {
    const inputs = activeInputs({ ...released, isPressingB: true }, {}, []);
    assert.equal(chaos(inputs).isPressingB, true);
});
