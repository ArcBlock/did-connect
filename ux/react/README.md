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
import DidConnect from '@did-connect/react/Connect';
import DidButton from '@did-connect/react/Button';
import { SessionProvider, SessionConsumer } from '@did-connect/react/Session';

// or use ES6 named imports
import {
  Connect as DidConnect,
  Button as DidButton,
  Session,
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

### DidButton

```jsx
<ConnectButton size="large" />
<ConnectButton size="medium" />
<ConnectButton size="small" />
<ConnectButton>Custom Text</ConnectButton>
```
