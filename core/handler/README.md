[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![docs](https://img.shields.io/badge/powered%20by-arcblock-green.svg)](https://docs.arcblock.io)
[![Gitter](https://badges.gitter.im/ArcBlock/community.svg)](https://gitter.im/ArcBlock/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

## Overview

This package defines the core handlers of a DID Connect relay, the handlers fall into two categories:

- HTTP handlers
  - `handleSessionCreate`: create a new session and persist it to storage
  - `handleSessionRead`: read a session from storage
  - `handleSessionUpdate`: update a session in storage, updates are limited
  - `handleSessionDelete`: delete a session from storage
  - `handleClaimRequest`: verify DID Wallet and send DID Connect requests
  - `handleClaimResponse`: verify DID Wallet and parse DID Connect responses
- WebSocket handlers
  - `wsServer`: a WebSocket server that can be attached to a HTTP server and used to broadcast session change events to client

## Notice

This package is baked into Blocklet Service and DID Connect Relay blocklet, you should not use it directly in any application.
