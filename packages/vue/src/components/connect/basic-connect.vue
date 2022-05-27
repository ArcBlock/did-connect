<script setup>
import { ref, computed, unref } from 'vue';
import dsBridge from 'dsbridge';
import { useElementSize, whenever } from '@vueuse/core';
import { openWebWallet } from '@arcblock/ux/src/Util';
import DidWalletLogo from '@arcblock/icons/src/icons/did-wallet-logo.svg?component';

import Spinner from '../spinner';
import AppInfo from './app-info.vue';
import ActionInfo from './action-info.vue';
import StatusCard from './status-card.vue';
import GetWalletCard from './get-wallet.vue';
import ConnectWebWalletCard from './connect-web-wallet-card.vue';
import ConnectMobileWalletCard from './connect-mobile-wallet-card.vue';

import locales from './libs/locales';
import { getWebWalletUrl, checkSameProtocol } from './libs/utils';
import useBrowserEnv from './hooks/use-browser-env';
import MobileWalletCard from './mobile-wallet-card.vue';
import useConnect from './hooks/use-connect';

const props = defineProps({
  locale: {
    type: String,
    default: 'en',
    validator: (v) => ['en', 'zh'].includes(v),
  },
  tokenKey: {
    type: String,
    default: '_t_',
  },
  encKey: {
    type: String,
    default: '_ek_',
  },
  enabledConnectTypes: {
    type: Array,
    default: () => ['web', 'mobile'],
  },
  webWalletUrl: {
    type: String,
    default: '',
  },
  showDownload: {
    type: Boolean,
    default: true,
  },
  qrcodeSize: {
    type: Number,
    default: 184,
  },
  messages: {
    type: Object,
    required: true,
  },
  state: {
    type: Object,
    required: true,
  },
  generate: {
    type: Function,
    required: true,
  },
  cancelWhenScanned: {
    type: Function,
    required: true,
  },
});
const emits = defineEmits(['success', 'close', 'error', 'recreateSession']);

// #442, 页面初始化时的可见性, 如果不可见 (比如通过在某个页面中右键在新标签页中打开的一个基于 did-connect 登录页) 则禁止自动弹出 web wallet 窗口
const initialDocVisible = !document.hidden;

const rootRef = ref(null);
const cancelCounter = ref(0);
const webWalletUrl = computed(() => getWebWalletUrl(props.webWalletUrl));
const computedLocale = computed(() => {
  return locales[props.locale] ? props.locale : 'en';
});
const { width } = useElementSize(rootRef);
const matchSmallScreen = computed(() => {
  return unref(width) < 600;
});
const { isWalletWebview, isMobile } = useBrowserEnv();
const isSameProtocol = checkSameProtocol(unref(webWalletUrl));
const { cookieConnectedWalletOs } = useConnect();
const connectedDid = computed(() => props.state.connectedDid || '');

const deepLink = computed(() => {
  if (!props.state.url) {
    return '';
  }

  const link = new URL(props.state.url);

  if (isMobile) {
    link.protocol = 'abt:';

    const callbackUrl = new URL(window.location.href);
    callbackUrl.searchParams.append(props.tokenKey, props.state.token);

    link.searchParams.append('callback', encodeURIComponent(callbackUrl.href));
    link.searchParams.append('callback_delay', 1500);
  }

  return link.href;
});

const showLoading = computed(
  () => props.state.loading || (!['error', 'succeed'].includes(props.state.status) && unref(isWalletWebview))
);
const showStatus = computed(() => ['scanned', 'succeed', 'error'].includes(props.state.status));
const showConnectMobileWalletCard = computed(() => !unref(showLoading) && (unref(isWalletWebview) || unref(isMobile)));

const showWalletWays = computed(() => {
  if (['created', 'timeout'].includes(props.state.status) && !isWalletWebview) {
    return props.enabledConnectTypes;
  }
  return [];
});
const showConnectWithWebWallet = computed(() => unref(showWalletWays).includes('web') && unref(isSameProtocol));
const showScanWithMobileWallet = computed(() => unref(showWalletWays).includes('mobile'));

const statusMessages = computed(() => {
  return {
    confirm: props.messages.confirm, // scanned
    success: props.messages.success,
    error: props.state.error || '',
  };
});

const shouldAutoLogin = computed(() => {
  if (unref(cancelCounter) > 0) {
    return false;
  }
  if (props.state.status === 'created') {
    // 自动唤起 native wallet
    if (unref(isWalletWebview) && unref(deepLink)) {
      return true;
    }
    // 自动弹起 web wallet
    if (
      unref(showConnectWithWebWallet) &&
      props.state.saveConnect &&
      props.state.status === 'created' &&
      unref(initialDocVisible) &&
      unref(cookieConnectedWalletOs) === 'web'
    ) {
      return true;
    }
  }
  return false;
});

whenever(shouldAutoLogin, () => {
  if (unref(isWalletWebview)) {
    dsBridge.call('authAction', {
      action: 'auth',
      deepLink: unref(deepLink),
    });
  } else {
    onGoWebWallet(props.state.url);
  }
});

function handleRetry() {
  emits('recreateSession');
  // inExistingSession 为 true 时不重新生成 token
  if (!props.state.inExistingSession) {
    props.generate();
  }
}
function handleCancel() {
  emits('close');
  emits('recreateSession');
  if (!props.state.inExistingSession) {
    cancelCounter.value++;
    props.cancelWhenScanned();
  }
}
function handleRefresh() {
  emits('recreateSession');
  if (!props.state.inExistingSession) {
    props.generate(false);
  }
}

function onGoWebWallet(url) {
  return openWebWallet({
    webWalletUrl: unref(webWalletUrl),
    url,
    locale: unref(computedLocale),
  });
}
</script>

<template>
  <Spinner v-if="showLoading" mode="fullscreen">
    <slot name="loading"></slot>
    <template v-if="$slots.loading" #icon></template>
  </Spinner>

  <div v-else ref="rootRef" class="did-connect">
    <div class="auth_inner">
      <AppInfo v-if="!showStatus && state.appInfo" :appInfo="state.appInfo" />
      <ActionInfo v-if="!showStatus" :messages="props.messages" />

      <main
        :class="{
          'did-connect__main': true,
          'auth_main--small': matchSmallScreen,
        }"
      >
        <div>
          <!-- 显示 connect 标题 -->
          <template v-if="!showStatus && !connectedDid">
            <div class="flex items-center justify-center">
              <div class="text-[#999] font-bold leading-1" style="font-size: 14px">
                {{ locales[computedLocale].connect }}
              </div>
              <DidWalletLogo class="h-[1em] ml-[8px]" />
            </div>
          </template>

          <!-- 显示连接提示 -->
          <template v-if="!showStatus && shouldAutoLogin">
            <div class="flex items-center justify-center flex-wrap text-[#999] leading-[24px]">
              <Spinner :size="12" />
              <div class="flex items-center ml-3 leading-1">
                {{ locales[computedLocale].connecting }}
                <DidWalletLogo class="h-[1em] ml-[8px]" />
              </div>
              <div class="ml-1">
                {{ locales[computedLocale].connectingSuffix }}
              </div>
            </div>
          </template>

          <div class="auth_main-inner">
            <!-- 显示当前连接状态 -->
            <template v-if="showStatus">
              <StatusCard
                class="auth_status"
                :status="state.status"
                :messages="statusMessages"
                :locale="computedLocale"
                @cancel="handleCancel"
                @retry="handleRetry"
              />
            </template>

            <template v-if="showConnectWithWebWallet || showScanWithMobileWallet">
              <div className="auth_connect-types">
                <!-- 显示 Web Wallet 连接按钮 -->
                <ConnectWebWalletCard
                  v-if="!isMobile && showConnectWithWebWallet"
                  class="auth_connect-type"
                  :layout="`${matchSmallScreen ? 'lr' : 'tb'}`"
                  :tokenState="state"
                  :webWalletUrl="webWalletUrl"
                  @refresh="handleRefresh"
                  @click="() => onGoWebWallet(state.url)"
                />
                <!-- 显示 mobile 连接二维码 -->
                <MobileWalletCard
                  v-if="showScanWithMobileWallet"
                  class="auth_connect-type"
                  :qrcodeSize="qrcodeSize"
                  :tokenState="state"
                  :layout="`${matchSmallScreen ? 'lr' : 'tb'}`"
                  @refresh="handleRefresh"
                />
                <!-- TODO: onClick => open deepLink -->
                <ConnectMobileWalletCard
                  v-if="showConnectMobileWalletCard"
                  class="auth_connect-type"
                  :deepLink="deepLink"
                  :tokenState="state"
                  :layout="`${matchSmallScreen ? 'lr' : 'tb'}`"
                  @refresh="handleRefresh"
                />
              </div>
            </template>
          </div>

          <!-- 显示下载钱包按钮 -->
          <GetWalletCard
            v-if="!isWalletWebview"
            :locale="computedLocale"
            :style="{
              visibility: showStatus ? 'hidden' : 'visible',
            }"
          />
          <slot v-if="showConnectWithWebWallet || showScanWithMobileWallet" name="extra"></slot>
        </div>
      </main>
    </div>
  </div>
</template>

<style lang="less" scoped>
.did-connect {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  position: relative;
  height: 100%;
  overflow-y: auto;
  line-height: 1.2;
  font-family: 'Lato';
  color: #334660;
  background-color: #fbfcfd;

  &,
  & *,
  & *:before,
  & *:after {
    box-sizing: border-box;
  }

  .auth_inner {
    width: 100%;
    margin: auto 0;
    padding: 40px 16px;
  }
}
.did-connect__main {
  margin-top: 48px;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  .auth_main-inner {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    align-items: stretch;
    height: 264px;
    margin-top: 24px;
  }
  .auth_connect-type {
    width: 264px;
  }
  .auth_status {
    width: auto;
  }
  .auth_connect-types {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    align-items: stretch;
    flex-wrap: wrap;
  }
  .auth_connect-type + .auth_connect-type {
    margin-left: 24px;
  }

  /* 窄屏样式 */
  &.auth_main--small {
    .auth_main-inner {
      height: auto;
    }
    .auth_connect-types {
      align-items: center;
      flex-direction: column;
    }
    .auth_connect-type {
      width: 340px;
    }
    .auth_connect-type + .auth_connect-type {
      margin: 24px 0 0 0;
    }
  }
}
</style>
