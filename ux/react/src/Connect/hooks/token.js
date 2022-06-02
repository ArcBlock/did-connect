import { useState, useEffect, useRef, useMemo } from 'react';
import Cookie from 'js-cookie';
import { Buffer } from 'buffer';
import tweetnacl from 'tweetnacl';
import SealedBox from 'tweetnacl-sealedbox-js';
import useSetState from 'react-use/lib/useSetState';
import useLocalStorage from 'react-use/lib/useLocalStorage';
import useInterval from '@arcblock/react-hooks/lib/useInterval';
import useBrowser from '@arcblock/react-hooks/lib/useBrowser';
import EventClient from '@arcblock/event-client';
import { stringifyQuery } from '@arcblock/ux/lib/Util';

import { decodeConnectUrl, parseTokenFromConnectUrl, updateConnectedInfo } from '../../utils';

import translations from '../assets/locale';

const escape = str => str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
const unescape = str => (str + '==='.slice((str.length + 3) % 4)).replace(/-/g, '+').replace(/_/g, '/'); // prettier-ignore
const encodeKey = key => escape(Buffer.from(key).toString('base64'));
const decodeKey = str => Uint8Array.from(Buffer.from(unescape(str), 'base64'));

function getExtraHeaders(baseUrl) {
  const headers = {};
  const authUrl = baseUrl || (window && window.location ? window.location.href : '');

  if (authUrl) {
    const { hostname, protocol, port } = new URL(authUrl);
    headers['x-real-hostname'] = hostname;
    headers['x-real-port'] = port;
    headers['x-real-protocol'] = protocol.endsWith(':')
      ? protocol.substring(0, protocol.length - 1)
      : protocol;
  }
  return headers;
}

const fns = {};
function createTokenFn({ action, prefix, checkFn, extraParams, baseUrl }) {
  const key = `${prefix}/${action}/token?${stringifyQuery(extraParams)}`;
  if (!fns[key]) {
    fns[key] = async function createToken() {
      const res = await checkFn(key, { headers: getExtraHeaders(baseUrl) });
      if (res.data && res.data.token) {
        return res.data;
      }

      if (res.data && res.data.error) {
        throw new Error(res.data.error);
      }

      throw new Error(`Error generating ${action} qrcode`);
    };
  }
  return fns[key];
}

// 从 url params 中获取已存在的 session (token & connect url)
const parseExistingSession = () => {
  try {
    const url = new URL(window.location.href);
    const connectUrlParam = url.searchParams.get('__connect_url__');
    if (!connectUrlParam) {
      return null;
    }
    const connectUrl = decodeConnectUrl(connectUrlParam);
    const token = parseTokenFromConnectUrl(connectUrl);
    return {
      token,
      url: connectUrl,
    };
  } catch (e) {
    return {
      error: e,
    };
  }
};

export default function useToken({
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
  enableAutoConnect = true,
}) {
  const existingSession = useMemo(() => parseExistingSession(), []);
  const maxCheckCount = Math.ceil(checkTimeout / checkInterval);

  const keyPair = tweetnacl.box.keyPair();
  const [encryptKey] = useLocalStorage('__encKey', encodeKey(keyPair.publicKey));
  const [decryptKey] = useLocalStorage('__decKey', encodeKey(keyPair.secretKey));

  // scanned 状态下 cancel (Back 按钮) 操作的计数器, 每次 cancel 操作时 +1
  // - 外部可以传入 enableAutoConnect 表示是否启用自动连接
  // - 计数器默认为 0, 表示还未进行过 cancel 操作
  // - 如果计数器 > 0, 说明用户进行过 cancel 操作
  //   (临时禁用, 重新打开 did-connect 窗口时恢复)
  const [cancelWhenScannedCounter, setCancelWhenScannedCounter] = useState(0);
  const browser = useBrowser();
  const createToken = createTokenFn({
    action,
    prefix,
    checkFn,
    extraParams: {
      ...extraParams,
      [encKey]: encryptKey,
      locale,
      // - autoConnect 请求参数用于控制服务端是否给钱包应用发送自动连接通知
      // - 使用 connect 组件时明确传入了 enableAutoConnect = false, 则 autoConnect 请求参数 为 false
      // - 如果 cancelWhenScannedCounter > 0, 说明用户进行过 cancel 操作, 则临时禁用自动连接, autoConnect 请求参数 为 false
      //   (避免 "无限自动连接问题")
      // - 如果上次使用了 web wallet 进行连接, 则 autoConnect 请求参数 为 false (web wallet 并非像 native 钱包一样基于通知实现自动连接)
      //   (防止 native 钱包收到通知自动唤起 auth 窗口)
      autoConnect:
        enableAutoConnect &&
        // 如果是 wallet webview 环境, 不发送通知, 避免 wallet 连续弹出 auth 窗口 2 次 (#341)
        !browser.wallet &&
        !cancelWhenScannedCounter &&
        Cookie.get('connected_wallet_os') !== 'web',
    },
    baseUrl,
  });
  // 每次 cancel 操作时计数器 +1 => 重新生成 token
  const cancelWhenScanned = () => setCancelWhenScannedCounter(counter => counter + 1);
  useEffect(() => {
    // 计数器 > 0, 说明人为触发了 cancel, 重新生成 token
    if (cancelWhenScannedCounter > 0) {
      generate();
    }
  }, [cancelWhenScannedCounter]);

  const subscriptions = useRef({});
  const socket = useRef(null);
  const [connection, setConnection] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [onSuccessCalled, setOnSuccessCalled] = useState(false);

  const [state, setState] = useSetState({
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
    inExistingSession: false,
  });

  const decrypt = value => {
    const decrypted = SealedBox.open(
      Uint8Array.from(Buffer.from(value, 'base64')),
      decodeKey(encryptKey),
      decodeKey(decryptKey)
    );
    return JSON.parse(Buffer.from(decrypted).toString('utf8'));
  };

  const params = Object.assign({}, extraParams, {
    locale,
    [tokenKey]: state.token || existingSession?.token,
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
        checkFn(`${prefix}/${action}/timeout?${stringifyQuery(params)}`, {
          headers: getExtraHeaders(baseUrl),
        });
      }
    } catch (err) {
      // Do nothing
    }

    try {
      if (state.token && connection && subscription) {
        connection.unsubscribe('auth', state.token);
      }
    } catch (err) {
      // Do nothing
    }
  };

  // 切换账户或者 token 过期之后需要重新生成
  const generate = async (cleanup = true) => {
    if (cleanup) {
      unsubscribe();
    }

    try {
      setState({ loading: true, token: '', url: '', store: null });
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
        saveConnect: extra.saveConnect,
      });
    } catch (err) {
      setState({
        loading: false,
        status: 'error',
        error: `${translations[locale].generateError}: ${err.message}`,
      });
    }
  };

  // 任何导致 Connect 组件 unmounted 的操作 (比如 dialog 关闭) => 调用 timeout api 清除 token
  // 关闭时如果 token 状态处于 created，那么应该通知后端给删掉
  // 说明: 此处需要借助 useRef 在 useEffect return function 中访问 state
  const closeSessionRef = useRef(null);
  useEffect(() => {
    closeSessionRef.current = { state, params };
  });
  useEffect(() => {
    return () => {
      // eslint-disable-next-line no-shadow
      const { state, params } = closeSessionRef.current;
      if (state.status === 'created') {
        if (params[tokenKey]) {
          checkFn(`${prefix}/${action}/timeout?${stringifyQuery(params)}`, {
            headers: getExtraHeaders(baseUrl),
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
        inExistingSession: true,
      });
      const data = await checkStatus();
      // existingSession.token 合法的初始状态必须是 created
      if (data?.status && data?.status !== 'created') {
        throw new Error(`${translations[locale].invalidSessionStatus} [${data.status}]`);
      }
    } catch (e) {
      setState({ status: 'error', error: e.message });
      onError(e, state?.store, decrypt);
    } finally {
      setState({ loading: false });
    }
  };

  useEffect(() => {
    if (!state.token && !state.store && !state.loading && !state.error) {
      // connect to existing session if any
      if (existingSession) {
        applyExistingToken();
        // Create our first token if we do not have one
      } else {
        generate(false);
        return;
      }
    }

    // Try to use websocket
    if (state.token && socketUrl && !socket.current) {
      socket.current = new EventClient(socketUrl);
      setConnection(socket.current);
      return;
    }

    if (state.token && connection && !subscriptions.current[state.token]) {
      connection
        .subscribe('auth', state.token)
        .then(sub => {
          setSubscription(sub);
          subscriptions.current[state.token] = sub;
          sub.on('data', data => {
            let { status, error } = data;
            if (status === 'forbidden') {
              error = translations[locale].forbidden;
              status = 'error';
            }
            setState({ status, store: data, error });
          });
        })
        .catch(() => {
          // Do nothing
        });
    }

    // Mark token as expired if exceed max retry count
    if (state.status !== 'timeout' && state.checkCount > maxCheckCount) {
      setState({ status: 'timeout' });
      unsubscribe();
      return;
    }

    // Trigger on success if we completed the process
    if (state.status === 'succeed') {
      // save connected_did to cookie
      if (state.saveConnect && state.store.did) {
        updateConnectedInfo({ ...state.store, appInfo: state.appInfo });
      }

      if (typeof onSuccess === 'function' && !onSuccessCalled) {
        setOnSuccessCalled(true);
        onSuccess(state.store, decrypt);
      }
    }
  });

  // Check auth token status
  const checkStatus = async () => {
    if (state.checking) {
      return null;
    }

    setState(prevState => ({ checkCount: prevState.checkCount + 1 }));

    // Do not do status check if we have websocket connection
    if (connection && subscription) {
      return null;
    }

    try {
      setState({ checking: true });
      const res = await checkFn(`${prefix}/${action}/status?${stringifyQuery(params)}`, {
        headers: getExtraHeaders(baseUrl),
      });
      const { status, error: newError } = res.data;

      setState({ store: res.data, checking: false, status });
      if (status === 'error' && newError) {
        const err = new Error(newError);
        err.response = res;
        throw err;
      }
      return res.data;
    } catch (err) {
      const { response } = err;
      if (response && response.status) {
        if (params[tokenKey]) {
          checkFn(`${prefix}/${action}/timeout?${stringifyQuery(params)}`, {
            headers: getExtraHeaders(baseUrl),
          });
        }
        const _msg = response.data && response.data.error ? response.data.error : err.message;
        const _err = new Error(_msg);
        _err.code = response.status;
        setState({ status: 'error', checking: false, error: _msg });
        onError(_err, state?.store, decrypt);
      } else {
        setState({ status: 'error', checking: false, error: translations[locale].generateError });
      }
    }
    return null;
  };
  useInterval(checkStatus, getCheckInterval());

  return { state, generate, cancelWhenScanned };
}
