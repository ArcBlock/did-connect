import Button from '@arcblock/ux/lib/Button';
import ConnectLogo from '@arcblock/icons/lib/ConnectLogo';

interface Props {
  children?: React.ReactNode;
}

export default function ConnectButton({ children = 'Continue With', ...rest }: Props): JSX.Element {
  return (
    <Button color="did" variant="contained" {...rest}>
      <span style={{ fontWeight: 400 }}>{children}</span>
      <ConnectLogo style={{ width: 'auto', height: '1.2em', margin: '0 4px 0 8px' }} />
    </Button>
  );
}
