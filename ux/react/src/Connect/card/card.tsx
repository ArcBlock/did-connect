// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'styl... Remove this comment to see the full error message
import styled from 'styled-components';
import Box from '@mui/material/Box';

interface CardProps {
  children: any;
}

/**
 * Card
 */
export default function Card({ children, ...rest }: CardProps) {
  // @ts-expect-error ts-migrate(2365) FIXME: Operator '<' cannot be applied to types 'boolean' ... Remove this comment to see the full error message
  return <Root {...rest}>{children}</Root>;
}

const Root = styled(Box)`
  display: inline-block;
  padding: 16px;
  overflow: hidden;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  background-color: #fff;
  /* safari 圆角问题, https://stackoverflow.com/questions/49066011/overflow-hidden-with-border-radius-not-working-on-safari */
  transform: translateZ(0);
`;

interface ResponsiveCardProps {
  // 两种布局: 上下, 左右 (适用于移动端)
  layout?: 'tb' | 'lr';
  children?: any;
}

// ResponsiveCard, 支持两种布局: 上下, 左右 (适用于移动端)
export function ResponsiveCard({ children, layout, ...rest }: ResponsiveCardProps) {
  if (!children) {
    return null;
  }
  const [child1, child2, ...extras] = children;
  return (
    // @ts-expect-error ts-migrate(2749) FIXME: 'ResponsiveCardRoot' refers to a value, but is bei... Remove this comment to see the full error message
    <ResponsiveCardRoot layout={layout} {...rest}>
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'div'.
      <div>{child1}</div>
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'div'.
      <div>{child2}</div>
      {extras}
    </ResponsiveCardRoot>
  );
}

ResponsiveCard.defaultProps = {
  layout: 'tb',
  children: null,
};

const ResponsiveCardRoot = styled(Card)`
  display: flex;
  flex-direction: ${(props: any) => (props.layout === 'tb' ? 'column' : 'row')};
  justify-content: space-between;
  > div {
    flex: 0 0 auto;
    ${(props: any) => (props.layout === 'lr' ? 'align-self: center;' : '')}
  }

  /* web wallet provider 内容可能比较长, 窄屏下需要支持 shrink, 并且与右边的 icon 保持间距 */
  ${({ layout }: any) =>
    layout !== 'tb' &&
    `
      > div:first-child {
        flex-shrink: 1;
        min-width: 80px;
        margin-right: 8px;
      }
    `}
`;
