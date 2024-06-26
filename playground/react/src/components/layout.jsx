/* eslint-disable prefer-destructuring */
import PropTypes from 'prop-types';
import { Box, Container } from '@mui/material';
import Header from '@blocklet/ui-react/lib/Header';
import Footer from '@blocklet/ui-react/lib/Footer';

export default function Layout({ children }) {
  return (
    <Box>
      <Header maxWidth="unset" />
      <Container maxWidth="lg" my={3}>
        {children}
      </Container>
      <Box
        component={Footer}
        sx={{
          '&>div>.MuiContainer-root': {
            maxWidth: 'unset',
          },
        }}
      />
    </Box>
  );
}

Layout.propTypes = {
  children: PropTypes.any.isRequired,
};

Layout.defaultProps = {};
