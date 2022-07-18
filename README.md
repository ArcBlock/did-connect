# DID Connect

This monorepo contains DID Connect implementation by ArcBlock.

The core workflow of DID Connect is shown the following diagram.

- Core: defines the core DID Connect data types and state machine
  - [@did-connect/types](./core/types)
  - [@did-connect/state](./core/state)
  - [@did-connect/authenticator](./core/authenticator)
  - [@did-connect/handler](./core/handler)
- Relay: defines and implements Session Storage and Relay Adapter
  - [@did-connect/storage](./relay/storage)
  - [@did-connect/storage-memory](./relay/storage-memory)
  - [@did-connect/storage-nedb](./relay/storage-nedb)
  - [@did-connect/storage-mongo](./relay/storage-mongo)
  - [@did-connect/adapter-express](./relay/adapter-express)
- UX: defines UI components that can be used in webapps to handle DID Connect workflow
  - [@did-connect/react](./ux/react)
  - [@did-connect/vue](./ux/vue)

## Contribute

- clone the repo: `git clone git@github.com:ArcBlock/did-connect.git`
- init the repo with `make init`
- open your pull request
