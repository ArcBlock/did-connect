## Classes

<dl>
<dt><a href="#AgentAuthenticator">AgentAuthenticator</a> ⇐ `<a href="#WalletAuthenticator">WalletAuthenticator</a>`</dt>
<dd></dd>
<dt><a href="#WalletAuthenticator">WalletAuthenticator</a></dt>
<dd></dd>
<dt><a href="#BaseHandler">BaseHandler</a></dt>
<dd></dd>
<dt><a href="#WalletHandlers">WalletHandlers</a> ⇐ `EventEmitter`</dt>
<dd></dd>
<dt><a href="#WalletHandlers">WalletHandlers</a></dt>
<dd></dd>
<dt><a href="#AgentWalletHandlers">AgentWalletHandlers</a></dt>
<dd></dd>
</dl>


## Typedefs

<dl>
<dt><a href="#ApplicationInfo">ApplicationInfo</a></dt>
<dd></dd>
<dt><a href="#ChainInfo">ChainInfo</a></dt>
<dd></dd>
</dl>


## AgentAuthenticator ⇐ [`WalletAuthenticator`](#WalletAuthenticator)

**Kind**: global class\
**Extends**: [`WalletAuthenticator`](#WalletAuthenticator)

* [AgentAuthenticator](#AgentAuthenticator) ⇐ [`WalletAuthenticator`](#WalletAuthenticator)
  * [new AgentAuthenticator()](#new_AgentAuthenticator_new)
  * [sign(params)](#AgentAuthenticator+sign) ⇒ `object`
  * [uri(params)](#WalletAuthenticator+uri) ⇒ `string`
  * [getPublicUrl(pathname, params)](#WalletAuthenticator+getPublicUrl) ⇒ `string`
  * [signResponse(params, baseUrl, request)](#WalletAuthenticator+signResponse) ⇒ `object`
  * [getChainInfo(params, info)](#WalletAuthenticator+getChainInfo) ⇒ [`ChainInfo`](#ChainInfo)
  * [getAppInfo(params, info)](#WalletAuthenticator+getAppInfo) ⇒ [`ApplicationInfo`](#ApplicationInfo)
  * [verify(data, \[locale\], \[enforceTimestamp\])](#WalletAuthenticator+verify) ⇒

### new AgentAuthenticator()

Authenticator that can be used to sign did-auth payment on-behalf of another application
Can be used to build centralized platform services that aims to ease the life of developers

### agentAuthenticator.sign(params) ⇒ `object`

Sign a auth response that returned to wallet: tell the wallet the appInfo/chainInfo

**Kind**: instance method of [`AgentAuthenticator`](#AgentAuthenticator)\
**Overrides**: [`sign`](#WalletAuthenticator+sign)\
**Returns**: `object` - { appPk, authInfo }

| Param                     | Type     | Description                                                 |
| ------------------------- | -------- | ----------------------------------------------------------- |
| params                    | `object` |                                                             |
| params.context.token      | `string` | action token                                                |
| params.context.userDid    | `string` | decoded from req.query, base58                              |
| params.context.userPk     | `string` | decoded from req.query, base58                              |
| params.context.didwallet  | `object` | DID Wallet OS and version from user-agent                   |
| params.context.sessionDid | `string` | did of logged-in user                                       |
| params.claims             | `object` | info required by application to complete the auth           |
| params.appInfo            | `object` | which application authorized me to sign                     |
| params.authorizer         | `object` | application pk and did                                      |
| params.verifiableClaims   | `object` | what did the application authorized me to request from user |
| params.extraParams        | `object` | extra query params and locale                               |

### agentAuthenticator.uri(params) ⇒ `string`

Generate a deep link url that can be displayed as QRCode for DID Wallet to consume

**Kind**: instance method of [`AgentAuthenticator`](#AgentAuthenticator)

| Param           | Type     | Description                                            |
| --------------- | -------- | ------------------------------------------------------ |
| params          | `object` |                                                        |
| params.token    | `string` | action token                                           |
| params.baseUrl  | `string` | baseUrl inferred from request object                   |
| params.pathname | `string` | wallet callback pathname                               |
| params.query    | `object` | params that should be persisted in wallet callback url |

### agentAuthenticator.getPublicUrl(pathname, params) ⇒ `string`

Compute public url to return to wallet

**Kind**: instance method of [`AgentAuthenticator`](#AgentAuthenticator)

| Param    | Type     |
| -------- | -------- |
| pathname | `string` |
| params   | `object` |

### agentAuthenticator.signResponse(params, baseUrl, request) ⇒ `object`

Sign a plain response, usually on auth success or error

**Kind**: instance method of [`AgentAuthenticator`](#AgentAuthenticator)\
**Returns**: `object` - { appPk, authInfo }

| Param                 | Type     | Description                                                                  |
| --------------------- | -------- | ---------------------------------------------------------------------------- |
| params                | `object` |                                                                              |
| params.response       | `object` | response                                                                     |
| params.errorMessage   | `string` | error message, default to empty                                              |
| params.successMessage | `string` | success message, default to empty                                            |
| params.nextWorkflow   | `string` | <https://github.com/ArcBlock/ABT-DID-Protocol#concatenate-multiple-workflow> |
| baseUrl               | `string` |                                                                              |
| request               | `object` |                                                                              |

### agentAuthenticator.getChainInfo(params, info) ⇒ [`ChainInfo`](#ChainInfo)

Determine chainInfo on the fly

**Kind**: instance method of [`AgentAuthenticator`](#AgentAuthenticator)

| Param  | Type                    | Description                          |
| ------ | ----------------------- | ------------------------------------ |
| params | `object`                | contains the context of this request |
| info   | `object` \| `undefined` | chain info object or function        |

### agentAuthenticator.getAppInfo(params, info) ⇒ [`ApplicationInfo`](#ApplicationInfo)

Determine appInfo on the fly

**Kind**: instance method of [`AgentAuthenticator`](#AgentAuthenticator)

| Param  | Type                    | Description                          |
| ------ | ----------------------- | ------------------------------------ |
| params | `object`                | contains the context of this request |
| info   | `object` \| `undefined` | app info object or function          |

### agentAuthenticator.verify(data, \[locale], \[enforceTimestamp]) ⇒

Verify a DID auth response sent from DID Wallet

**Kind**: instance method of [`AgentAuthenticator`](#AgentAuthenticator)\
**Returns**: Promise<boolean>

| Param              | Type      | Default          |
| ------------------ | --------- | ---------------- |
| data               | `object`  |                  |
| [locale]           | `string`  | `&quot;en&quot;` |
| [enforceTimestamp] | `boolean` | `true`           |


## WalletAuthenticator

**Kind**: global class

* [WalletAuthenticator](#WalletAuthenticator)
  * [new WalletAuthenticator(config)](#new_WalletAuthenticator_new)
  * [uri(params)](#WalletAuthenticator+uri) ⇒ `string`
  * [getPublicUrl(pathname, params)](#WalletAuthenticator+getPublicUrl) ⇒ `string`
  * [signResponse(params, baseUrl, request)](#WalletAuthenticator+signResponse) ⇒ `object`
  * [sign(params)](#WalletAuthenticator+sign) ⇒ `object`
  * [getChainInfo(params, info)](#WalletAuthenticator+getChainInfo) ⇒ [`ChainInfo`](#ChainInfo)
  * [getAppInfo(params, info)](#WalletAuthenticator+getAppInfo) ⇒ [`ApplicationInfo`](#ApplicationInfo)
  * [verify(data, \[locale\], \[enforceTimestamp\])](#WalletAuthenticator+verify) ⇒

### new WalletAuthenticator(config)

Creates an instance of DID Authenticator.

| Param             | Type                                                | Default                       | Description                                                                    |
| ----------------- | --------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------ |
| config            | `object`                                            |                               |                                                                                |
| config.wallet     | `Wallet` \| `function`                              |                               | wallet instance {@see @ocap/wallet} or a function that returns wallet instance |
| config.appInfo    | [`ApplicationInfo`](#ApplicationInfo) \| `function` |                               | application basic info or a function that returns application info             |
| config.chainInfo  | [`ChainInfo`](#ChainInfo) \| `function`             |                               | application chain info or a function that returns chain info                   |
| [config.timeout]  | `Number`                                            | `8000`                        | timeout in milliseconds when generating claim                                  |
| [config.baseUrl]  | `object`                                            |                               | url to assemble wallet request uri, can be inferred from request object        |
| [config.tokenKey] | `string`                                            | `&quot;&#x27;_t_&#x27;&quot;` | query param key for `token`                                                    |

**Example**

```js
const { fromRandom } = require('@ocap/wallet');

const wallet = fromRandom().toJSON();
const chainHost = 'https://beta.abtnetwork.io/api';
const chainId = 'beta';
const auth = new Authenticator({
  wallet,
  baseUrl: 'http://beta.abtnetwork.io/webapp',
  appInfo: {
    name: 'DID Wallet Demo',
    description: 'Demo application to show the potential of DID Wallet',
    icon: 'https://arcblock.oss-cn-beijing.aliyuncs.com/images/wallet-round.png',
  },
  chainInfo: {
    host: chainHost,
    id: chainId,
  },
  timeout: 8000,
});
```

### walletAuthenticator.uri(params) ⇒ `string`

Generate a deep link url that can be displayed as QRCode for DID Wallet to consume

**Kind**: instance method of [`WalletAuthenticator`](#WalletAuthenticator)

| Param           | Type     | Description                                            |
| --------------- | -------- | ------------------------------------------------------ |
| params          | `object` |                                                        |
| params.token    | `string` | action token                                           |
| params.baseUrl  | `string` | baseUrl inferred from request object                   |
| params.pathname | `string` | wallet callback pathname                               |
| params.query    | `object` | params that should be persisted in wallet callback url |

### walletAuthenticator.getPublicUrl(pathname, params) ⇒ `string`

Compute public url to return to wallet

**Kind**: instance method of [`WalletAuthenticator`](#WalletAuthenticator)

| Param    | Type     |
| -------- | -------- |
| pathname | `string` |
| params   | `object` |

### walletAuthenticator.signResponse(params, baseUrl, request) ⇒ `object`

Sign a plain response, usually on auth success or error

**Kind**: instance method of [`WalletAuthenticator`](#WalletAuthenticator)\
**Returns**: `object` - { appPk, authInfo }

| Param                 | Type     | Description                                                                  |
| --------------------- | -------- | ---------------------------------------------------------------------------- |
| params                | `object` |                                                                              |
| params.response       | `object` | response                                                                     |
| params.errorMessage   | `string` | error message, default to empty                                              |
| params.successMessage | `string` | success message, default to empty                                            |
| params.nextWorkflow   | `string` | <https://github.com/ArcBlock/ABT-DID-Protocol#concatenate-multiple-workflow> |
| baseUrl               | `string` |                                                                              |
| request               | `object` |                                                                              |

### walletAuthenticator.sign(params) ⇒ `object`

Sign a auth response that returned to wallet: tell the wallet the appInfo/chainInfo

**Kind**: instance method of [`WalletAuthenticator`](#WalletAuthenticator)\
**Returns**: `object` - { appPk, authInfo }

| Param                    | Type     | Description                                       |
| ------------------------ | -------- | ------------------------------------------------- |
| params                   | `object` |                                                   |
| params.claims            | `object` | info required by application to complete the auth |
| params.pathname          | `object` | pathname to assemble callback url                 |
| params.challenge         | `object` | random challenge to be included in the body       |
| params.extraParams       | `object` | extra query params and locale                     |
| params.context.token     | `string` | action token                                      |
| params.context.userDid   | `string` | decoded from req.query, base58                    |
| params.context.userPk    | `string` | decoded from req.query, base58                    |
| params.context.didwallet | `string` | DID Wallet os and version                         |

### walletAuthenticator.getChainInfo(params, info) ⇒ [`ChainInfo`](#ChainInfo)

Determine chainInfo on the fly

**Kind**: instance method of [`WalletAuthenticator`](#WalletAuthenticator)

| Param  | Type                    | Description                          |
| ------ | ----------------------- | ------------------------------------ |
| params | `object`                | contains the context of this request |
| info   | `object` \| `undefined` | chain info object or function        |

### walletAuthenticator.getAppInfo(params, info) ⇒ [`ApplicationInfo`](#ApplicationInfo)

Determine appInfo on the fly

**Kind**: instance method of [`WalletAuthenticator`](#WalletAuthenticator)

| Param  | Type                    | Description                          |
| ------ | ----------------------- | ------------------------------------ |
| params | `object`                | contains the context of this request |
| info   | `object` \| `undefined` | app info object or function          |

### walletAuthenticator.verify(data, \[locale], \[enforceTimestamp]) ⇒

Verify a DID auth response sent from DID Wallet

**Kind**: instance method of [`WalletAuthenticator`](#WalletAuthenticator)\
**Returns**: Promise<boolean>

| Param              | Type      | Default          |
| ------------------ | --------- | ---------------- |
| data               | `object`  |                  |
| [locale]           | `string`  | `&quot;en&quot;` |
| [enforceTimestamp] | `boolean` | `true`           |


## BaseHandler

**Kind**: global class

### new BaseHandler(config)

Creates an instance of DID Auth Handlers.

| Param                  | Type       | Default | Description                                        |
| ---------------------- | ---------- | ------- | -------------------------------------------------- |
| config                 | `object`   |         |                                                    |
| config.pathTransformer | `function` |         | function to transform path when generate action;   |
| config.tokenStorage    | `object`   |         | function to generate action token                  |
| config.authenticator   | `object`   |         | Authenticator instance that can to jwt sign/verify |
| [config.onConnect]     | `function` | `noop`  | function called when wallet selected did           |


## WalletHandlers ⇐ `EventEmitter`

**Kind**: global class\
**Extends**: `EventEmitter`

* [WalletHandlers](#WalletHandlers) ⇐ `EventEmitter`
  * [new WalletHandlers()](#new_WalletHandlers_new)
  * [new WalletHandlers(config)](#new_WalletHandlers_new)
  * [attach(config)](#WalletHandlers+attach) ⇒

### new WalletHandlers()

Events that are emitted during an did-auth process

* scanned: when the qrcode is scanned by wallet
* succeed: when authentication complete
* error: when something goes wrong

### new WalletHandlers(config)

Creates an instance of DID Auth Handlers.

| Param                         | Type       | Default                            | Description                                                                                                                   |
| ----------------------------- | ---------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| config                        | `object`   |                                    |                                                                                                                               |
| config.tokenStorage           | `object`   |                                    | function to generate action token                                                                                             |
| config.authenticator          | `object`   |                                    | Authenticator instance that can to jwt sign/verify                                                                            |
| [config.pathTransformer]      | `function` | ``                                 | how should we update pathname                                                                                                 |
| [config.onConnect]            | `function` | `noop`                             | function called before each auth request send back to app, used to check for permission, throw error to halt the auth process |
| [config.options]              | `object`   | `{}`                               | custom options to define all handlers attached                                                                                |
| [config.options.prefix]       | `string`   | `&quot;&#x27;/api/did&#x27;&quot;` | url prefix for this group endpoints                                                                                           |
| [config.options.cleanupDelay] | `number`   | `60000`                            | how long to wait before cleanup finished session                                                                              |
| [config.options.tokenKey]     | `string`   | `&quot;&#x27;_t_&#x27;&quot;`      | query param key for `token`                                                                                                   |
| [config.options.encKey]       | `string`   | `&quot;&#x27;_ek_&#x27;&quot;`     | query param key for `token`                                                                                                   |

### walletHandlers.attach(config) ⇒

Attach routes and handlers for authenticator
Now express app have route handlers attached to the following url

* `GET /api/did/{action}/token` create new token
* `GET /api/did/{action}/status` check for token status
* `GET /api/did/{action}/timeout` expire a token
* `GET /api/did/{action}/auth` create auth response
* `POST /api/did/{action}/auth` process payment request

**Kind**: instance method of [`WalletHandlers`](#WalletHandlers)\
**Returns**: void

| Param                  | Type                           | Default         | Description                                                           |
| ---------------------- | ------------------------------ | --------------- | --------------------------------------------------------------------- |
| config                 | `object`                       |                 |                                                                       |
| config.app             | `object`                       |                 | express instance to attach routes to                                  |
| config.claims          | `object`                       |                 | claims for this request                                               |
| config.action          | `string`                       |                 | action of this group of routes                                        |
| [config.onStart]       | `function`                     | `noop`          | callback when a new action start                                      |
| [config.onConnect]     | `function`                     | `noop`          | callback when a new action start                                      |
| config.onAuth          | `function`                     |                 | callback when user completed auth in DID Wallet, and data posted back |
| [config.onDecline]     | `function`                     | `noop`          | callback when user has declined in wallet                             |
| [config.onComplete]    | `function`                     | `noop`          | callback when the whole auth process is done, action token is removed |
| [config.onExpire]      | `function`                     | `noop`          | callback when the action token expired                                |
| [config.onError]       | `function`                     | `console.error` | callback when there are some errors                                   |
| [config.authPrincipal] | `boolean` \| `string` \| `did` | `true`          | whether should we do auth principal claim first                       |


## WalletHandlers

**Kind**: global class

* [WalletHandlers](#WalletHandlers)
  * [new WalletHandlers()](#new_WalletHandlers_new)
  * [new WalletHandlers(config)](#new_WalletHandlers_new)
  * [attach(config)](#WalletHandlers+attach) ⇒

### new WalletHandlers()

Events that are emitted during an did-auth process

* scanned: when the qrcode is scanned by wallet
* succeed: when authentication complete
* error: when something goes wrong

### new WalletHandlers(config)

Creates an instance of DID Auth Handlers.

| Param                         | Type       | Default                            | Description                                                                                                                   |
| ----------------------------- | ---------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| config                        | `object`   |                                    |                                                                                                                               |
| config.tokenStorage           | `object`   |                                    | function to generate action token                                                                                             |
| config.authenticator          | `object`   |                                    | Authenticator instance that can to jwt sign/verify                                                                            |
| [config.pathTransformer]      | `function` | ``                                 | how should we update pathname                                                                                                 |
| [config.onConnect]            | `function` | `noop`                             | function called before each auth request send back to app, used to check for permission, throw error to halt the auth process |
| [config.options]              | `object`   | `{}`                               | custom options to define all handlers attached                                                                                |
| [config.options.prefix]       | `string`   | `&quot;&#x27;/api/did&#x27;&quot;` | url prefix for this group endpoints                                                                                           |
| [config.options.cleanupDelay] | `number`   | `60000`                            | how long to wait before cleanup finished session                                                                              |
| [config.options.tokenKey]     | `string`   | `&quot;&#x27;_t_&#x27;&quot;`      | query param key for `token`                                                                                                   |
| [config.options.encKey]       | `string`   | `&quot;&#x27;_ek_&#x27;&quot;`     | query param key for `token`                                                                                                   |

### walletHandlers.attach(config) ⇒

Attach routes and handlers for authenticator
Now express app have route handlers attached to the following url

* `GET /api/did/{action}/token` create new token
* `GET /api/did/{action}/status` check for token status
* `GET /api/did/{action}/timeout` expire a token
* `GET /api/did/{action}/auth` create auth response
* `POST /api/did/{action}/auth` process payment request

**Kind**: instance method of [`WalletHandlers`](#WalletHandlers)\
**Returns**: void

| Param                  | Type                           | Default         | Description                                                           |
| ---------------------- | ------------------------------ | --------------- | --------------------------------------------------------------------- |
| config                 | `object`                       |                 |                                                                       |
| config.app             | `object`                       |                 | express instance to attach routes to                                  |
| config.claims          | `object`                       |                 | claims for this request                                               |
| config.action          | `string`                       |                 | action of this group of routes                                        |
| [config.onStart]       | `function`                     | `noop`          | callback when a new action start                                      |
| [config.onConnect]     | `function`                     | `noop`          | callback when a new action start                                      |
| config.onAuth          | `function`                     |                 | callback when user completed auth in DID Wallet, and data posted back |
| [config.onDecline]     | `function`                     | `noop`          | callback when user has declined in wallet                             |
| [config.onComplete]    | `function`                     | `noop`          | callback when the whole auth process is done, action token is removed |
| [config.onExpire]      | `function`                     | `noop`          | callback when the action token expired                                |
| [config.onError]       | `function`                     | `console.error` | callback when there are some errors                                   |
| [config.authPrincipal] | `boolean` \| `string` \| `did` | `true`          | whether should we do auth principal claim first                       |


## AgentWalletHandlers

**Kind**: global class

* [AgentWalletHandlers](#AgentWalletHandlers)
  * [new AgentWalletHandlers(config)](#new_AgentWalletHandlers_new)
  * [attach(config)](#AgentWalletHandlers+attach) ⇒

### new AgentWalletHandlers(config)

Creates an instance of DID Auth Handlers.

| Param                          | Type       | Default                                           | Description                                                                                                                   |
| ------------------------------ | ---------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| config                         | `object`   |                                                   |                                                                                                                               |
| config.tokenStorage            | `object`   |                                                   | did auth token storage                                                                                                        |
| config.agentStorage            | `object`   |                                                   | agent auth storage                                                                                                            |
| config.authenticator           | `object`   |                                                   | Authenticator instance that can to jwt sign/verify                                                                            |
| [config.onConnect]             | `function` | `noop`                                            | function called before each auth request send back to app, used to check for permission, throw error to halt the auth process |
| [config.options]               | `object`   | `{}`                                              | custom options to define all handlers attached                                                                                |
| [config.options.prefix]        | `string`   | `&quot;&#x27;/api/agent/:authorizeId&#x27;&quot;` | url prefix for this group endpoints                                                                                           |
| [config.options.sessionDidKey] | `string`   | `&quot;&#x27;user.did&#x27;&quot;`                | key path to extract session user did from request object                                                                      |
| [config.options.tokenKey]      | `string`   | `&quot;&#x27;_t_&#x27;&quot;`                     | query param key for `token`                                                                                                   |

### agentWalletHandlers.attach(config) ⇒

Attach routes and handlers for authenticator
Now express app have route handlers attached to the following url

* `GET /api/agent/:authorizeId/{action}/token` create new token
* `GET /api/agent/:authorizeId/{action}/status` check for token status
* `GET /api/agent/:authorizeId/{action}/timeout` expire a token
* `GET /api/agent/:authorizeId/{action}/auth` create auth response
* `POST /api/agent/:authorizeId/{action}/auth` process payment request

**Kind**: instance method of [`AgentWalletHandlers`](#AgentWalletHandlers)\
**Returns**: void

| Param                  | Type                           | Default         | Description                                                           |
| ---------------------- | ------------------------------ | --------------- | --------------------------------------------------------------------- |
| config                 | `object`                       |                 |                                                                       |
| config.app             | `object`                       |                 | express instance to attach routes to                                  |
| config.claims          | `object`                       |                 | claims for this request                                               |
| config.action          | `string`                       |                 | action of this group of routes                                        |
| [config.onStart]       | `function`                     | `noop`          | callback when a new action start                                      |
| [config.onConnect]     | `function`                     | `noop`          | callback when user did selected                                       |
| config.onAuth          | `function`                     |                 | callback when user completed auth in DID Wallet, and data posted back |
| [config.onDecline]     | `function`                     | `noop`          | callback when user has declined in wallet                             |
| [config.onComplete]    | `function`                     | `noop`          | callback when the whole auth process is done, action token is removed |
| [config.onExpire]      | `function`                     | `noop`          | callback when the action token expired                                |
| [config.onError]       | `function`                     | `console.error` | callback when there are some errors                                   |
| [config.authPrincipal] | `boolean` \| `string` \| `did` | `true`          | whether should we do auth principal claim first                       |


## ApplicationInfo

**Kind**: global typedef\
**Properties**

| Name        | Type     | Description                                                               |
| ----------- | -------- | ------------------------------------------------------------------------- |
| name        | `string` | application name                                                          |
| description | `string` | application description                                                   |
| icon        | `string` | application icon/logo url                                                 |
| link        | `string` | application home page, with which user can return application from wallet |
| path        | `string` | deep link url                                                             |
| publisher   | `string` | application did with `did:abt:` prefix                                    |


## ChainInfo

**Kind**: global typedef\
**Properties**

| Name              | Type      | Description                               |
| ----------------- | --------- | ----------------------------------------- |
| id                | `string`  | application chain id                      |
| host              | `string`  | graphql endpoint of the application chain |
| restrictedDeclare | `boolean` | whether the declaration is restricted     |
