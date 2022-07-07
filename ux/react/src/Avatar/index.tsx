/* eslint-disable react/no-unstable-nested-components */
import { useState, useMemo } from 'react';
import styled from 'styled-components';
import { ErrorBoundary } from 'react-error-boundary';
import Img from '@arcblock/ux/lib/Img';
import { mergeProps } from '@arcblock/ux/lib/Util';
import { makeStyles } from '@mui/styles';
import { Shape } from '@arcblock/did-motif';
import Box from '@mui/material/Box';

import DIDMotif from './did-motif';
import blockies from './etherscan-blockies';
import { TAvatarShape, TAvatarVariant } from '../types';

const useStyles = makeStyles(() => ({
  img: {
    '&.avatar-img--default': {},
    '&.avatar-img--rounded': {
      borderRadius: '4px',
      overflow: 'hidden',
    },
    '&.avatar-img--circle': {
      borderRadius: '100%',
      overflow: 'hidden',
    },
  },
}));

// 参考: asset-chain @arcblock/did
const isEthereumDid = (did: any) => {
  const address = did.replace('did:abt:', '');
  // check if it has the basic requirements of an address
  if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
    return false;
  }
  return true;
};

const defaultProps = {
  did: '',
  src: '',
  size: 36,
  variant: 'default',
  animation: false,
  shape: '',
};

type AvatarProps = {
  did?: string;
  src?: string;
  size?: number;
  variant?: TAvatarVariant;
  animation?: boolean;
  shape?: TAvatarShape;
} & typeof defaultProps;

// 参考: https://github.com/blocklet/block-explorer/issues/478#issuecomment-1038954976
function Avatar(props: AvatarProps): JSX.Element {
  const classes = useStyles();
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
      <Img
        width={size}
        src={src}
        alt={did}
        onError={() => setImgError(true)}
        {...rest}
        className={`${classes.img} avatar-img--${variant} ${rest.className}`}
      />
    );
  }
  if (blockyIcon) {
    return (
      <BlockyIconContainer $size={size} {...rest}>
        <Img className={`${classes.img} avatar-img--${variant}`} width={size} src={blockyIcon} alt={did} />
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

Avatar.defaultProps = defaultProps;

const BlockyIconContainer = styled.div`
  width: ${(props: any) => props.$size / 0.7}px;
  height: ${(props: any) => props.$size}px;
  padding: 2px 0;
  overflow: hidden;
  border-radius: ${(props: any) => Math.min(10, Math.floor(0.1 * props.$size + 2))}px;
  text-align: center;
  background: #ddd;
`;

export default function AvatarWithErrorBoundary(props: AvatarProps): JSX.Element {
  const classes = useStyles();
  const size = props.size || 36;
  return (
    <ErrorBoundary
      fallbackRender={() => (
        <Box
          width={size}
          height={size}
          bgcolor="grey.300"
          className={`${classes.img} avatar-img--${props.variant || 'default'}`}
        />
      )}>
      <Avatar {...props} />
    </ErrorBoundary>
  );
}

AvatarWithErrorBoundary.defaultProps = defaultProps;
