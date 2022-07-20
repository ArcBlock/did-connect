[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

## Introduction

DID Connect session storage engine that uses memory to store data, implements interfaces defined in `@did-connect/storage`.

## Install

```sh
npm install @did-connect/storage-memory
// or
yarn add @did-connect/storage-memory
```

## Usage

```js
const { MemoryStorage } = require('@did-connect/storage-memory');

const storage = new MemoryStorage();

(async () => {
  const sessionId = '123456';
  const item = await storage.create(sessionId);
})();
```
