[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![docs](https://img.shields.io/badge/powered%20by-arcblock-green.svg)](https://docs.arcblock.io)
[![Gitter](https://badges.gitter.im/ArcBlock/community.svg)](https://gitter.im/ArcBlock/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

## Overview

This package leverages xstate to define the state machine of a DID Connect Session, can be used both in the browser and node.js environment. It's the foundation of DID Connect UX libraries of `@did-connect/react` and `@did-connect/vue`.

## Install

```sh
npm install @did-connect/state
// or
yarn add @did-connect/state
```

## Usage

```ts
const { interpret } = require('xstate');
const { createStateMachine } = require('@did-connect/state');

const stateHistory = [];

const { machine } = createStateMachine({
  relayUrl: '/.well-known/service/api/connect/relay',
  dispatch: (...args) => service.send.apply(service, args),
  onConnect: (ctx, e) => {
    return [];
  },
  onApprove: (ctx) => ({}),
  onComplete: () => {},
  onCancel: (ctx, e) => {
    hasCanceled = true;
  },
});

const service = interpret(machine).onTransition((state) => {
  if (state.changed !== false) {
    stateHistory.push(state.value);
  }
});

service.start();
```

TODO: add node.js example for `blocklet connect`
