import type { LiteralUnion } from 'type-fest';
import { styled } from '@arcblock/ux/lib/Theme';
import Box, { BoxProps } from '@mui/material/Box';

export type CardProps = {
  children?: any;
} & BoxProps;

// 两种布局: 上下, 左右 (适用于移动端)
export type ResponsiveProps = CardProps & {
  layout?: LiteralUnion<'tb' | 'lr', string>;
};

export default function Card({ children = null, ...rest }: CardProps): JSX.Element {
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

// ResponsiveCard, 支持两种布局: 上下, 左右 (适用于移动端)
export function ResponsiveCard({ children = null, layout = 'tb', ...rest }: ResponsiveProps): JSX.Element | null {
  if (!children) {
    return null;
  }

  const [child1, child2, ...extras] = children;
  return (
    <ResponsiveCardRoot layout={layout} {...rest}>
      <div>{child1}</div>
      <div>{child2}</div>
      {extras}
    </ResponsiveCardRoot>
  );
}

const ResponsiveCardRoot = styled(Card)<{ layout?: string }>`
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
