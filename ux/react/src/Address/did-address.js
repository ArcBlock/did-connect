import { useRef, useState, forwardRef } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import '@fontsource/ubuntu-mono/400.css';
import useMountedState from 'react-use/lib/useMountedState';
import Tooltip from '@mui/material/Tooltip';
import { green } from '@mui/material/colors';
import copy from 'copy-to-clipboard';
import CopyIcon from '@arcblock/icons/lib/Copy';
import CompactText from './compact-text';

export const formatAddress = (str) => str.split(':').pop();

const translations = {
  en: {
    copy: 'Click To Copy',
    copied: 'Copied!',
  },
  zh: {
    copy: '点击复制',
    copied: '已复制!',
  },
};

/**
 * DidAddress 组件 (新版设计)
 *
 * - 样式调整
 * - click-to-copy 调整
 * - 长文本截断处理 (Ellipsis)
 * - 支持 inline 或 block 的显示方式
 * - 支持紧凑模式, 该模式下:
 *   - 占用宽度较小, 因此不考虑水平空间不够用的情况, 且忽略末尾省略号
 *   - 对于多层元素结构的 children, 保持元素结构, 将最内层 text 替换为 CompactText 组件
 *   - 为保证 copy 功能正常工作, 原 children 始终渲染, 但在紧凑式下会隐藏
 *   - 可配合 useMediaQuery 使用
 */
const DidAddress = forwardRef(
  (
    { component, size, copyable, content, children, prepend, append, compact, startChars, endChars, locale, ...rest },
    ref
  ) => {
    if (!translations[locale]) {
      // eslint-disable-next-line no-param-reassign
      locale = 'en';
    }
    // 避免 unmounted 后 setTimeout handler 依然改变 state
    const isMounted = useMountedState();

    const [copied, setCopied] = useState(false);
    const textRef = useRef();
    const onCopy = (e) => {
      e.stopPropagation();
      copy(content || textRef.current.textContent);
      setCopied(true);
      // 恢复 copied 状态
      setTimeout(() => {
        if (isMounted()) {
          setCopied(false);
        }
      }, 1500);
    };

    let copyElement = null;
    if (copyable) {
      copyElement = (
        <span className="did-address__copy-wrapper" title={copied ? '' : translations[locale].copy}>
          {copied ? (
            <Tooltip title={translations[locale].copied} placement="bottom" arrow open={copied}>
              <i className="fal fa-check did-address__copy" style={{ color: green[500] }} />
            </Tooltip>
          ) : (
            /* title prop 直接加在 icon 上不生效 */
            <CopyIcon className="did-address__copy" onClick={onCopy} />
          )}
        </span>
      );
    }

    return (
      <Root as={component} size={size} {...rest} ref={ref}>
        {prepend}
        {/* 注意: 该元素必须渲染(可以隐藏), 以便 compact 模式下复制的文本是完整的 */}
        <span
          ref={textRef}
          className="did-address__text did-address-truncate"
          style={{ display: compact ? 'none' : 'inline' }}
        >
          {children}
        </span>
        {compact && (
          <span className="did-address__text">
            <CompactText startChars={startChars} endChars={endChars}>
              {children}
            </CompactText>
          </span>
        )}
        {copyElement}
        {append}
      </Root>
    );
  }
);

export default DidAddress;

DidAddress.propTypes = {
  component: PropTypes.string,
  size: PropTypes.number,
  copyable: PropTypes.bool,
  children: PropTypes.any,
  content: PropTypes.string,
  inline: PropTypes.bool,
  prepend: PropTypes.any,
  append: PropTypes.any,
  // 紧凑模式
  compact: PropTypes.bool,
  startChars: PropTypes.number,
  endChars: PropTypes.number,
  locale: PropTypes.oneOf(['en', 'zh']),
};

DidAddress.defaultProps = {
  component: 'span',
  size: 0,
  copyable: true,
  children: null,
  content: '',
  inline: false,
  prepend: null,
  append: null,
  compact: false,
  startChars: 6,
  endChars: 6,
  locale: 'en',
};

const getFontSize = (size) => {
  // 12px 及以上的 size 有效, 否则返回 inherit
  if (size && Number(size) >= 12) {
    return `${Number(size)}px`;
  }
  return 'inherit';
};

const Root = styled.div`
  font-family: 'Ubuntu Mono', monospace;
  && {
    display: ${({ inline }) => (inline ? 'inline-flex' : 'flex')};
    align-items: center;
    max-width: 100%;
    overflow: hidden;
    color: #ccc;
    font-size: ${(props) => getFontSize(props.size)};
    font-weight: 400;

    svg {
      fill: currentColor;
    }
  }

  .did-address__text {
    color: #666;
  }
  /* truncate string with ellipsis */
  .did-address-truncate {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .did-address__logo,
  .did-address__copy {
    flex: 0 0 auto;
  }
  .did-address__logo {
    margin-right: 8px;
    color: #ccc;
  }
  .did-address__copy-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 1em;
    height: 1em;
    margin-left: 8px;
  }
  .did-address__copy {
    width: auto;
    height: 1em;
    color: #999;
    cursor: pointer;
  }

  /* link */
  a {
    color: #666;
  }
  &:hover a {
    color: #222;
    text-decoration: underline;
  }
`;
