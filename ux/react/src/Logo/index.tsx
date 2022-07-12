import DidLogoIcon from '@arcblock/icons/lib/DidLogo';

const defaultStyle = {
  width: 'auto',
  height: '1em',
  fill: 'currentColor',
};

interface Props {
  style?: object;
  size?: string | number;
  className?: string;
}

export default function DidLogo({ style = defaultStyle, size = 0, className = '' }: Props): JSX.Element {
  const height = Number(size) > 0 ? `${Number(size)}px` : size;
  return (
    <DidLogoIcon
      className={`${className}`.trim()}
      style={Object.assign({}, defaultStyle, style, height ? { height } : {})}
    />
  );
}
