// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module '@arc... Remove this comment to see the full error message
import Button from '@arcblock/ux/lib/Button';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module '@arc... Remove this comment to see the full error message
import ConnectLogo from '@arcblock/icons/lib/ConnectLogo';

interface ConnectButtonProps {
  children?: any;
}

/**
 * ConnectButton
 */
export default function ConnectButton({ children, ...rest }: ConnectButtonProps) {
  return (
    <Button color="did" variant="contained" {...rest}>
      <span style={{ fontWeight: 400 }}>{children || 'Continue With'}</span>
      <ConnectLogo style={{ width: 'auto', height: '1.2em', margin: '0 4px 0 8px' }} />
    </Button>
  );
}

ConnectButton.defaultProps = {
  children: '',
};
