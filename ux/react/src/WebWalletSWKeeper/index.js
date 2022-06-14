import { useEffect } from 'react';
import PropTypes from 'prop-types';
import useIdle from 'react-use/lib/useIdle';
import useLocalStorage from 'react-use/lib/useLocalStorage';
import { getWebWalletUrl, checkSameProtocol } from '../utils';

// 默认最大空闲时间: 30min
const DEFAULT_MAX_IDLE_TIME = 1000 * 60 * 30;
// 可使用 localStorage.setItem('wallet_sw_keeper_disabled', 1) 来禁用嵌入 wallet iframe
const STORAGE_KEY_DISABLED = 'wallet_sw_keeper_disabled';
// iframe id, 如果存在多个 WebWalletSWKeeper 组件实例, 共享此 id, 保证只有一个 iframe
let id;

const injectIframe = (webWalletUrl) => {
  const iframe = document.createElement('iframe');
  iframe.id = id;
  iframe.style.width = 0;
  iframe.style.height = 0;
  iframe.style.border = 0;
  // https://stackoverflow.com/questions/27858989/iframe-with-0-height-creates-a-gap
  iframe.style.display = 'block';
  // fix: 页面自动滚动到底部问题 (https://github.com/blocklet/abt-wallet/issues/1160)
  //      top: 0 可能不是必须的, 但测试中发现, 如果不设置, 在某些特殊情况下似乎也会导致页面自动滚动到底部
  iframe.style.position = 'absolute';
  iframe.style.top = 0;
  iframe.src = `${webWalletUrl}?action=iframe`;
  document.body.appendChild(iframe);
};

const removeIframe = () => {
  const iframe = document.getElementById(id);
  if (iframe) {
    document.body.removeChild(iframe);
  }
};

const cleanup = () => {
  removeIframe();
  id = null;
};

const enable = (webWalletUrl) => {
  if (!id) {
    id = `web_wallet_sw_keeper_${Date.now()}`;
    injectIframe(webWalletUrl);
  }
};

// 该组件通过嵌入一个 web wallet iframe 帮助 web wallet service worker 延最大空闲时间
function WebWalletSWKeeper({ webWalletUrl, maxIdleTime }) {
  const isIdle = useIdle(maxIdleTime);
  // 用户操作空闲时间超过 maxIdleTime 时禁用, 活跃时启用
  useEffect(() => {
    if (isIdle) {
      cleanup();
    } else {
      enable(webWalletUrl);
    }
  }, [isIdle]);
  // 组件销毁时自动清理
  useEffect(() => () => cleanup(), []);
  return null;
}

WebWalletSWKeeper.propTypes = {
  webWalletUrl: PropTypes.string.isRequired,
  maxIdleTime: PropTypes.number,
};

WebWalletSWKeeper.defaultProps = {
  maxIdleTime: DEFAULT_MAX_IDLE_TIME,
};

export default WebWalletSWKeeper;

export const withWebWalletSWKeeper = (Component) => {
  // eslint-disable-next-line react/prop-types
  return function WithWebWalletSWKeeperComponent({ webWalletUrl, maxIdleTime, ...rest }) {
    // eslint-disable-next-line no-param-reassign
    webWalletUrl = webWalletUrl || getWebWalletUrl();
    const [disabled] = useLocalStorage(STORAGE_KEY_DISABLED);
    const webWalletExtension = window.ABT_DEV || window.ABT;
    const isSameProtocol = checkSameProtocol(webWalletUrl);
    // 以下几种情况不会嵌入 wallet iframe :
    // - 通过设置 localStorage#wallet_sw_keeper_disabled = 1 明确禁止 (开发调试过程中可以使用, 避免控制台打印一堆日志影响调试)
    // - 检查到 wallet 浏览器插件
    // - webWalletUrl 与当前页面 url 的 protocol 不同
    return (
      <>
        {!disabled && !webWalletExtension && isSameProtocol && (
          <WebWalletSWKeeper webWalletUrl={webWalletUrl} maxIdleTime={maxIdleTime} />
        )}
        <Component webWalletUrl={webWalletUrl} {...rest} />
      </>
    );
  };
};
