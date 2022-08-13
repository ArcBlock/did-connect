/* eslint-disable @typescript-eslint/no-use-before-define */
import { useRef } from 'react';
import { styled } from '@arcblock/ux/lib/Theme';
import Box, { BoxProps } from '@mui/material/Box';
import MobileIcon from '@arcblock/icons/lib/Mobile';

import { ResponsiveCard, ResponsiveProps } from './card';
import RefreshOverlay from './refresh-overlay';

type CardProps = ResponsiveProps & {
  status: string;
  onRefresh: (...args: any[]) => any;
  deepLink: string;
} & BoxProps;

/**
 * ConnectMobileWallet
 *
 * - mobile browser 环境会显示 (该情况下文案改成了 Open With ...)
 * - wallet webview 环境会显示, 该情况下实际上没有机会显示, 因为 token created 时会自动唤起 mobile auth
 */
export default function ConnectMobileWallet({ status, onRefresh, deepLink, ...rest }: CardProps): JSX.Element {
  const iconSize = rest.layout === 'lr' ? [20, 34] : [40, 68];
  const linkRef = useRef<HTMLAnchorElement>(null);
  return (
    <Root {...rest} color="#A8B4C5" fontWeight={700} onClick={() => linkRef.current?.click()}>
      <div>
        <Box fontSize={16}>Open In</Box>
        <Box mt={0.5} fontSize={20} color="#334660">
          Mobile Wallet
        </Box>
      </div>
      <MobileIcon style={{ width: iconSize[0], height: iconSize[1] }} />
      {status === 'timeout' && <RefreshOverlay onRefresh={onRefresh} />}
      <a href={deepLink} target="_blank" ref={linkRef} style={{ display: 'none' }} rel="noreferrer">
        link
      </a>
    </Root>
  );
}

const Root = styled(ResponsiveCard)`
  position: relative;
  cursor: pointer;
`;
