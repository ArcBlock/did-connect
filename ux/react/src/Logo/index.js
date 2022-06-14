import PropTypes from 'prop-types';
import DidLogoIcon from '@arcblock/icons/lib/DidLogo';

const defaultStyle = {
  width: 'auto',
  height: '1em',
  fill: 'currentColor',
};

export default function DidLogo({ style, size, className }) {
  const height = Number(size) > 0 ? `${Number(size)}px` : size;
  return (
    <DidLogoIcon
      className={`${className}`.trim()}
      style={Object.assign({}, defaultStyle, style, height ? { height } : {})}
    />
  );
}

DidLogo.propTypes = {
  style: PropTypes.object,
  size: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  className: PropTypes.string,
};

DidLogo.defaultProps = {
  style: defaultStyle,
  size: 0,
  className: '',
};
