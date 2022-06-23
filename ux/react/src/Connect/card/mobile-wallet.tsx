import Box from '@mui/material/Box';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module '@arc... Remove this comment to see the full error message
import QRCode from '@arcblock/ux/lib/QRCode';
import { ResponsiveCard } from './card';
import RefreshOverlay from './refresh-overlay';

interface MobileWalletProps {
  status: string;
  qrcodeSize: number;
  deepLink: string;
  onRefresh(...args: unknown[]): unknown;
}

/**
 * MobileWallet (QRCode scanning)
 */
export default function MobileWallet({ qrcodeSize, deepLink, status, onRefresh, ...rest }: MobileWalletProps) {
  return (
    <ResponsiveCard {...rest} position="relative" color="#A8B4C5" fontWeight={700} status={status}>
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'div'.
      <div>
        // @ts-expect-error ts-migrate(2749) FIXME: 'Box' refers to a value, but is being used as a ty... Remove this
        comment to see the full error message
        <Box mt={0.5} fontSize={20} color="#666">
          // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'Mobile'. Mobile Wallet
        </Box>
      </div>
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'data'.
      <QRCode data={deepLink} size={qrcodeSize} />
      // @ts-expect-error ts-migrate(2709) FIXME: Cannot use namespace 'RefreshOverlay' as a type.
      {status === 'timeout' && <RefreshOverlay onRefresh={onRefresh} />}
    </ResponsiveCard>
  );
}
