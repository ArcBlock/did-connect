import { useRef } from 'react';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'styl... Remove this comment to see the full error message
import styled from 'styled-components';
import Box from '@mui/material/Box';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module '@arc... Remove this comment to see the full error message
import MobileIcon from '@arcblock/icons/lib/Mobile';
import { ResponsiveCard } from './card';
import RefreshOverlay from './refresh-overlay';

type Props = {
  status: string;
  onRefresh: (...args: any[]) => any;
  deepLink: string;
};

/**
 * ConnectMobileWallet
 *
 * - mobile browser 环境会显示 (该情况下文案改成了 Open With ...)
 * - wallet webview 环境会显示, 该情况下实际上没有机会显示, 因为 token created 时会自动唤起 mobile auth
 */
export default function ConnectMobileWallet({ status, onRefresh, deepLink, ...rest }: Props) {
  const iconSize = (rest as any).layout === 'lr' ? [20, 34] : [40, 68];
  const linkRef = useRef();
  return (
    // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
    <Root {...rest} color="#A8B4C5" fontWeight={700} onClick={() => linkRef.current.click()}>
      <div>
        <Box fontSize={16}>Open In</Box>
        <Box mt={0.5} fontSize={20} color="#334660">
          Mobile Wallet
        </Box>
      </div>
      <MobileIcon style={{ width: iconSize[0], height: iconSize[1] }} />
      {status === 'timeout' && <RefreshOverlay onRefresh={onRefresh} />}
      {/* @ts-expect-error ts-migrate(2322) FIXME: Type 'MutableRefObject<undefined>' is not assignab... Remove this comment to see the full error message */}
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
