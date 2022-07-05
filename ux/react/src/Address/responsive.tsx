import { useState, createRef, useEffect } from 'react';
import styled from 'styled-components';
import useMeasure from 'react-use/lib/useMeasure';

import DidAddress from './simple';
import { ResponsiveProps } from './types';

/**
 * 根据父容器宽度自动切换 compact 模式
 *
 * 实现逻辑:
 * - DidAddress 外层包裹一个容器, 其宽度自动撑满父容器宽度 (即这个容器需要是块级元素或 100% 宽的 inline-block)
 * - DidAddress 本身以 inlne 形式渲染 (方便探测 did-address 的 full-width)
 * - 组件 mounted 时记录 did address 的 full-width (非 compact 模式的宽度)
 * - 监听容器宽度变化, 当容器宽度变化时, 对比容器宽度和 did address full-width, => 切换 compact 模式
 * - TODO: 初始化时, 在确定是否应该以 compact 模式渲染前, 隐藏显示, 避免闪烁问题
 */
export default function ResponsiveDidAddress({
  style = {},
  className = '',
  component = 'span',
  ...rest
}: ResponsiveProps): JSX.Element {
  const [compact, setCompact] = useState(false);
  // did address 完整显示时的宽度
  const [addressFullWidth, setAddressFullWidth] = useState(null);
  const [containerRef, { width: containerWidth }] = useMeasure();
  const ref = createRef();
  // 存储完整显示时 address 组件的宽度
  useEffect(() => {
    if (!compact && addressFullWidth === null) {
      setAddressFullWidth((ref as any).current.offsetWidth);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (containerWidth && addressFullWidth) {
      setCompact(containerWidth < addressFullWidth);
    }
  }, [containerWidth, addressFullWidth]);

  return (
    // @ts-ignore
    <Root as={component} inline={(rest as any).inline} ref={containerRef} style={style} className={className}>
      <StyledDidAddress {...rest} component={component} inline compact={compact} ref={ref} />
    </Root>
  );
}

const Root = styled.div`
  display: block;
  overflow: hidden;
  ${({ inline }: any) =>
    inline &&
    `
    display: inline-block;
    width: 100%;
  `}
`;

const StyledDidAddress = styled(DidAddress)`
  && {
    max-width: none;
  }
  .did-address__text {
    /* 禁止文本 Ellipsis/截断, 以便测量真实的宽度 */
    white-space: nowrap;
    overflow: visible;
    text-overflow: unset;
  }
`;
