import styled from '@emotion/styled';
import Box, { BoxProps } from '@mui/material/Box';
import ComputerIcon from '@arcblock/icons/lib/Computer';

import { ResponsiveCard, ResponsiveProps } from './card';
import RefreshOverlay from './refresh-overlay';

type CardProps = ResponsiveProps & {
  status: string;
  onRefresh(...args: any[]): any;
  webWalletUrl?: string;
} & BoxProps;

/**
 * ConnectWebWallet
 */
export default function ConnectWebWallet({ status, onRefresh, webWalletUrl = '', ...rest }: CardProps): JSX.Element {
  const iconSize = rest.layout === 'lr' ? 48 : 64;
  const isTimeout = status === 'timeout';
  const className = `${rest.className || ''} ${isTimeout ? 'card_timeout' : ''}`;

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
      const url = new URL(webWalletUrl);
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
