import React from 'react';
import PropTypes from 'prop-types';
import Button from '@arcblock/ux/lib/Button';
import ConnectLogo from '@arcblock/icons/lib/ConnectLogo';

/**
 * ConnectButton
 */
export default function ConnectButton({ children, ...rest }) {
  return (
    <Button color="did" variant="contained" {...rest}>
      <span style={{ fontWeight: 400 }}>{children || 'Continue With'}</span>
      <ConnectLogo style={{ width: 'auto', height: '1.2em', margin: '0 4px 0 8px' }} />
    </Button>
  );
}

ConnectButton.propTypes = {
  children: PropTypes.any,
};

ConnectButton.defaultProps = {
  children: '',
};
