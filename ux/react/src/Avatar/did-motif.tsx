import { useRef, useLayoutEffect } from 'react';
import { update } from '@arcblock/did-motif';

import { TAvatarShape } from '../types';

type Props = {
  did: string;
  size?: number;
  animation?: boolean;
  responsive?: boolean;
  shape?: TAvatarShape;
  style?: React.CSSProperties;
};

export default function DIDMotif({
  did,
  size = 200,
  animation = false,
  responsive = false,
  shape = '',
  ...rest
}: Props): JSX.Element {
  const svgRef = useRef(null);

  useLayoutEffect(() => {
    update(svgRef.current, did, { size, animation, shape });
  }, [did, size, shape]); // eslint-disable-line

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
