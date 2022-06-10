import React from 'react';

import { storiesOf } from '@storybook/react';

import Box from '@mui/material/Box';

import Avatar from '../src/Avatar';

storiesOf('DID-Connect/Avatar', module)
  .addParameters({
    readme: {
      sidebar: '<!-- PROPS -->',
    },
  })
  .add('with different sizes', () => (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-around' }}>
        <Avatar did="zysiVRb5pSUPGcitPepiz4Pm5SpQ2EtgejMV" size={36} style={{ marginLeft: 20 }} />
        <Avatar did="zysiVRb5pSUPGcitPepiz4Pm5SpQ2EtgejMV" size={72} />
        <Avatar did="zysiVRb5pSUPGcitPepiz4Pm5SpQ2EtgejMV" size={144} />
        <Avatar did="zysiVRb5pSUPGcitPepiz4Pm5SpQ2EtgejMV" src="https://picsum.photos/200/100" size={144} />
        <Avatar
          did="zysiVRb5pSUPGcitPepiz4Pm5SpQ2EtgejMV"
          src="https://picsum.photos/200/100"
          size={52}
          variant="rounded"
        />
        <Avatar
          did="zysiVRb5pSUPGcitPepiz4Pm5SpQ2EtgejMV"
          src="https://picsum.photos/200/100"
          size={52}
          variant="circle"
        />
      </div>
      <h4>Error image avatar should fallback did avatar</h4>
      <Avatar
        did="zysiVRb5pSUPGcitPepiz4Pm5SpQ2EtgejMV"
        src="/.blocklet/proxy/static/images/public_default_avatar.png"
        size={52}
        variant="circle"
      />
    </>
  ))
  .add('with different did', () => (
    <div style={{ display: 'flex', justifyContent: 'space-around' }}>
      <Avatar did="z1YXMb8Souf2u8zVwWzexSNiD5Te7XGS313" size={44} />
      <Avatar did="zNKeLKixvCM32TkVM1zmRDdAU3bvm3dTtAcM" size={44} />
      <Avatar did="zjdj2tvjvLVF9S3eFaaX5xEEDuwLu6qdQk2t" size={44} />
      <Avatar did="z35n6X6rDp8rWWCGSiXZgvd42bixdLULmX8oX" size={44} />
    </div>
  ))
  .add('with specified motif shape', () => (
    <div>
      <Box p={2} m={1}>
        <h4>role type: account &amp; shape: circle</h4>
        <Avatar did="z1YXMb8Souf2u8zVwWzexSNiD5Te7XGS313" size={44} shape="circle" />
      </Box>
      <Box p={2} m={1}>
        <h4>role type: application &amp; shape: hexagon</h4>
        <Avatar did="zNKeLKixvCM32TkVM1zmRDdAU3bvm3dTtAcM" size={44} shape="hexagon" />
      </Box>
      <Box p={2} m={1}>
        <h4>role type: asset &amp; shape: square</h4>
        <Avatar did="zjdj2tvjvLVF9S3eFaaX5xEEDuwLu6qdQk2t" size={44} shape="square" />
      </Box>
      <Box p={2} m={1}>
        <h4>role type: token &amp; shape: rectangle</h4>
        <Avatar did="z35n6X6rDp8rWWCGSiXZgvd42bixdLULmX8oX" size={44} shape="rectangle" />
      </Box>
    </div>
  ))
  .add('responsive did motif', () => (
    <div
      style={{
        width: 200,
        height: 200,
        padding: 4,
        border: '1px solid #eee',
        overflow: 'hidden',
        resize: 'both',
      }}
    >
      <Avatar did="z1YXMb8Souf2u8zVwWzexSNiD5Te7XGS313" responsive />
    </div>
  ))
  .add('eth addresses', () => (
    <div style={{ display: 'flex', justifyContent: 'space-around' }}>
      <Avatar did="0x8d75FD337071AdcC22B9c7D7C0ccff2e5aaCB112" size={24} />
      <Avatar did="0x1928fe1bba8adef1cf89946985d711a01dfcf27e" size={36} />
      <Avatar did="0x8d75FD337071AdcC22B9c7D7C0ccff2e5aaCB112" size={64} />
    </div>
  ))
  .add('with animation', () => (
    <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-around' }}>
      <Avatar did="zysiVRb5pSUPGcitPepiz4Pm5SpQ2EtgejMV" size={24} animation />
      <Avatar did="zysjNQUF3VkM1yBXZDtpudxWn1EAPfY3ZSUV" size={36} animation />
      <Avatar did="zysoSNiK1ySLYT1BPvAQvLU2yWgLyx8xVChE" size={88} animation />
    </div>
  ))
  .add('with empty did (error fallback)', () => (
    <Box display="flex" gap={2} p={2}>
      <Avatar size={24} />
      <Avatar size={24} variant="rounded" />
      <Avatar size={24} variant="circle" />
      <Avatar did={null} size={32} />
      <Avatar size={32} src="https://picsum.photos/200/100" />
    </Box>
  ));
