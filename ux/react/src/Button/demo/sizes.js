/* eslint-disable react/jsx-filename-extension */
import Box from '@mui/material/Box';
import ConnectButton from '..';

export default function Sizes() {
  return (
    <Box p={2}>
      <Box p={2}>
        <ConnectButton size="large" />
      </Box>
      <Box p={2}>
        <ConnectButton size="medium" />
      </Box>
      <Box p={2}>
        <ConnectButton size="small" />
      </Box>
    </Box>
  );
}
