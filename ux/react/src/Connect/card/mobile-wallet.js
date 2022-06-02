import React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import QRCode from '@arcblock/ux/lib/QRCode';
import { ResponsiveCard } from './card';
import RefreshOverlay from './refresh-overlay';

/**
 * MobileWallet (QRCode scanning)
 */
export default function MobileWallet({ qrcodeSize, tokenState, onRefresh, ...rest }) {
  return (
    <ResponsiveCard
      {...rest}
      position="relative"
      color="#A8B4C5"
      fontWeight={700}
      status={tokenState.status}>
      <div>
        <Box mt={0.5} fontSize={20} color="#666">
          Mobile Wallet
        </Box>
      </div>
      <QRCode data={tokenState.url} size={qrcodeSize} />
      {tokenState.status === 'timeout' && <RefreshOverlay onRefresh={onRefresh} />}
    </ResponsiveCard>
  );
}

MobileWallet.propTypes = {
  tokenState: PropTypes.object.isRequired,
  qrcodeSize: PropTypes.number.isRequired,
  onRefresh: PropTypes.func.isRequired,
};
