// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module '@arc... Remove this comment to see the full error message
import DidLogoIcon from '@arcblock/icons/lib/DidLogo';

const defaultStyle = {
  width: 'auto',
  height: '1em',
  fill: 'currentColor',
};

interface DidLogoProps {
  style?: object;
  size?: string | number;
  className?: string;
}

export default function DidLogo({ style, size, className }: DidLogoProps) {
  const height = Number(size) > 0 ? `${Number(size)}px` : size;
  return (
    <DidLogoIcon
      className={`${className}`.trim()}
      style={Object.assign({}, defaultStyle, style, height ? { height } : {})}
    />
  );
}

DidLogo.defaultProps = {
  style: defaultStyle,
  size: 0,
  className: '',
};
