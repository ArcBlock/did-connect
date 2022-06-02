"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = BasicConnect;

var _react = _interopRequireWildcard(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _styledComponents = _interopRequireWildcard(require("styled-components"));

var _styles = require("@mui/styles");

var _jsCookie = _interopRequireDefault(require("js-cookie"));

var _Box = _interopRequireDefault(require("@mui/material/Box"));

var _useMeasure = _interopRequireDefault(require("react-use/lib/useMeasure"));

var _Img = _interopRequireDefault(require("@arcblock/ux/lib/Img"));

var _Util = require("@arcblock/ux/lib/Util");

var _Spinner = _interopRequireDefault(require("@arcblock/ux/lib/Spinner"));

var _Colors = _interopRequireDefault(require("@arcblock/ux/lib/Colors"));

var _DidWalletLogo = _interopRequireDefault(require("@arcblock/icons/lib/DidWalletLogo"));

var _browser = require("./contexts/browser");

var _locale = _interopRequireDefault(require("./assets/locale"));

var _Address = _interopRequireDefault(require("../Address"));

var _Avatar = _interopRequireDefault(require("../Avatar"));

var _card = require("./card");

var _utils = require("../utils");

const _excluded = ["appInfo"],
      _excluded2 = ["locale", "tokenKey", "messages", "qrcodeSize", "showDownload", "webWalletUrl", "tokenState", "generate", "cancelWhenScanned", "enabledConnectTypes", "onRecreateSession", "extraContent", "loadingEle"];

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

// #442, 页面初始化时的可见性, 如果不可见 (比如通过在某个页面中右键在新标签页中打开的一个基于 did-connect 登录页) 则禁止自动弹出 web wallet 窗口
const initialDocVisible = !document.hidden;

const getAppDid = publisher => {
  if (!publisher) {
    return '';
  }

  return publisher.split(':').pop();
};

const AppIcon = _ref => {
  let {
    appInfo
  } = _ref,
      rest = _objectWithoutProperties(_ref, _excluded);

  const [error, setError] = _react.default.useState(false);

  if (error) {
    return /*#__PURE__*/_react.default.createElement(_Avatar.default, {
      did: appInfo.publisher,
      size: 32
    });
  }

  return /*#__PURE__*/_react.default.createElement(_Img.default, Object.assign({
    src: appInfo.icon,
    alt: appInfo.title,
    width: 32,
    height: 32
  }, rest, {
    onError: () => setError(true)
  }));
};

AppIcon.propTypes = {
  appInfo: _propTypes.default.object.isRequired
};

function BasicConnect(_ref2) {
  let {
    locale,
    tokenKey,
    messages,
    qrcodeSize,
    showDownload,
    webWalletUrl,
    tokenState: state,
    generate,
    cancelWhenScanned,
    enabledConnectTypes,
    onRecreateSession,
    extraContent,
    loadingEle
  } = _ref2,
      rest = _objectWithoutProperties(_ref2, _excluded2);

  // eslint-disable-next-line no-param-reassign
  webWalletUrl = (0, _react.useMemo)(() => webWalletUrl || (0, _utils.getWebWalletUrl)(), [webWalletUrl]);

  if (!_locale.default[locale]) {
    // eslint-disable-next-line no-param-reassign
    locale = 'en';
  }

  const theme = (0, _styles.useTheme)();
  const [ref, {
    width
  }] = (0, _useMeasure.default)(); // const matchSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  const matchSmallScreen = width < 600;
  const {
    isWalletWebview,
    isMobile
  } = (0, _browser.useBrowserEnvContext)();
  const isSameProtocol = (0, _utils.checkSameProtocol)(webWalletUrl);
  const [isNativeCalled, setNativeCalled] = (0, _react.useState)(false);
  const [isWebWalletOpened, setWebWalletOpened] = (0, _react.useState)(false);
  const [cancelCounter, setCancelCounter] = (0, _react.useState)(0);

  const getDeepLink = () => {
    if (!state.url) {
      return '';
    }

    let deepLink = state.url;

    if (isMobile) {
      deepLink = deepLink.replace(/^https?:\/\//, 'abt://');
      let callbackUrl = window.location.href;

      if (callbackUrl.indexOf('?') > 0) {
        callbackUrl += "&".concat(tokenKey, "=").concat(state.token);
      } else {
        callbackUrl += "?".concat(tokenKey, "=").concat(state.token);
      }

      callbackUrl = encodeURIComponent(callbackUrl);

      if (deepLink.indexOf('?') > 0) {
        deepLink += "&callback=".concat(callbackUrl, "&callback_delay=1500");
      } else {
        deepLink += "?callback=".concat(callbackUrl, "&callback_delay=1500");
      }
    }

    return deepLink;
  };

  const handleRetry = () => {
    onRecreateSession(); // inExistingSession 为 true 时不重新生成 token

    if (!state.inExistingSession) {
      setNativeCalled(false);
      generate();
    }
  };

  const handleCancel = () => {
    onRecreateSession();

    if (!state.inExistingSession) {
      setCancelCounter(cancelCounter + 1);
      cancelWhenScanned();
    }
  };

  const handleRefresh = () => {
    onRecreateSession();

    if (!state.inExistingSession) {
      generate(false);
    }
  };

  (0, _react.useEffect)(() => {
    const deepLink = getDeepLink();

    if (state.status === 'created' && deepLink && !isNativeCalled) {
      Promise.resolve().then(() => _interopRequireWildcard(require('dsbridge'))).then(jsBridge => {
        jsBridge.call('authAction', {
          action: 'auth',
          deepLink
        });
      });
      setNativeCalled(true);
    }
  }, [state]);

  const onGoWebWallet = url => {
    (0, _Util.openWebWallet)({
      webWalletUrl,
      url,
      locale
    });
  };

  let showConnectWithWebWallet = false;
  let showScanWithMobileWallet = false;

  if (['created', 'timeout'].includes(state.status) && !isWalletWebview) {
    if (enabledConnectTypes.includes('web') && isSameProtocol) {
      showConnectWithWebWallet = true;
    }

    showScanWithMobileWallet = enabledConnectTypes.includes('mobile');
  }

  const shouldAutoLogin = (0, _react.useMemo)(() => {
    if (cancelCounter > 0) {
      return false;
    }

    if (state.status === 'created') {
      // 自动唤起 native wallet
      if (isWalletWebview && getDeepLink()) {
        return true;
      } // 自动弹起 web wallet


      if (showConnectWithWebWallet && state.saveConnect && state.status === 'created' && initialDocVisible && _jsCookie.default.get('connected_wallet_os') === 'web') {
        return true;
      }
    }

    return false;
  }, [state.status, showConnectWithWebWallet, state.saveConnect]); // - If in DID Wallet, just show the progress indicator, since we are calling native js bridge
  // - wallet webview 环境下, 除 error, succeed 两种状态外, 其他状态都显示 loading (#245)

  const showLoading = state.loading || !['error', 'succeed'].includes(state.status) && isWalletWebview;
  const showStatus = ['scanned', 'succeed', 'error'].includes(state.status);
  const showConnectMobileWalletCard = !showLoading && (isWalletWebview || isMobile);

  if (showLoading) {
    return /*#__PURE__*/_react.default.createElement(LoadingContainer, null, loadingEle || /*#__PURE__*/_react.default.createElement(_Spinner.default, {
      style: {
        color: _Colors.default.did.primary
      }
    }));
  } // 如果满足下列条件, 则自动连接 web wallet
  // - "connect with web wallet" 可用
  // - saveConnect 为 true
  // - token 刚创建 (created)
  // - cookie 中 connected_wallet_os === 'web'
  // - !isWebWalletOpened (未打开过 web wallet auth 窗口)
  // - 页面可见


  if (showConnectWithWebWallet && state.saveConnect && state.status === 'created' && _jsCookie.default.get('connected_wallet_os') === 'web' && !isWebWalletOpened && initialDocVisible) {
    onGoWebWallet(state.url);
    setWebWalletOpened(true);
  }

  const statusMessages = {
    confirm: messages.confirm,
    // scanned
    success: messages.success,
    error: state.error || ''
  };
  return /*#__PURE__*/_react.default.createElement(Root, Object.assign({}, rest, {
    theme: theme,
    ref: ref,
    "data-did-auth-url": state.url
  }), /*#__PURE__*/_react.default.createElement("div", {
    className: "auth_inner"
  }, !showStatus && state.appInfo && /*#__PURE__*/_react.default.createElement(AppInfo, null, /*#__PURE__*/_react.default.createElement(AppIcon, {
    appInfo: state.appInfo
  }), /*#__PURE__*/_react.default.createElement("div", {
    className: "app-info_content"
  }, /*#__PURE__*/_react.default.createElement(_Box.default, {
    className: "app-info_name"
  }, state.appInfo.name), state.appInfo.publisher && /*#__PURE__*/_react.default.createElement(_Address.default, {
    size: 14,
    className: "app-info_did"
  }, getAppDid(state.appInfo.publisher)))), !showStatus && /*#__PURE__*/_react.default.createElement(ActionInfo, {
    theme: theme
  }, /*#__PURE__*/_react.default.createElement("h6", {
    className: "action-info_title"
  }, messages.title), messages.scan && /*#__PURE__*/_react.default.createElement("p", {
    className: "action-info_desc"
  }, messages.scan)), /*#__PURE__*/_react.default.createElement(Main, {
    isMobile: isMobile,
    className: matchSmallScreen ? 'auth_main--small' : ''
  }, /*#__PURE__*/_react.default.createElement("div", null, !showStatus && !shouldAutoLogin && /*#__PURE__*/_react.default.createElement(_Box.default, {
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  }, /*#__PURE__*/_react.default.createElement(_Box.default, {
    color: "#999",
    fontSize: 14,
    fontWeight: 400,
    lineHeight: 1
  }, _locale.default[locale].connect), /*#__PURE__*/_react.default.createElement(_DidWalletLogo.default, {
    style: {
      height: '1em',
      marginLeft: 8
    }
  })), !showStatus && shouldAutoLogin && /*#__PURE__*/_react.default.createElement(_Box.default, {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    lineHeight: "24px",
    color: "#999",
    fontSize: 14,
    fontWeight: 400
  }, /*#__PURE__*/_react.default.createElement(_Spinner.default, {
    size: 12,
    style: {
      color: _Colors.default.did.primary
    }
  }), /*#__PURE__*/_react.default.createElement(_Box.default, {
    display: "flex",
    alignItems: "center",
    ml: 1,
    lineHeight: 1
  }, _locale.default[locale].connecting, /*#__PURE__*/_react.default.createElement(_DidWalletLogo.default, {
    style: {
      height: '1em',
      marginLeft: 8
    }
  })), /*#__PURE__*/_react.default.createElement(_Box.default, {
    ml: 1
  }, _locale.default[locale].connectingSuffix)), /*#__PURE__*/_react.default.createElement("div", {
    className: "auth_main-inner"
  }, showStatus && /*#__PURE__*/_react.default.createElement(_card.StatusCard, {
    status: state.status,
    onCancel: handleCancel,
    onRetry: handleRetry,
    messages: statusMessages,
    locale: locale,
    className: "auth_status"
  }), (showConnectWithWebWallet || showScanWithMobileWallet) && /*#__PURE__*/_react.default.createElement("div", {
    className: "auth_connect-types"
  }, !isMobile && showConnectWithWebWallet && /*#__PURE__*/_react.default.createElement(_card.ConnectWebWalletCard, {
    className: "auth_connect-type",
    layout: matchSmallScreen ? 'lr' : 'tb',
    tokenState: state,
    onRefresh: handleRefresh,
    onClick: () => onGoWebWallet(state.url),
    webWalletUrl: webWalletUrl
  }), showScanWithMobileWallet && /*#__PURE__*/_react.default.createElement(_card.MobileWalletCard, {
    className: "auth_connect-type",
    qrcodeSize: qrcodeSize,
    tokenState: state,
    onRefresh: handleRefresh,
    layout: matchSmallScreen ? 'lr' : 'tb'
  }), showConnectMobileWalletCard && /*#__PURE__*/_react.default.createElement(_card.ConnectMobileWalletCard, {
    deepLink: getDeepLink(),
    className: "auth_connect-type",
    tokenState: state,
    onRefresh: handleRefresh,
    layout: matchSmallScreen ? 'lr' : 'tb'
  }))), !isWalletWebview && /*#__PURE__*/_react.default.createElement(_card.GetWalletCard, {
    locale: locale,
    width: 1,
    p: 2,
    pb: 1,
    mt: 2,
    visibility: showStatus ? 'hidden' : 'visible'
  }), (showConnectWithWebWallet || showScanWithMobileWallet) && extraContent))));
}

BasicConnect.propTypes = {
  locale: _propTypes.default.oneOf(['en', 'zh']),
  tokenKey: _propTypes.default.string,
  qrcodeSize: _propTypes.default.number,
  webWalletUrl: _propTypes.default.string,
  messages: _propTypes.default.shape({
    title: _propTypes.default.string.isRequired,
    scan: _propTypes.default.string.isRequired,
    confirm: _propTypes.default.string.isRequired,
    success: _propTypes.default.any.isRequired
  }).isRequired,
  showDownload: _propTypes.default.bool,
  // useToken 与 auth-panel 渲染分离
  tokenState: _propTypes.default.object.isRequired,
  generate: _propTypes.default.func.isRequired,
  cancelWhenScanned: _propTypes.default.func.isRequired,
  // web, mobile 开关, 默认都启用
  enabledConnectTypes: _propTypes.default.array,
  // 以下 3 种情况下 (需要重新创建 session) onRecreateSession 会被调用
  // 1. auth 过程中产生错误且用户点击了 retry 按钮
  // 2. 钱包扫码后中断 auth 流程, 且用户点击了 Back 按钮
  // 3. token 过期且用户点击了刷新按钮
  // 如果 did connect 接入的是一个 existingSession, 调用方可以使用该回调来处理 session 的重新创建
  onRecreateSession: _propTypes.default.func,
  // did connect 初始界面附加内容 (获取 did wallet 文本下面的区域)
  extraContent: _propTypes.default.any,
  //  支持loadingEle prop, 允许传入自定义的 spinner 元素
  loadingEle: _propTypes.default.any
};
BasicConnect.defaultProps = {
  locale: 'en',
  tokenKey: '_t_',
  qrcodeSize: 184,
  showDownload: true,
  webWalletUrl: '',
  enabledConnectTypes: ['web', 'mobile'],
  onRecreateSession: () => {},
  extraContent: null,
  loadingEle: ''
};
const centerMixin = (0, _styledComponents.css)(["display:flex;justify-content:center;align-items:center;width:100%;"]);

const Root = _styledComponents.default.div.withConfig({
  displayName: "basic__Root",
  componentId: "sc-5grnve-0"
})(["", ";position:relative;height:100%;overflow-y:auto;line-height:1.2;font-family:'Lato';color:#334660;background-color:#fbfcfd;&,& *,& *:before,& *:after{box-sizing:border-box;}.auth_inner{width:100%;margin:auto 0;padding:40px 16px;}"], centerMixin);

const LoadingContainer = _styledComponents.default.div.withConfig({
  displayName: "basic__LoadingContainer",
  componentId: "sc-5grnve-1"
})(["", ";height:100%;min-width:160px;min-height:160px;"], centerMixin);

const AppInfo = _styledComponents.default.div.withConfig({
  displayName: "basic__AppInfo",
  componentId: "sc-5grnve-2"
})(["display:flex;align-items:center;position:absolute;left:24px;right:24px;top:24px;font-size:16px;font-weight:700;color:#222;> *:first-child{flex:0 0 auto;}.app-info_content{padding-left:16px;overflow:hidden;}.app-info_name{max-width:100%;padding-right:32px;line-height:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}.app-info_did .did-address__text{color:#666;font-size:12px;}"]);

const ActionInfo = _styledComponents.default.div.withConfig({
  displayName: "basic__ActionInfo",
  componentId: "sc-5grnve-3"
})(["display:flex;flex-direction:column;align-items:center;margin-top:48px;text-align:center;.action-info_title{margin:0;font-size:28px;color:#222;}.action-info_desc{margin:8px 0 0 0;font-size:18px;color:#9397a1;}", "{.action-info_title{font-size:24px;}.action-info_desc{font-size:14px;}}"], props => props.theme.breakpoints.down('md'));

const Main = _styledComponents.default.main.withConfig({
  displayName: "basic__Main",
  componentId: "sc-5grnve-4"
})(["", ";margin-top:48px;.auth_main-inner{", ";align-items:stretch;height:264px;margin-top:24px;}.auth_connect-type{width:264px;}.auth_status{width:auto;}.auth_connect-types{", ";display:flex;justify-content:center;align-items:center;width:100%;align-items:stretch;flex-wrap:wrap;}.auth_connect-type + .auth_connect-type{margin-left:24px;}&.auth_main--small{.auth_main-inner{height:auto;}.auth_connect-types{align-items:center;flex-direction:column;}.auth_connect-type{width:340px;}.auth_connect-type + .auth_connect-type{margin:24px 0 0 0;}}"], centerMixin, centerMixin, centerMixin);