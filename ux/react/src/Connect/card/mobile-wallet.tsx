import Box, { BoxProps } from '@mui/material/Box';
import QRCode from '@arcblock/ux/lib/QRCode';
import { ResponsiveCard, ResponsiveProps } from './card';
import RefreshOverlay from './refresh-overlay';

type MobileWalletProps = ResponsiveProps & {
  status: string;
  qrcodeSize: number;
  deepLink: string;
  onRefresh(...args: any[]): any;
} & BoxProps;

/**
 * MobileWallet (QRCode scanning)
 */
export default function MobileWallet({
  qrcodeSize,
  deepLink,
  status,
  onRefresh,
  ...rest
}: MobileWalletProps): JSX.Element {
  return (
    <ResponsiveCard {...rest} position="relative" color="#A8B4C5" fontWeight={700}>
      <div>
        <Box mt={0.5} fontSize={20} color="#666">
          Mobile Wallet
        </Box>
      </div>
      <QRCode data={deepLink} size={qrcodeSize} />
      {status === 'timeout' && <RefreshOverlay onRefresh={onRefresh} />}
    </ResponsiveCard>
  );
}
