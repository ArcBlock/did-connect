import DidAddress from './did-address';
import ResponsiveDidAddress from './responsive-did-address';

export const formatAddress = (str: string) => str.split(':').pop();

interface DidAddressWrapperProps {
  responsive?: boolean;
}

function DidAddressWrapper({ responsive, ...rest }: DidAddressWrapperProps) {
  if (responsive) {
    return <ResponsiveDidAddress {...rest} />;
  }
  return <DidAddress {...rest} />;
}

export default DidAddressWrapper;

DidAddressWrapper.defaultProps = {
  responsive: true,
};
