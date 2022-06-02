"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = AvatarWithErrorBoundary;

var _react = _interopRequireWildcard(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _styledComponents = _interopRequireDefault(require("styled-components"));

var _reactErrorBoundary = require("react-error-boundary");

var _Img = _interopRequireDefault(require("@arcblock/ux/lib/Img"));

var _Util = require("@arcblock/ux/lib/Util");

var _styles = require("@mui/styles");

var _didMotif = require("@arcblock/did-motif");

var _system = require("@mui/system");

var _didMotif2 = _interopRequireDefault(require("./did-motif"));

var _etherscanBlockies = _interopRequireDefault(require("./etherscan-blockies"));

const _excluded = ["did", "size", "src", "variant", "animation", "shape"];

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

const useStyles = (0, _styles.makeStyles)(() => ({
  img: {
    '&.avatar-img--default': {},
    '&.avatar-img--rounded': {
      borderRadius: '4px',
      overflow: 'hidden'
    },
    '&.avatar-img--circle': {
      borderRadius: '100%',
      overflow: 'hidden'
    }
  }
})); // 参考: asset-chain @arcblock/did

const isEthereumDid = did => {
  const address = did.replace('did:abt:', ''); // check if it has the basic requirements of an address

  if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
    return false;
  }

  return true;
}; // 参考: https://github.com/blocklet/block-explorer/issues/478#issuecomment-1038954976


function Avatar(props) {
  const classes = useStyles();
  const [imgError, setImgError] = (0, _react.useState)(false);
  const newProps = (0, _Util.mergeProps)(props, Avatar, []);

  const {
    did = '',
    size,
    src,
    variant,
    animation,
    shape
  } = newProps,
        rest = _objectWithoutProperties(newProps, _excluded); // ethereum blockies


  const blockyIcon = (0, _react.useMemo)(() => {
    if (isEthereumDid(did)) {
      return _etherscanBlockies.default.createIcon({
        seed: did.replace('did:abt:', '').toLowerCase(),
        size: 8,
        scale: 16
      }).toDataURL();
    }

    return null;
  }, [did]); // 如果显式传入 src 则直接使用 src

  if (src && !imgError) {
    return /*#__PURE__*/_react.default.createElement(_Img.default, Object.assign({
      width: size,
      src: src,
      alt: did,
      onError: () => setImgError(true)
    }, rest, {
      className: "".concat(classes.img, " avatar-img--").concat(variant, " ").concat(rest.className)
    }));
  }

  if (blockyIcon) {
    return /*#__PURE__*/_react.default.createElement(BlockyIconContainer, Object.assign({
      $size: size
    }, rest), /*#__PURE__*/_react.default.createElement(_Img.default, {
      className: "".concat(classes.img, " avatar-img--").concat(variant),
      width: size,
      src: blockyIcon,
      alt: did
    }));
  }

  if (did) {
    // 渲染 did motif
    return /*#__PURE__*/_react.default.createElement(_didMotif2.default, Object.assign({
      did: did.replace('did:abt:', ''),
      size: size,
      animation: animation,
      shape: _didMotif.Shape[(shape || '').toUpperCase()],
      responsive: newProps.responsive
    }, rest));
  }

  throw new Error("Invalid DID: ".concat(did));
}

Avatar.propTypes = {
  did: _propTypes.default.string.isRequired,
  size: _propTypes.default.number,
  variant: _propTypes.default.oneOf(['circle', 'rounded', 'default']),
  // animation 仅对 did motif 有效
  animation: _propTypes.default.bool,
  // shape 仅对 did motif 有效, 明确指定 motif shape, 而非由 did role type 自动推断 shape
  shape: _propTypes.default.oneOf(['', 'rectangle', 'square', 'hexagon', 'circle'])
};
Avatar.defaultProps = {
  size: 36,
  variant: 'default',
  animation: false,
  shape: ''
};

const BlockyIconContainer = _styledComponents.default.div.withConfig({
  displayName: "Avatar__BlockyIconContainer",
  componentId: "sc-1b55m6x-0"
})(["width:", "px;height:", "px;padding:2px 0;overflow:hidden;border-radius:", "px;text-align:center;background:#ddd;"], props => props.$size / 0.7, props => props.$size, props => Math.min(10, Math.floor(0.1 * props.$size + 2)));

function AvatarWithErrorBoundary(props) {
  const classes = useStyles();
  const size = props.size || 36;
  return /*#__PURE__*/_react.default.createElement(_reactErrorBoundary.ErrorBoundary, {
    fallbackRender: () => /*#__PURE__*/_react.default.createElement(_system.Box, {
      width: size,
      height: size,
      bgcolor: "grey.300",
      className: "".concat(classes.img, " avatar-img--").concat(props.variant || 'default')
    })
  }, /*#__PURE__*/_react.default.createElement(Avatar, props));
}

AvatarWithErrorBoundary.propTypes = Avatar.propTypes;