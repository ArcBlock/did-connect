import useCookies from '../../../hooks/use-cookies';
import {
  CONNECTED_APP_KEY,
  CONNECTED_DID_KEY,
  CONNECTED_PK_KEY,
  CONNECTED_WALLET_OS_KEY,
} from '../../session/constants';

const cookieOptions = {
  expireInDays: 7,
  returnDomain: false,
};

const cookieConnectedDid = useCookies(CONNECTED_DID_KEY, null, cookieOptions);
const cookieConnectedPk = useCookies(CONNECTED_PK_KEY, null, cookieOptions);
const cookieConnectedApp = useCookies(CONNECTED_APP_KEY, null, cookieOptions);
const cookieConnectedWalletOs = useCookies(CONNECTED_WALLET_OS_KEY, null, cookieOptions);

export default () => {
  return {
    cookieConnectedDid,
    cookieConnectedPk,
    cookieConnectedApp,
    cookieConnectedWalletOs,
  };
};
