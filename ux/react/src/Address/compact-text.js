import { Children } from 'react';
import PropTypes from 'prop-types';

// 递归, 将 text (string) 部分替换为 CompactText (保持元素结构)
// eslint-disable-next-line react/prop-types
function RecursiveWrapper({ children, ...rest }) {
  const wrappedChildren = Children.map(children, (child) => {
    if (typeof child === 'string') {
      return <CompactText {...rest}>{child}</CompactText>;
    }
    if (child.props && child.props.children) {
      return (
        <child.type {...child.props}>
          <RecursiveWrapper>{child.props.children}</RecursiveWrapper>
        </child.type>
      );
    }
    return child;
  });
  return <>{wrappedChildren}</>;
}

/**
 * 紧凑文本组件 (显示首尾, 中间截断显示省略号), 仅考虑等宽字体的情况
 */
export default function CompactText({ startChars, endChars, children }) {
  if (typeof children !== 'string') {
    return (
      <RecursiveWrapper startChars={startChars} endChars={endChars}>
        {children}
      </RecursiveWrapper>
    );
  }

  return (
    <span>
      {children.slice(0, startChars)}...{children.slice(children.length - endChars)}
    </span>
  );
}

CompactText.propTypes = {
  startChars: PropTypes.number,
  endChars: PropTypes.number,
  children: PropTypes.node.isRequired,
};

CompactText.defaultProps = {
  startChars: 6,
  endChars: 6,
};
