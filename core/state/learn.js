const xstate = require('xstate');

const { createMachine, interpret, send } = xstate;

console.log(xstate);

const machine = createMachine({
  id: 'promise',
  initial: 'pending',
  states: {
    pending: {
      on: {
        RESOLVE: { target: 'resolved' },
        REJECT: { target: 'rejected' },
      },
    },
    resolved: {
      type: 'final',
    },
    rejected: {
      type: 'final',
    },
  },
});

const state = machine.initialState;

const s1 = interpret(machine).onTransition((state) => console.log('s1', state.value));

// Start the service
s1.start();
// => 'pending'

// s1.send({ type: 'RESOLVE' });
// => 'resolved'

console.log(machine);
