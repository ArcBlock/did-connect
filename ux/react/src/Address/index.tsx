import Simple from './simple';
import Responsive from './responsive';
import { DidAddressProps } from './types';

export const formatAddress = (str: string) => str.split(':').pop();

export default function DidAddress({ responsive = true, ...rest }: DidAddressProps): JSX.Element {
  if (responsive) {
    return <Responsive {...rest} />;
  }
  return <Simple {...rest} />;
}
