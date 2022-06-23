import { useRef, useLayoutEffect } from 'react';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module '@arc... Remove this comment to see the full error message
import { update } from '@arcblock/did-motif';

type OwnProps = {
  did: string;
  size?: number;
  animation?: boolean;
  responsive?: boolean;
  shape?: number;
};

// @ts-expect-error ts-migrate(2565) FIXME: Property 'defaultProps' is used before being assig... Remove this comment to see the full error message
type Props = OwnProps & typeof DIDMotif.defaultProps;

// @ts-expect-error ts-migrate(2700) FIXME: Rest types may only be created from object types.
function DIDMotif({ did, size, animation, shape, responsive, ...rest }: Props) {
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

DIDMotif.defaultProps = {
  size: 200,
  animation: false,
  responsive: false,
  shape: null,
};

export default DIDMotif;
