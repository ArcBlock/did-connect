# DID Connect

DID Connect is a decentralized identity protocol that enables seamless connection between decentralized identity and decentralized services.

This monorepo contains DID Connect implementation by ArcBlock. the implementation can be divided into 3 parts:

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

The implementation also includes a few blocklets that can be used to test the implementation.

- DID Connect Relay: Relay server implementation built on top of express
- DID Connect React: React UI component playground for DID Connect

## Contribute

- clone the repo: `git clone git@github.com:ArcBlock/did-connect.git`
- init the repo with `make init`
- build the repo: `make build`, this step is required before you run any blocklets
- start the relay server: `cd relay/server && blocklet dev install && blocklet dev start`
- start the storybook: `cd ux/react && blocklet dev install && blocklet dev start`
- play with the demo and open your pull request
- make sure `make lint` and `make coverage` pass before your PR
