/* eslint-disable react/jsx-filename-extension */
import Box from '@mui/material/Box';
import LinkIcon from '@mui/icons-material/Link';
import DidAddress from '..';
import Avatar from '../../Avatar';

export default function Demo(props) {
  return (
    <div {...props}>
      <div>
        <DidAddress
          size={12}
          prepend={
            <Box component="span" mr={0.5} bgcolor="#000">
              [prepend]
            </Box>
          }
          append={
            <Box component="span" ml={0.5} bgcolor="#000">
              [append]
            </Box>
          }>
          z1SBWdzYCEEY6WrvEPJv2umgpkkrvgdtBry
        </DidAddress>
      </div>

      <div>
        <DidAddress
          size={12}
          prepend={<Avatar did="z1SBWdzYCEEY6WrvEPJv2umgpkkrvgdtBry" size={20} style={{ marginRight: 8 }} />}
          append={
            <Box component="a" href="/" display="flex" alignItems="center" ml={1}>
              <LinkIcon />
            </Box>
          }>
          z1SBWdzYCEEY6WrvEPJv2umgpkkrvgdtBry
        </DidAddress>
      </div>
    </div>
  );
}
