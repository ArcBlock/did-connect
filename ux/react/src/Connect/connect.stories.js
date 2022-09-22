import Connect from '.';
import { relayUrl } from './demo/fixtures';

export { default as LifeCycleCallbacks } from './demo/life-cycle-callbacks';
export { default as RequestDIDOnly } from './demo/request-did-only';
export { default as RequestProfile } from './demo/request-profile';
export { default as RequestNFT } from './demo/request-nft';
export { default as RequestVerifiableCredential } from './demo/request-verifiable-credential';
export { default as RequestTextSignature } from './demo/request-text-signature';
export { default as RequestDigestSignature } from './demo/request-digest-signature';
export { default as RequestTransactionSignature } from './demo/request-transaction-signature';
export { default as RequestPayment } from './demo/request-payment';
export { default as RequestEthereumSignature } from './demo/request-ethereum-signature';
export { default as MultipleClaims } from './demo/multiple-claims';
export { default as RemoteAPI } from './demo/remote-api';
export { default as MultipleSteps } from './demo/multiple-steps';
export { default as MultipleWorkflow } from './demo/multiple-workflow';
export { default as ReuseExistingSession } from './demo/reuse-existing-session';

export default {
  title: 'Connect',
  component: Connect,
  argTypes: {
    relayUrl: { control: 'text', defaultValue: relayUrl },
  },
};
