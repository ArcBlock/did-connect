// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'styl... Remove this comment to see the full error message
import styled from 'styled-components';
import Box from '@mui/material/Box';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module '@arc... Remove this comment to see the full error message
import ComputerIcon from '@arcblock/icons/lib/Computer';
import { ResponsiveCard } from './card';
import RefreshOverlay from './refresh-overlay';

interface ConnectWebWalletProps {
  status: string;
  onRefresh(...args: unknown[]): unknown;
  webWalletUrl?: string;
}

/**
 * ConnectWebWallet
 */
export default function ConnectWebWallet({ status, onRefresh, webWalletUrl, ...rest }: ConnectWebWalletProps) {
  const iconSize = rest.layout === 'lr' ? 48 : 64;
  const isTimeout = status === 'timeout';
  const className = `${rest.className || ''} ${isTimeout ? 'card_timeout' : ''}`;
  const url = new URL(webWalletUrl);

  const renderProvider = () => {
    const webWalletExtension = (window as any)?.ABT_DEV || (window as any).ABT;
    if (webWalletExtension && typeof webWalletExtension.open === 'function') {
      return (
        // @ts-expect-error ts-migrate(2749) FIXME: 'Box' refers to a value, but is being used as a ty... Remove this comment to see the full error message
        <Box mt={0.5} fontSize={12} style={{ wordBreak: 'break-all' }}>
          // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'Web'. Web Wallet Extension
        </Box>
      );
    }

    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'webWalletUrl'.
    if (webWalletUrl) {
      return (
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'fontSize'.
        <Box mt={0.5} fontSize={12} style={{ wordBreak: 'break-all' }}>
          // @ts-expect-error ts-migrate(2552) FIXME: Cannot find name 'url'. Did you mean 'URL'?
          {url.hostname}
        </Box>
      );
    }

    return null;
  };

  return (
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'color'.
    <Root {...rest} color="#A8B4C5" bgcolor="#FFF" fontWeight={700} className={className}>
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'div'.
      <div>
        // @ts-expect-error ts-migrate(2749) FIXME: 'Box' refers to a value, but is being used as a ty... Remove this
        comment to see the full error message
        <Box mt={0.5} fontSize={20} color="#666">
          // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'Web'. Web Wallet
        </Box>
        {/* 显示 wallet provider */}
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'renderProvider'.
        {renderProvider()}
      </div>
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'style'.
      <ComputerIcon style={{ width: iconSize, height: iconSize }} />
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'isTimeout'.
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
