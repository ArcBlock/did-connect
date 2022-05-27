# [**@did-connect/storage-firebase**](https://github.com/ArcBlock/did-connect)

[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

> Storage engine that uses firebase to store data, implements interfaces defined in `@did-connect/storage`.


## Table of Contents

* [Install](#install)
* [Usage](#usage)
* [Contributors](#contributors)


## Install

```sh
npm install @did-connect/storage-firebase firebase-admin
// or
yarn add @did-connect/storage-firebase firebase-admin
```


## Usage

```js
const { Handlers, Authenticator } = require('@arcblock/did-auth');
const FirebaseStorage = require('@did-connect/storage-firebase');
const firebase = require('firebase-admin');

const connection = firebase.initializeApp({
  credential: firebase.credential.cert('path/to/serviceAccountCredentials.json'),
  databaseURL: 'https://databaseName.firebaseio.com',
});

const storage = new FirebaseStorage({
  database: connection.database(),
  tokens: 'did_auth_tokens',
})

(async () => {
  const token = '123456';
  const item = await storage.create(token);
})();
```


## Contributors

| Name           | Website                    |
| -------------- | -------------------------- |
| **wangshijun** | <https://ocap.arcblock.io> |