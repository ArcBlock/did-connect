/* eslint-disable react/jsx-filename-extension */
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import DidLogo from '..';

export default function Demo() {
  return (
    <Box gap={2}>
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
        <DidLogo size={64} style={{ color: 'red' }} />
        <DidLogo size={64} style={{ color: 'blue' }} />
        <DidLogo size={64} style={{ color: 'green' }} />
      </div>

      <Divider sx={{ my: 4 }} />

      <Typography style={{ fontSize: '48px', color: 'green' }} align="center">
        My color is green, and font size is 48px, so is the icon
        <br />
        <DidLogo />
      </Typography>

      <Divider sx={{ my: 4 }} />

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 32,
          borderRadius: 128,
          width: 192,
          height: 192,
          lineHeight: 192,
          background: '#4E6AF6',
          color: '#ffffff',
          margin: 32,
        }}>
        <DidLogo size={128} />
      </div>
    </Box>
  );
}
