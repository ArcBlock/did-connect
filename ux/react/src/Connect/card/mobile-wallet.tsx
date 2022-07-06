import Box from '@mui/material/Box';
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
    // @ts-ignore
    <ResponsiveCard {...rest} position="relative" color="#A8B4C5" fontWeight={700} status={status}>
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
