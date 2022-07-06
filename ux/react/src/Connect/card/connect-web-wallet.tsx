/* eslint-disable @typescript-eslint/no-use-before-define */
import styled from 'styled-components';
import Box from '@mui/material/Box';
import ComputerIcon from '@arcblock/icons/lib/Computer';
import { ResponsiveCard } from './card';
import RefreshOverlay from './refresh-overlay';

interface ConnectWebWalletProps {
  status: string;
  onRefresh(...args: any[]): any;
  webWalletUrl?: string;
}

/**
 * ConnectWebWallet
 */
export default function ConnectWebWallet({
  status,
  onRefresh,
  webWalletUrl,
  ...rest
}: ConnectWebWalletProps): JSX.Element {
  const iconSize = rest.layout === 'lr' ? 48 : 64;
  const isTimeout = status === 'timeout';
  const className = `${rest.className || ''} ${isTimeout ? 'card_timeout' : ''}`;
  const url = new URL(webWalletUrl);

  const renderProvider = () => {
    const webWalletExtension = (window as any)?.ABT_DEV || (window as any).ABT;
    if (webWalletExtension && typeof webWalletExtension.open === 'function') {
      return (
        <Box mt={0.5} fontSize={12} style={{ wordBreak: 'break-all' }}>
          Web Wallet Extension
        </Box>
      );
    }

    if (webWalletUrl) {
      return (
        <Box mt={0.5} fontSize={12} style={{ wordBreak: 'break-all' }}>
          {url.hostname}
        </Box>
      );
    }

    return null;
  };

  return (
    <Root {...rest} color="#A8B4C5" bgcolor="#FFF" fontWeight={700} className={className}>
      <div>
        <Box mt={0.5} fontSize={20} color="#666">
          Web Wallet
        </Box>
        {renderProvider()}
      </div>
      <ComputerIcon style={{ width: iconSize, height: iconSize }} />
      {isTimeout && <RefreshOverlay onRefresh={onRefresh} />}
    </Root>
  );
}

ConnectWebWallet.defaultProps = {
  webWalletUrl: '',
};

const Root = styled(ResponsiveCard)`
  position: relative;
  cursor: pointer;
  &:not(.card_timeout):hover {
    background-color: #f2f8ff;
    svg {
      color: #4598fa;
    }
  }
`;
