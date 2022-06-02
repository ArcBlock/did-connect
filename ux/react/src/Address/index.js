import React from 'react';
import PropTypes from 'prop-types';
import DidAddress from './did-address';
import ResponsiveDidAddress from './responsive-did-address';

export const formatAddress = str => str.split(':').pop();

const DidAddressWrapper = ({ responsive, ...rest }) => {
  if (responsive) {
    return <ResponsiveDidAddress {...rest} />;
  }
  return <DidAddress {...rest} />;
};

export default DidAddressWrapper;

DidAddressWrapper.propTypes = {
  responsive: PropTypes.bool,
};

DidAddressWrapper.defaultProps = {
  responsive: true,
};
