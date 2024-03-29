/* eslint-disable @typescript-eslint/naming-convention */
import { useMemo, useState, useEffect } from 'react';
import Cookie from 'js-cookie';
import Debug from 'debug';
import { interpret } from 'xstate';
import useBrowser from '@arcblock/react-hooks/lib/useBrowser';
import { createStateMachine, TSessionMachine } from '@did-connect/state';
import { TSession, TSessionStatus, TEvent, SessionTimeout } from '@did-connect/types';

import { decodeConnectUrl, parseSessionId, updateConnectedInfo, noop } from '../../utils';
import { useMachine } from './machine';
import { THookProps, THookResult } from '../../types';

const debug = Debug('@did-connect/react');

// 从 url params 中获取已存在的 session (sessionId & connect url)
const parseExistingSession = (sid?: string): { sessionId: string } => {
  try {
    if (sid) {
      return { sessionId: sid };
    }
    const url = new URL(window.location.href);
    const connectUrlParam = url.searchParams.get('__connect_url__');
    if (!connectUrlParam) {
      return { sessionId: '' };
    }
    const connectUrl = decodeConnectUrl(connectUrlParam);
    const sessionId = parseSessionId(connectUrl);
    return { sessionId };
  } catch (err: any) {
    throw new Error(`Can not parse existing session id: ${err.message}`);
  }
};

export function useSession({
  relayUrl,
  sessionId: sid = '',
  onCreate = noop,
  onConnect,
  onApprove,
  onComplete = noop,
  onTimeout = noop,
  onReject = noop,
  onCancel = noop,
  onError = noop,
  strategy = 'default',
  autoConnect = true,
  forceConnected = true,
  saveConnect = true,
  onlyConnect = false,
  timeout = SessionTimeout,
}: THookProps): THookResult {
  const browser = useBrowser();
  const existingSession = useMemo(() => parseExistingSession(sid), [sid]);

  const [cancelCount, setCancelCount] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  const _onComplete = async (...args: any[]) => {
    if (saveConnect && service.state.context.currentConnected) {
      updateConnectedInfo(service.state.context);
    }
    // @ts-ignore
    await onComplete(...args);
  };

  const session: TSessionMachine = useMemo(
    () => {
      const _autoConnect =
        !!autoConnect && !browser.wallet && !retryCount && !cancelCount && Cookie.get('connected_wallet_os') !== 'web';
      debug('create session', {
        autoConnect: _autoConnect,
        onlyConnect,
        strategy,
        sessionId: existingSession.sessionId,
      });
      return createStateMachine({
        relayUrl,
        sessionId: existingSession.sessionId,
        // initial = 'start', // we maybe reusing existing session
        strategy,
        // @ts-ignore
        dispatch: (...args: any[]) => send.call(service, ...args),
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
        autoConnect: _autoConnect,
        forceConnected: !!forceConnected,
        // do supervised authPrincipal and end the session
        onlyConnect: !!onlyConnect,
        // timeout for each stage
        timeout,
      });
    },
    [retryCount, cancelCount] // eslint-disable-line
  );

  const { machine, deepLink, sessionId, cleanup } = session;
  const [, send, service] = useMachine<TSession, TEvent>(machine);

  const cancel = () => {
    if (existingSession.sessionId) {
      return;
    }
    send('CANCEL');
    setCancelCount((counter) => counter + 1);
  };

  const generate = () => {
    if (existingSession.sessionId) {
      return;
    }
    setRetryCount((counter) => counter + 1);
  };

  // 每次 cancel 操作时计数器 +1 => 重新生成 token
  useEffect(() => {
    if (cancelCount > 0) {
      generate();
    }
  }, [cancelCount]); // eslint-disable-line

  // unmount 时如果 session 状态处于 created，那么应该通知后端给删掉
  useEffect(() => {
    return () => {
      if (service.state.value === 'created') {
        cleanup().catch(console.error);
      }
    };
  }, []); // eslint-disable-line

  const { value, context } = service.state;

  return {
    sessionId,
    session: {
      status: value as TSessionStatus,
      context,
      deepLink,
      existing: !!existingSession.sessionId,
    },
    dispatch: send,
    generate,
    cancel,
  };
}

/**
 * Create a session for later use
 * The machine will not start automatically
 */
export function createSession({
  relayUrl,
  onCreate = noop,
  onConnect = () => Promise.resolve([]),
  onApprove = () => Promise.resolve({}),
  onComplete = noop,
  onTimeout = noop,
  onReject = noop,
  onCancel = noop,
  onError = noop,
  strategy = 'default',
  autoConnect = true,
  forceConnected = true,
  onlyConnect = false,
  timeout = SessionTimeout,
}: THookProps): Promise<TSessionMachine> {
  return new Promise((resolve) => {
    const session = createStateMachine({
      relayUrl,
      sessionId: '',
      strategy,
      dispatch: noop,
      onCreate,
      onConnect,
      onApprove,
      onComplete,
      onTimeout,
      onReject,
      onCancel,
      onError,
      autoConnect,
      forceConnected,
      onlyConnect,
      timeout,
    });

    // wait for session created
    const service = interpret(session.machine);
    service.onTransition((currentState) => {
      if (currentState.value === 'created') {
        service.stop();
        resolve(session);
      }
    });
    service.start();
  });
}
