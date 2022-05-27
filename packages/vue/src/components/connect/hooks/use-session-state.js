import { onUnmounted, reactive, ref, unref, computed, watch } from 'vue';
import tweetnacl from 'tweetnacl';
import SealedBox from 'tweetnacl-sealedbox-js';
import { useIntervalFn, useStorage } from '@vueuse/core';
import EventClient from '@arcblock/event-client';
import qs from 'querystring';
import { Buffer } from 'buffer';

import useBrowser from '../../../hooks/use-browser';
import { decodeKey, encodeKey, getExtraHeaders, parseExistingSession } from '../libs/utils';
import locales from '../libs/locales';
import { getAppId } from '../../session/utils';
import useConnect from './use-connect';

export default ({
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
}) => {
  const { cookieConnectedDid, cookieConnectedPk, cookieConnectedApp, cookieConnectedWalletOs } = useConnect();
  const existingSession = computed(() => parseExistingSession(), []);
  const maxCheckCount = Math.ceil(checkTimeout / checkInterval);
  const keyPair = tweetnacl.box.keyPair();
  const encryptKey = useStorage('__encKey', encodeKey(keyPair.publicKey));
  const decryptKey = useStorage('__decKey', encodeKey(keyPair.secretKey));
  const cancelWhenScannedCounter = ref(0);

  const computedCheckInterval = computed(() => {
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
  });

  const subscriptions = reactive({});
  const socket = ref(null);
  const connection = ref(null);
  const subscription = ref(null);
  const onSuccessCalled = ref(false);

  const browser = useBrowser();
  const fns = {};

  const createToken = createTokenFn({
    action,
    prefix,
    checkFn,
    extraParams: {
      ...extraParams,
      [encKey]: unref(encryptKey),
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
        !unref(cancelWhenScannedCounter) &&
        unref(cookieConnectedWalletOs) !== 'web',
      // 区分 电脑 WEB vs native web
    },
    baseUrl,
  });

  const state = reactive({
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

  const params = computed(() => {
    return {
      ...extraParams,
      locale,
      [tokenKey]: state.token || unref(existingSession)?.token,
    };
  });

  onUnmounted(() => {
    if (state.status === 'created') {
      checkFn(`${prefix}/${action}/timeout?${qs.stringify(unref(params))}`, {
        headers: getExtraHeaders(baseUrl),
      });
    }
  });

  watch(cancelWhenScannedCounter, () => {
    if (unref(cancelWhenScannedCounter) > 0) {
      // 计数器 > 0, 说明人为触发了 cancel, 重新生成 token
      generate();
    }
  });

  // 需要改成监听组件变化
  watch(
    [
      () => state.checkCount,
      () => state.status,
      () => state.token,
      () => state.store,
      () => state.loading,
      () => state.error,
      () => state.saveConnect,
      () => state.store?.did,
    ],
    reCheck,
    {
      immediate: true,
    }
  );

  useIntervalFn(() => {
    if (unref(computedCheckInterval) !== null) {
      checkStatus();
    }
  }, computedCheckInterval);

  return {
    state,
    generate,
    cancelWhenScanned,
  };

  function reCheck() {
    if (!state.token && !state.store && !state.loading && !state.error) {
      // connect to existing session if any
      if (unref(existingSession)) {
        applyExistingToken();
        // Create our first token if we do not have one
      } else {
        generate(false);
        return;
      }
    }

    // Try to use websocket
    if (state.token && socketUrl && !unref(socket)) {
      socket.value = new EventClient(socketUrl);
      connection.value = socket.value;
      return;
    }
    if (state.token && unref(connection) && !subscriptions[state.token]) {
      unref(connection)
        .subscribe('auth', state.token)
        .then((sub) => {
          subscription.value = sub;
          subscriptions[state.token] = sub;
          sub.on('data', (data) => {
            let { status, error } = data;
            if (status === 'forbidden') {
              error = locales[locale].forbidden;
              status = 'error';
            }
            state.status = status;
            state.store = data;
            state.error = error;
          });
        })
        .catch(() => {
          // Do nothing
        });
    }

    // Mark token as expired if exceed max retry count
    if (state.status !== 'timeout' && state.checkCount > unref(maxCheckCount)) {
      state.status = 'timeout';
      unsubscribe();
      return;
    }

    // Trigger on success if we completed the process
    if (state.status === 'succeed') {
      // save connected_did to cookie
      if (state.saveConnect && state.store.did) {
        // connected_did and connected_pk are used to skip authPrincipal
        cookieConnectedDid.value = state.store.did || '';
        cookieConnectedPk.value = state.store.pk || '';
        // connected_app is used to check session validity
        cookieConnectedApp.value = getAppId(state.appInfo);
        if (state.store.connectedWallet?.os) {
          cookieConnectedWalletOs.value = state.store.connectedWallet.os;
        }
      }

      if (typeof onSuccess === 'function' && !unref(onSuccessCalled)) {
        onSuccessCalled.value = true;
        onSuccess(state.store, decrypt);
      }
    }
  }

  // Check auth token status
  async function checkStatus() {
    if (state.checking) {
      return null;
    }

    state.checkCount += 1;

    // Do not do status check if we have websocket connection
    if (unref(connection) && unref(subscription)) {
      return null;
    }

    try {
      state.checking = true;
      const res = await checkFn(`${prefix}/${action}/status?${qs.stringify(unref(params))}`, {
        headers: getExtraHeaders(baseUrl),
      });
      const { status, error: newError } = res.data;

      state.store = res.data;
      state.checking = false;
      state.status = status;
      if (status === 'error' && newError) {
        const err = new Error(newError);
        err.response = res;
        throw err;
      }
      return res.data;
    } catch (err) {
      const { response } = err;
      if (response && response.status) {
        checkFn(`${prefix}/${action}/timeout?${qs.stringify(unref(params))}`, {
          headers: getExtraHeaders(baseUrl),
        });
        const _msg = response.data && response.data.error ? response.data.error : err.message;
        const _err = new Error(_msg);
        _err.code = response.status;
        state.error = _msg;
        state.status = 'error';
        state.checking = false;
        onError(_err, state?.store, decrypt);
      } else {
        state.error = locales[locale].generateError;
        state.status = 'error';
        state.checking = false;
      }
    }
    return null;
  }

  async function applyExistingToken() {
    try {
      if (unref(existingSession).error) {
        throw unref(existingSession).error;
      }
      state.loading = true;
      state.token = unref(existingSession).token;
      state.url = unref(existingSession).url;
      state.inExistingSession = true;
      const data = await checkStatus();
      // existingSession.token 合法的初始状态必须是 created
      if (data?.status && data?.status !== 'created') {
        throw new Error(`${locales[locale].invalidSessionStatus} [${data.status}]`);
      }
    } catch (e) {
      state.status = 'error';
      state.error = e.message;
      onError(e, state?.store, decrypt);
    } finally {
      state.loading = false;
    }
  }

  function cancelWhenScanned() {
    cancelWhenScannedCounter.value++;
  }

  // 切换账户或者 token 过期之后需要重新生成
  async function generate(cleanup = true) {
    if (cleanup) {
      unsubscribe();
    }

    try {
      state.loading = true;
      state.token = '';
      state.url = '';
      state.store = null;
      const data = await createToken();
      const extra = data.extra || {};
      state.loading = false;
      state.token = data.token;
      state.url = data.url;
      state.status = 'created';
      state.error = '';
      state.checkCount = 0;
      state.appInfo = data.appInfo;
      state.connectedDid = extra.connectedDid;
      state.saveConnect = extra.saveConnect;
    } catch (err) {
      state.loading = false;
      state.status = 'error';
      state.error = `${locales[locale].generateError}: ${err.message}`;
    }
  }

  function unsubscribe() {
    try {
      checkFn(`${prefix}/${action}/timeout?${qs.stringify(unref(params))}`, {
        headers: getExtraHeaders(baseUrl),
      });
    } catch (err) {
      // Do nothing
    }

    try {
      if (state.token && unref(connection) && unref(subscription)) {
        unref(connection).unsubscribe('auth', state.token);
      }
    } catch (err) {
      // Do nothing
    }
  }

  function decrypt(value) {
    const decrypted = SealedBox.open(
      Uint8Array.from(Buffer.from(value, 'base64')),
      decodeKey(unref(encryptKey)),
      decodeKey(unref(decryptKey))
    );
    return JSON.parse(Buffer.from(decrypted).toString('utf8'));
  }
  function createTokenFn({ action, prefix, checkFn, extraParams, baseUrl }) {
    const key = `${prefix}/${action}/token?${qs.stringify(extraParams || {})}`;
    if (!fns[key]) {
      fns[key] = async function createToken() {
        const headers = getExtraHeaders(baseUrl);
        const { data } = await checkFn(key, { headers });
        if (data && data.token) {
          return data;
        }

        if (data && data.error) {
          throw new Error(data.error);
        }

        throw new Error(`Error generating ${action} qrcode`);
      };
    }
    return fns[key];
  }
};
