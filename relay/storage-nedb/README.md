[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

## Introduction

DID Connect session storage engine that uses [nedb](https://www.npmjs.com/package/nedb) to store data, implements interfaces defined in `@did-connect/storage`.

## Install

```sh
npm install @did-connect/storage-nedb
// or
yarn add @did-connect/storage-nedb
```

## Usage

```js
const { NedbStorage } = require('@did-connect/storage-nedb');

const storage = new NedbStorage({
  dbPath: '/path/to/db',
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
