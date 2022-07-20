[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

## Introduction

Defines the interface for DID Connect Session Storage, basic APIs that a session storage includes:

- `async create(session, attrs)`, create a new session record, persist in storage
- `async read(session)`, read a session from storage,
- `async update(session, updates)`, update session record
- `async delete(session)`, remove a session record

## Install

```sh
npm install @did-connect/storage
// or
yarn add @did-connect/storage
```

## Usage

```js
const { BaseStorage } = require('@did-connect/storage');
const keystone = require('keystone');

module.exports = class KeystoneStorage extends BaseStorage {
  constructor() {
    this.model = keystone.list('sessions').model;
  }

  create(sessionId, attrs) {
    const LoginToken = this.model;
    const item = new LoginToken({ sessionId, ...attrs });
    return item.save();
  }

  read(sessionId) {
    return this.model.findOne({ sessionId });
  }

  update(sessionId, updates) {
    return this.model.findOneAndUpdate({ sessionId }, updates);
  }

  delete(sessionId) {
    return this.model.remove({ sessionId });
  }
};
```
