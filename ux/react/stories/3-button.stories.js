/* eslint-disable react/jsx-filename-extension */
import { storiesOf } from '@storybook/react';

import Box from '@mui/material/Box';
import ConnectButton from '../src/Button';

storiesOf('DID-Connect/Button', module)
  .addParameters({
    readme: {
      sidebar: '<!-- PROPS -->',
    },
  })
  .add('default', () => (
    <Box p={2}>
      <ConnectButton />
      <ConnectButton color="primary" style={{ marginLeft: 8 }} />
    </Box>
  ))
  .add('with different sizes', () => (
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
  ))
  .add('custom text', () => (
    <Box p={2}>
      <ConnectButton>Custom Text</ConnectButton>
    </Box>
  ));
