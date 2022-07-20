[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![docs](https://img.shields.io/badge/powered%20by-arcblock-green.svg)](https://docs.arcblock.io)
[![Gitter](https://badges.gitter.im/ArcBlock/community.svg)](https://gitter.im/ArcBlock/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

## Overview

This package exist for 2 purposes:

- Define core data structures and validators for DID Connect Protocol
- Provide a set of utilities that are widely used in ArcBlock implementation of DID Connect Protocol

Core data structures includes:

- DID Connect Request: a request to be fulfilled by DID Wallet
  - AgreementRequest
  - AssetRequest
  - AuthPrincipalRequest
  - PrepareTxRequest
  - ProfileRequest
  - SignatureRequest
  - VerifiableCredentialRequest;
- DID Connect Response: a response sent from DID Wallet to fulfill a request
  - TAgreementResponse
  - TAssetResponse
  - TAuthPrincipalResponse
  - TPrepareTxResponse
  - TProfileResponse
  - TSignatureResponse
  - TVerifiableCredentialResponse;
- DID Connect Session: the object that holds a running DID Connect session
- DID Connect Context: the object that holds the context of a running DID Connect session

Other utilities includes:

- AppInfo
- ChainInfo
- WalletInfo

## Install

```sh
npm install @did-connect/types
// or
yarn add @did-connect/types
```

## Usage

Using types:

```js
import type { TProfileRequest } from '@did-connect/types';
const profile: TProfileRequest = {
  type: 'profile',
  description: 'Request user profile',
  items: ['fullName'],
};
```

Using validators:

```js
import type { TProfileRequest } from '@did-connect/types';
import { ProfileRequest } from '@did-connect/types';

const { error, value } = ProfileRequest.validate({
  type: 'profile',
  description: 'Request user profile',
  items: ['fullName'],
});
```
