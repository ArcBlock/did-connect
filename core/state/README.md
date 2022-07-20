[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![docs](https://img.shields.io/badge/powered%20by-arcblock-green.svg)](https://docs.arcblock.io)
[![Gitter](https://badges.gitter.im/ArcBlock/community.svg)](https://gitter.im/ArcBlock/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

## Overview

This library is implemented according to [ABT-DID-Protocol](https://github.com/ArcBlock/abt-did-spec), aiming to make it easier for developers to handle customized DID Connect Sessions in Node.js applications, and should always be used together with [DID Connect UX package](https://www.npmjs.com/package/@did-connect/react), if you are composing a blocklet, you may find the wrapped implementation in [Blocklet SDK](https://www.npmjs.com/package/@blocklet/sdk) more useful.

Within a typical DID Connect Session, the application may request user to sign a transaction or provide some information, such as:

- Provide a user profile, which may contain name, email
- Prove ownership of a NFT
- Prove ownership of a passport

The following diagram demonstrates how a typical DID Connect Session works:

![](./docs/workflow.png)

`Claim` is the key concept in DID Connect Session, its used by the application to send specification of required info to finish the session. A claim is identified by `type`, and defined with a set of properties. Checkout the claim section for more information.

## Install

```sh
npm install @arcblock/did-auth
// or
yarn add @arcblock/did-auth
```

## Usage
