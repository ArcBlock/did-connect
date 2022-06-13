import React, { useMemo, useState, useEffect } from 'react';
import Cookie from 'js-cookie';
import joinUrl from 'url-join';
import useBrowser from '@arcblock/react-hooks/lib/useBrowser';
import { createMachine } from '@did-connect/state';

import { decodeConnectUrl, parseTokenFromConnectUrl, updateConnectedInfo } from '../../utils';
import useMachine from './machine';

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

const noop = () => null;

export default function useSession({
  prefix,
  onCreate = noop,
  onConnect,
  onApprove,
  onComplete = noop,
  onTimeout = noop,
  onReject = noop,
  onCancel = noop,
  onError = noop,
  baseUrl,
  autoConnect = true,
  onlyConnect = false,
  // FIXME: support optional saveConnect
  // FIXME: timeout does not work now
  // timeout,
}) {
  console.log('useSession', { autoConnect, onlyConnect });
  const browser = useBrowser();
  const existingSession = useMemo(() => parseExistingSession(), []);

  const [cancelCount, setCancelCount] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  const _onComplete = async (...args) => {
    if (autoConnect && state.context.currentConnected) {
      updateConnectedInfo(state.context);
    }
    await onComplete(...args);
  };

  const session = useMemo(
    () =>
      createMachine({
        baseUrl: joinUrl(baseUrl, prefix),
        sessionId: existingSession ? existingSession.sessionId : null,
        // initial = 'start', // we maybe reusing existing session
        // strategy = 'default',
        dispatch: (...args) => send.call(service, ...args),
        onCreate,
        onConnect,
        onApprove,
        onComplete: _onComplete,
        onTimeout,
        onReject,
        onCancel,
        onError,

        // - autoConnect 请求参数用于控制服务端是否给钱包应用发送自动连接通知
        // - 使用 connect 组件时明确传入了 autoConnect = false, 则 autoConnect 请求参数 为 false
        // - 如果 cancelCount > 0, 说明用户进行过 cancel 操作, 则临时禁用自动连接, autoConnect 请求参数 为 false
        //   (避免 "无限自动连接问题")
        // - 如果上次使用了 web wallet 进行连接, 则 autoConnect 请求参数 为 false (web wallet 并非像 native 钱包一样基于通知实现自动连接)
        //   (防止 native 钱包收到通知自动唤起 auth 窗口)
        autoConnect: autoConnect && !browser.wallet && !cancelCount && Cookie.get('connected_wallet_os') !== 'web',

        // do supervised authPrincipal and end the session
        onlyConnect,

        // timeout: {
        //   WALLET_SCAN_TIMEOUT: 10000,
        // },
      }),
    [retryCount] // eslint-disable-line
  );

  const { machine, deepLink, sessionId } = session;
  const [state, send, service] = useMachine(machine);

  const cancel = () => {
    send({ type: 'CANCEL' });
    setCancelCount((counter) => counter + 1);
  };

  const generate = () => {
    setRetryCount((counter) => counter + 1);
  };

  // 每次 cancel 操作时计数器 +1 => 重新生成 token
  useEffect(() => {
    if (cancelCount > 0) {
      generate();
    }
  }, [cancelCount]); // eslint-disable-line

  // 任何导致 Connect 组件 unmounted 的操作 (比如 dialog 关闭) => 调用 timeout api 清除 token
  // 关闭时如果 token 状态处于 created，那么应该通知后端给删掉
  // 说明: 此处需要借助 useRef 在 useEffect return function 中访问 state
  // const closeSessionRef = useRef(null);
  // useEffect(() => {
  //   closeSessionRef.current = { state, params };
  // });
  // useEffect(() => {
  //   return () => {
  //     // eslint-disable-next-line no-shadow
  //     const { state, params } = closeSessionRef.current;
  //     if (state.status === 'created') {
  //       if (params[tokenKey]) {
  //         checkFn(`${prefix}/${action}/timeout?${stringifyQuery(params)}`, {
  //           headers: getExtraHeaders(baseUrl),
  //         });
  //       }
  //     }
  //   };
  // }, []);

  // const applyExistingToken = async () => {
  //   try {
  //     if (existingSession.error) {
  //       throw existingSession.error;
  //     }
  //     setState({
  //       loading: true,
  //       token: existingSession.token,
  //       url: existingSession.url,
  //       inExistingSession: true,
  //     });
  //     const data = await checkStatus();
  //     // existingSession.token 合法的初始状态必须是 created
  //     if (data?.status && data?.status !== 'created') {
  //       throw new Error(`${translations[locale].invalidSessionStatus} [${data.status}]`);
  //     }
  //   } catch (e) {
  //     setState({ status: 'error', error: e.message });
  //     onError(e, state?.store, decrypt);
  //   } finally {
  //     setState({ loading: false });
  //   }
  // };

  return {
    sessionId,
    session: { status: state.value, context: state.context, deepLink },
    dispatch: send,
    generate,
    cancel,
  };
}
