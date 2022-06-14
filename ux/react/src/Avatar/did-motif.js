import { useRef, useLayoutEffect } from 'react';
import PropTypes from 'prop-types';
import { update } from '@arcblock/did-motif';

function DIDMotif({ did, size, animation, shape, responsive, ...rest }) {
  const svgRef = useRef(null);

  useLayoutEffect(() => {
    update(svgRef.current, did, { size, animation, shape });
  }, [did, size, shape]);
  if (responsive) {
    // fix avatar 显示问题 (safari 下父容器为 flex 时 inline svg 显示不出来, 需要明确指定 width)
    const styles = { ...rest.style, width: '100%' };
    return <svg ref={svgRef} {...rest} style={styles} />;
  }
  return (
    <span {...rest} style={{ display: 'inline-block', width: size, height: size, ...rest.style }}>
      <svg ref={svgRef} />
    </span>
  );
}

DIDMotif.propTypes = {
  did: PropTypes.string.isRequired,
  size: PropTypes.number,
  animation: PropTypes.bool,
  // 直接返回 svg 元素, svg 尺寸由父窗口决定 (撑满父窗口)
  responsive: PropTypes.bool,
  shape: PropTypes.number,
};

DIDMotif.defaultProps = {
  size: 200,
  animation: false,
  responsive: false,
  shape: null,
};

export default DIDMotif;
