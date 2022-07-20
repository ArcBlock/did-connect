![@did-connect/react](https://www.arcblock.io/.netlify/functions/badge/?text=did-connect)

> Client side library to work with DID Connect by ArcBlock.

## Usage

```shell
yarn add @did-connect/react
```

Then:

```javascript
import axios from 'axios';

// import each module individually
import DidAddress from '@did-connect/react/Address';
import DidConnect from '@did-connect/react/Connect';
import DidAvatar from '@did-connect/react/Avatar';
import DidButton from '@did-connect/react/Button';
import DidLogo from '@did-connect/react/Logo';
import { SessionProvider, SessionConsumer } from '@did-connect/react/Session';
import SessionManager from '@did-connect/react/SessionManager';

// or use ES6 named imports
import {
  Address as DidAddress,
  Connect as DidConnect,
  Avatar as DidAvatar,
  Button as DidButton,
  Logo as DidLogo,
  Session,
  SessionManager,
} from '@did-connect/react';
```

### DidConnect

```jsx
<DidConnect
  popup
  open={open}
  action="login"
  checkFn={axios.get}
  onClose={() => handleOnClose()}
  onSuccess={() => (window.location.href = '/profile')}
  messages={{
    title: 'login',
    scan: 'Scan QR code with DID Wallet',
    confirm: 'Confirm login on your DID Wallet',
    success: 'You have successfully signed in!',
  }}
/>
```

**Note**: DidConnect component has a built-in instance of WebWalletSWKeeper that embeds a wallet iframe in the DOM to keep the service worker of the web wallet alive. When the DidConnect component is destroyed, WebWalletSWKeeper will also be destroyed, so avoid using it like the following:

```jsx
{open && (
  <DidConnect
    popup
    action="login"
    ...
  />
)}
```

### display DidConnect in popup

```jsx
const [open, setOpen] = React.useState(false);
const handleOnClose = () => {
  // ...
  setOpen(false);
};

...

<button type="button" onClick={() => setOpen(true)}>
  Open DidConnect
</button>

<DidConnect
  popup
  open={open}
  action="login"
  checkFn={axios.get}
  onClose={() => handleOnClose()}
  onSuccess={() => (window.location.href = '/profile')}
  messages={{
    title: 'login',
    scan: 'Scan QR code with DID Wallet',
    confirm: 'Confirm login on your DID Wallet',
    success: 'You have successfully signed in!',
  }}
  webWalletUrl={webWalletUrl}
/>
```

### DidAvatar

```jsx
<DidAvatar did={userDid} size={256} />
```

### DidButton

```jsx
<ConnectButton size="large" />
<ConnectButton size="medium" />
<ConnectButton size="small" />
<ConnectButton>Custom Text</ConnectButton>
```

### DidLogo

```jsx
<DidLogo size={32} />
```

### DidAddress

```jsx
<DidAddress did={userDid} size={32} />
```

### SessionManager

```jsx
<SessionProvider serviceHost={get(window, 'blocklet.prefix', '/')} relayUrl={relayUrl}>
  <SessionConsumer>{({ session }) => <SessionManager session={session} showText showRole />}</SessionConsumer>
  ...
</SessionProvider>
```
