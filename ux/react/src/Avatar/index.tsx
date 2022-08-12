/* eslint-disable react/require-default-props */
/* eslint-disable react/no-unused-prop-types */
import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { styled } from '@arcblock/ux/lib/Theme';
import { ErrorBoundary } from 'react-error-boundary';
import Img from '@arcblock/ux/lib/Img';
import { mergeProps } from '@arcblock/ux/lib/Util';
import { Shape } from '@arcblock/did-motif';
import Box from '@mui/material/Box';

import DIDMotif from './did-motif';
import blockies from './etherscan-blockies';

// 参考: asset-chain @arcblock/did
const isEthereumDid = (did: string): boolean => {
  const address = did.replace('did:abt:', '');
  // check if it has the basic requirements of an address
  if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
    return false;
  }
  return true;
};

// 参考: https://github.com/blocklet/block-explorer/issues/478#issuecomment-1038954976
function Avatar(props: any) {
  const [imgError, setImgError] = useState(false);
  const newProps = mergeProps(props, Avatar, []);
  const { did = '', size, src, variant, animation, shape, ...rest } = newProps;

  // ethereum blockies
  const blockyIcon = useMemo(() => {
    if (isEthereumDid(did)) {
      return blockies
        .createIcon({
          seed: did.replace('did:abt:', '').toLowerCase(),
          size: 8,
          scale: 16,
        })
        .toDataURL();
    }
    return null;
  }, [did]);

  // 如果显式传入 src 则直接使用 src
  if (src && !imgError) {
    return (
      <StyledImg
        width={size}
        src={src}
        alt={did}
        onError={() => setImgError(true)}
        {...rest}
        className={`avatar-img--${variant} ${rest.className}`}
      />
    );
  }
  // 对于 eth address, 渲染成 blocky icon, 形状与 account role type 的 did motif 相似都为矩形, 高宽比为 0.7
  if (blockyIcon) {
    // blocky icon 要与灰色卡片矩形留有空间
    const padding = size > 24 ? 4 : 2;
    return (
      <BlockyIconContainer $size={size} {...rest}>
        <div className="blocky-icon-inner">
          <Img width={size * 0.7 - padding * 2} src={blockyIcon} alt={did} />
        </div>
      </BlockyIconContainer>
    );
  }
  if (did) {
    // 渲染 did motif
    return (
      <DIDMotif
        did={did.replace('did:abt:', '')}
        size={size}
        animation={animation}
        shape={Shape[(shape || '').toUpperCase()]}
        responsive={newProps.responsive}
        {...rest}
      />
    );
  }
  throw new Error(`Invalid DID: ${did}`);
}

Avatar.propTypes = {
  did: PropTypes.string.isRequired,
  size: PropTypes.number,
  variant: PropTypes.oneOf(['circle', 'rounded', 'default']),
  // animation 仅对 did motif 有效
  animation: PropTypes.bool,
  // shape 仅对 did motif 有效, 明确指定 motif shape, 而非由 did role type 自动推断 shape
  shape: PropTypes.oneOf(['', 'rectangle', 'square', 'hexagon', 'circle']),
  src: PropTypes.string,
};

Avatar.defaultProps = {
  size: 36,
  variant: 'default',
  animation: false,
  shape: '',
  src: '',
};

const BlockyIconContainer = styled('div')`
  display: flex;
  align-items: center;
  width: ${(props: any) => props.$size}px;
  height: ${(props: any) => props.$size}px;
  .blocky-icon-inner {
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    align-items: center;
    width: ${(props: any) => props.$size}px;
    height: ${(props: any) => props.$size * 0.7}px;
    border-radius: ${(props: any) => Math.min(10, Math.floor(0.1 * props.$size + 2))}px;
    background: #ddd;
  }
`;

const StyledImg = styled(Img)`
  &.avatar-img--rounded {
    border-radius: 4px;
    overflow: hidden;
  }
  &.avatar-img--circle {
    border-radius: 100%;
    overflow: hidden;
  }
`;

export default function AvatarWithErrorBoundary(props: any) {
  const size = props.size || 36;
  // @ts-ignore
  const borderRadius: any = { rounded: '4px', circle: '100%' }[props.variant] || 0;
  return (
    <ErrorBoundary
      // eslint-disable-next-line react/no-unstable-nested-components
      fallbackRender={() => <Box width={size} height={size} bgcolor="grey.300" borderRadius={borderRadius} />}>
      <Avatar {...props} />
    </ErrorBoundary>
  );
}

AvatarWithErrorBoundary.propTypes = Avatar.propTypes;
