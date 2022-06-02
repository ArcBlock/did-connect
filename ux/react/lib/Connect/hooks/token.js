"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useToken;

var _react = require("react");

var _jsCookie = _interopRequireDefault(require("js-cookie"));

var _buffer = require("buffer");

var _tweetnacl = _interopRequireDefault(require("tweetnacl"));

var _tweetnaclSealedboxJs = _interopRequireDefault(require("tweetnacl-sealedbox-js"));

var _useSetState = _interopRequireDefault(require("react-use/lib/useSetState"));

var _useLocalStorage = _interopRequireDefault(require("react-use/lib/useLocalStorage"));

var _useInterval = _interopRequireDefault(require("@arcblock/react-hooks/lib/useInterval"));

var _useBrowser = _interopRequireDefault(require("@arcblock/react-hooks/lib/useBrowser"));

var _eventClient = _interopRequireDefault(require("@arcblock/event-client"));

var _Util = require("@arcblock/ux/lib/Util");

var _utils = require("../../utils");

var _locale = _interopRequireDefault(require("../assets/locale"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const escape = str => str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

const unescape = str => (str + '==='.slice((str.length + 3) % 4)).replace(/-/g, '+').replace(/_/g, '/'); // prettier-ignore


const encodeKey = key => escape(_buffer.Buffer.from(key).toString('base64'));

const decodeKey = str => Uint8Array.from(_buffer.Buffer.from(unescape(str), 'base64'));

function getExtraHeaders(baseUrl) {
  const headers = {};
  const authUrl = baseUrl || (window && window.location ? window.location.href : '');

  if (authUrl) {
    const {
      hostname,
      protocol,
      port
    } = new URL(authUrl);
    headers['x-real-hostname'] = hostname;
    headers['x-real-port'] = port;
    headers['x-real-protocol'] = protocol.endsWith(':') ? protocol.substring(0, protocol.length - 1) : protocol;
  }

  return headers;
}

const fns = {};

function createTokenFn(_ref) {
  let {
    action,
    prefix,
    checkFn,
    extraParams,
    baseUrl
  } = _ref;
  const key = "".concat(prefix, "/").concat(action, "/token?").concat((0, _Util.stringifyQuery)(extraParams));

  if (!fns[key]) {
    fns[key] = async function createToken() {
      const res = await checkFn(key, {
        headers: getExtraHeaders(baseUrl)
      });

      if (res.data && res.data.token) {
        return res.data;
      }

      if (res.data && res.data.error) {
        throw new Error(res.data.error);
      }

      throw new Error("Error generating ".concat(action, " qrcode"));
    };
  }

  return fns[key];
} // 从 url params 中获取已存在的 session (token & connect url)


const parseExistingSession = () => {
  try {
    const url = new URL(window.location.href);
    const connectUrlParam = url.searchParams.get('__connect_url__');

    if (!connectUrlParam) {
      return null;
    }

    const connectUrl = (0, _utils.decodeConnectUrl)(connectUrlParam);
    const token = (0, _utils.parseTokenFromConnectUrl)(connectUrl);
    return {
      token,
      url: connectUrl
    };
  } catch (e) {
    return {
      error: e
    };
  }
};

function useToken(_ref2) {
  let {
    action,
    checkFn,
    checkInterval,
    checkTimeout,
    extraParams,
    locale,
    prefix,
    socketUrl,
    tokenKey,
    encKey,
    onError,
    onSuccess,
    baseUrl,
    enableAutoConnect = true
  } = _ref2;
  const existingSession = (0, _react.useMemo)(() => parseExistingSession(), []);
  const maxCheckCount = Math.ceil(checkTimeout / checkInterval);

  const keyPair = _tweetnacl.default.box.keyPair();

  const [encryptKey] = (0, _useLocalStorage.default)('__encKey', encodeKey(keyPair.publicKey));
  const [decryptKey] = (0, _useLocalStorage.default)('__decKey', encodeKey(keyPair.secretKey)); // scanned 状态下 cancel (Back 按钮) 操作的计数器, 每次 cancel 操作时 +1
  // - 外部可以传入 enableAutoConnect 表示是否启用自动连接
  // - 计数器默认为 0, 表示还未进行过 cancel 操作
  // - 如果计数器 > 0, 说明用户进行过 cancel 操作
  //   (临时禁用, 重新打开 did-connect 窗口时恢复)

  const [cancelWhenScannedCounter, setCancelWhenScannedCounter] = (0, _react.useState)(0);
  const browser = (0, _useBrowser.default)();
  const createToken = createTokenFn({
    action,
    prefix,
    checkFn,
    extraParams: _objectSpread(_objectSpread({}, extraParams), {}, {
      [encKey]: encryptKey,
      locale,
      // - autoConnect 请求参数用于控制服务端是否给钱包应用发送自动连接通知
      // - 使用 connect 组件时明确传入了 enableAutoConnect = false, 则 autoConnect 请求参数 为 false
      // - 如果 cancelWhenScannedCounter > 0, 说明用户进行过 cancel 操作, 则临时禁用自动连接, autoConnect 请求参数 为 false
      //   (避免 "无限自动连接问题")
      // - 如果上次使用了 web wallet 进行连接, 则 autoConnect 请求参数 为 false (web wallet 并非像 native 钱包一样基于通知实现自动连接)
      //   (防止 native 钱包收到通知自动唤起 auth 窗口)
      autoConnect: enableAutoConnect && // 如果是 wallet webview 环境, 不发送通知, 避免 wallet 连续弹出 auth 窗口 2 次 (#341)
      !browser.wallet && !cancelWhenScannedCounter && _jsCookie.default.get('connected_wallet_os') !== 'web'
    }),
    baseUrl
  }); // 每次 cancel 操作时计数器 +1 => 重新生成 token

  const cancelWhenScanned = () => setCancelWhenScannedCounter(counter => counter + 1);

  (0, _react.useEffect)(() => {
    // 计数器 > 0, 说明人为触发了 cancel, 重新生成 token
    if (cancelWhenScannedCounter > 0) {
      generate();
    }
  }, [cancelWhenScannedCounter]);
  const subscriptions = (0, _react.useRef)({});
  const socket = (0, _react.useRef)(null);
  const [connection, setConnection] = (0, _react.useState)(null);
  const [subscription, setSubscription] = (0, _react.useState)(null);
  const [onSuccessCalled, setOnSuccessCalled] = (0, _react.useState)(false);
  const [state, setState] = (0, _useSetState.default)({
    checking: false,
    loading: false,
    token: '',
    url: '',
    store: null,
    status: 'created',
    error: null,
    checkCount: 0,
    appInfo: null,
    connectedDid: '',
    saveConnect: false,
    inExistingSession: false
  });

  const decrypt = value => {
    const decrypted = _tweetnaclSealedboxJs.default.open(Uint8Array.from(_buffer.Buffer.from(value, 'base64')), decodeKey(encryptKey), decodeKey(decryptKey));

    return JSON.parse(_buffer.Buffer.from(decrypted).toString('utf8'));
  };

  const params = Object.assign({}, extraParams, {
    locale,
    [tokenKey]: state.token || (existingSession === null || existingSession === void 0 ? void 0 : existingSession.token)
  });

  const getCheckInterval = () => {
    if (!state.token) {
      return null;
    }

    if (state.loading) {
      return null;
    }

    if (['succeed', 'error', 'timeout'].includes(state.status)) {
      return null;
    }

    return checkInterval;
  };

  const unsubscribe = () => {
    try {
      if (params[tokenKey]) {
        checkFn("".concat(prefix, "/").concat(action, "/timeout?").concat((0, _Util.stringifyQuery)(params)), {
          headers: getExtraHeaders(baseUrl)
        });
      }
    } catch (err) {// Do nothing
    }

    try {
      if (state.token && connection && subscription) {
        connection.unsubscribe('auth', state.token);
      }
    } catch (err) {// Do nothing
    }
  }; // 切换账户或者 token 过期之后需要重新生成


  const generate = async function generate() {
    let cleanup = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

    if (cleanup) {
      unsubscribe();
    }

    try {
      setState({
        loading: true,
        token: '',
        url: '',
        store: null
      });
      const data = await createToken();
      const extra = data.extra || {};
      setState({
        loading: false,
        token: data.token,
        url: data.url,
        status: 'created',
        error: '',
        checkCount: 0,
        appInfo: data.appInfo,
        connectedDid: extra.connectedDid,
        saveConnect: extra.saveConnect
      });
    } catch (err) {
      setState({
        loading: false,
        status: 'error',
        error: "".concat(_locale.default[locale].generateError, ": ").concat(err.message)
      });
    }
  }; // 任何导致 Connect 组件 unmounted 的操作 (比如 dialog 关闭) => 调用 timeout api 清除 token
  // 关闭时如果 token 状态处于 created，那么应该通知后端给删掉
  // 说明: 此处需要借助 useRef 在 useEffect return function 中访问 state


  const closeSessionRef = (0, _react.useRef)(null);
  (0, _react.useEffect)(() => {
    closeSessionRef.current = {
      state,
      params
    };
  });
  (0, _react.useEffect)(() => {
    return () => {
      // eslint-disable-next-line no-shadow
      const {
        state,
        params
      } = closeSessionRef.current;

      if (state.status === 'created') {
        if (params[tokenKey]) {
          checkFn("".concat(prefix, "/").concat(action, "/timeout?").concat((0, _Util.stringifyQuery)(params)), {
            headers: getExtraHeaders(baseUrl)
          });
        }
      }
    };
  }, []);

  const applyExistingToken = async () => {
    try {
      if (existingSession.error) {
        throw existingSession.error;
      }

      setState({
        loading: true,
        token: existingSession.token,
        url: existingSession.url,
        inExistingSession: true
      });
      const data = await checkStatus(); // existingSession.token 合法的初始状态必须是 created

      if (data !== null && data !== void 0 && data.status && (data === null || data === void 0 ? void 0 : data.status) !== 'created') {
        throw new Error("".concat(_locale.default[locale].invalidSessionStatus, " [").concat(data.status, "]"));
      }
    } catch (e) {
      setState({
        status: 'error',
        error: e.message
      });
      onError(e, state === null || state === void 0 ? void 0 : state.store, decrypt);
    } finally {
      setState({
        loading: false
      });
    }
  };

  (0, _react.useEffect)(() => {
    if (!state.token && !state.store && !state.loading && !state.error) {
      // connect to existing session if any
      if (existingSession) {
        applyExistingToken(); // Create our first token if we do not have one
      } else {
        generate(false);
        return;
      }
    } // Try to use websocket


    if (state.token && socketUrl && !socket.current) {
      socket.current = new _eventClient.default(socketUrl);
      setConnection(socket.current);
      return;
    }

    if (state.token && connection && !subscriptions.current[state.token]) {
      connection.subscribe('auth', state.token).then(sub => {
        setSubscription(sub);
        subscriptions.current[state.token] = sub;
        sub.on('data', data => {
          let {
            status,
            error
          } = data;

          if (status === 'forbidden') {
            error = _locale.default[locale].forbidden;
            status = 'error';
          }

          setState({
            status,
            store: data,
            error
          });
        });
      }).catch(() => {// Do nothing
      });
    } // Mark token as expired if exceed max retry count


    if (state.status !== 'timeout' && state.checkCount > maxCheckCount) {
      setState({
        status: 'timeout'
      });
      unsubscribe();
      return;
    } // Trigger on success if we completed the process


    if (state.status === 'succeed') {
      // save connected_did to cookie
      if (state.saveConnect && state.store.did) {
        (0, _utils.updateConnectedInfo)(_objectSpread(_objectSpread({}, state.store), {}, {
          appInfo: state.appInfo
        }));
      }

      if (typeof onSuccess === 'function' && !onSuccessCalled) {
        setOnSuccessCalled(true);
        onSuccess(state.store, decrypt);
      }
    }
  }); // Check auth token status

  const checkStatus = async () => {
    if (state.checking) {
      return null;
    }

    setState(prevState => ({
      checkCount: prevState.checkCount + 1
    })); // Do not do status check if we have websocket connection

    if (connection && subscription) {
      return null;
    }

    try {
      setState({
        checking: true
      });
      const res = await checkFn("".concat(prefix, "/").concat(action, "/status?").concat((0, _Util.stringifyQuery)(params)), {
        headers: getExtraHeaders(baseUrl)
      });
      const {
        status,
        error: newError
      } = res.data;
      setState({
        store: res.data,
        checking: false,
        status
      });

      if (status === 'error' && newError) {
        const err = new Error(newError);
        err.response = res;
        throw err;
      }

      return res.data;
    } catch (err) {
      const {
        response
      } = err;

      if (response && response.status) {
        if (params[tokenKey]) {
          checkFn("".concat(prefix, "/").concat(action, "/timeout?").concat((0, _Util.stringifyQuery)(params)), {
            headers: getExtraHeaders(baseUrl)
          });
        }

        const _msg = response.data && response.data.error ? response.data.error : err.message;

        const _err = new Error(_msg);

        _err.code = response.status;
        setState({
          status: 'error',
          checking: false,
          error: _msg
        });
        onError(_err, state === null || state === void 0 ? void 0 : state.store, decrypt);
      } else {
        setState({
          status: 'error',
          checking: false,
          error: _locale.default[locale].generateError
        });
      }
    }

    return null;
  };

  (0, _useInterval.default)(checkStatus, getCheckInterval());
  return {
    state,
    generate,
    cancelWhenScanned
  };
}