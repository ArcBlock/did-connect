/* eslint-disable react/no-unused-prop-types */
import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Img from '@arcblock/ux/lib/Img';
import { mergeProps } from '@arcblock/ux/lib/Util';
import { makeStyles } from '@material-ui/core';
import { Shape } from '@arcblock/did-motif';
import DIDMotif from './did-motif';
import blockies from './etherscan-blockies';

const useStyles = makeStyles(() => ({
  img: {
    '&.avatar-img--default': {},
    '&.avatar-img--rounded': {
      borderRadius: '100vw',
      overflow: 'hidden',
    },
    '&.avatar-img--circle': {
      borderRadius: '100%',
      overflow: 'hidden',
    },
  },
}));

// 参考: asset-chain @arcblock/did
const isEthereumDid = did => {
  const address = did.replace('did:abt:', '');
  // check if it has the basic requirements of an address
  if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
    return false;
  }
  return true;
};

// 参考: https://github.com/blocklet/block-explorer/issues/478#issuecomment-1038954976
export default function Avatar(props) {
  const classes = useStyles();
  const [imgError, setImgError] = useState(false);
  const newProps = mergeProps(props, Avatar, []);
  const { did, size, src, variant, animation, shape, ...rest } = newProps;

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
        <Img
          className={`${classes.img} avatar-img--${variant}`}
          width={size}
          src={blockyIcon}
          alt={did}
        />
      </BlockyIconContainer>
    );
  }
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

Avatar.propTypes = {
  did: PropTypes.string.isRequired,
  size: PropTypes.number,
  variant: PropTypes.oneOf(['circle', 'rounded', 'default']),
  // animation 仅对 did motif 有效
  animation: PropTypes.bool,
  // shape 仅对 did motif 有效, 明确指定 motif shape, 而非由 did role type 自动推断 shape
  shape: PropTypes.oneOf(['', 'rectangle', 'square', 'hexagon', 'circle']),
};

Avatar.defaultProps = {
  size: 36,
  variant: 'default',
  animation: false,
  shape: '',
};

const BlockyIconContainer = styled.div`
  width: ${props => props.$size / 0.7}px;
  height: ${props => props.$size}px;
  padding: 2px 0;
  overflow: hidden;
  border-radius: ${props => Math.min(10, Math.floor(0.1 * props.$size + 2))}px;
  text-align: center;
  background: #ddd;
`;
