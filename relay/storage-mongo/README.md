[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

## Introduction

DID Connect session storage engine that uses mongodb to store data, implements interfaces defined in `@did-connect/storage`.

## Install

```sh
npm install @did-connect/storage-mongo
// or
yarn add @did-connect/storage-mongo
```

## Usage

```js
const { MongoStorage } = require('@did-connect/storage-mongo');

const storage = new MongoStorage({
  url: 'mongodb://localhost/did-connect-demo',
  collection: 'did-connect-sessions',
});

// Listen on events of the storage
storage.on('create', (d) => console.log('create', d));
storage.on('update', (d) => console.log('update', d));
storage.on('destroy', (d) => console.log('destroy', d));

(async () => {
  const sessionId = '123456';
  const item = await storage.create(sessionId);
})();
```
