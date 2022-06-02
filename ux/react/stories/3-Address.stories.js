/* eslint-disable no-script-url */
/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';

import { storiesOf } from '@storybook/react';

import styled from 'styled-components';
import Box from '@mui/material/Box';
import LinkIcon from '@mui/icons-material/Link';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/styles';
import DidAddress from '../src/Address';
import Avatar from '../src/Avatar';

storiesOf('DID-Connect/Address', module)
  .addParameters({
    readme: {
      sidebar: '<!-- PROPS -->',
    },
  })
  .add('with different sizes', () => (
    <ResizableContainer>
      <DidAddress size={12}>z1SBWdzYCEEY6WrvEPJv2umgpkkrvgdtBry (size=12)</DidAddress>
      <DidAddress size={14}>z1dxqSfESZN7TygQAgSKeUDQG9tp6ThNLg2 (size=14)</DidAddress>
      <DidAddress size={16}>z1SBWdzYCEEY6WrvEPJv2umgpkkrvgdtBry (size=16)</DidAddress>
      <DidAddress size={16}>z1dxqSfESZN7TygQAgSKeUDQG9tp6ThNLg2 (size=16)</DidAddress>
      <DidAddress size={20}>zysiVRb5pSUPGcitPepiz4Pm5SpQ2EtgejMV (size=20)</DidAddress>
      <DidAddress size={32}>
        <a href="/">zysiVRb5pSUPGcitPepiz4Pm5SpQ2EtgejMV (size=32)</a>
      </DidAddress>
    </ResizableContainer>
  ))
  .add('disable copyable', () => (
    <ResizableContainer>
      <DidAddress copyable={false}>zysiVRb5pSUPGcitPepiz4Pm5SpQ2EtgejMV</DidAddress>
    </ResizableContainer>
  ))
  .add('compact mode', () => {
    const theme = useTheme();
    const matches = useMediaQuery(theme.breakpoints.up('sm'));

    return (
      <ResizableContainer>
        <Box p={1}>
          <h5 style={{ margin: '8px 0' }}>default (startChars=6, endChars=6)</h5>
          <DidAddress compact>zysiVRb5pSUPGcitPepiz4Pm5SpQ2EtgejMV</DidAddress>
        </Box>

        <Box p={1}>
          <h5 style={{ margin: '8px 0' }}>startChars=8, endChars=8)</h5>
          <DidAddress startChars={8} endChars={8} compact>
            zysiVRb5pSUPGcitPepiz4Pm5SpQ2EtgejMV
          </DidAddress>
        </Box>

        <Box p={1}>
          <h5 style={{ margin: '8px 0' }}>with nested children</h5>
          <DidAddress compact>
            <a onClick={() => {}}>
              <Box>
                <span>zysiVRb5pSUPGcitPepiz4Pm5SpQ2EtgejMV</span>
              </Box>
            </a>
          </DidAddress>
        </Box>

        <Box p={1}>
          <h5 style={{ margin: '8px 0' }}>responsive</h5>
          <DidAddress compact={!matches}>zysiVRb5pSUPGcitPepiz4Pm5SpQ2EtgejMV</DidAddress>
        </Box>
      </ResizableContainer>
    );
  })
  .add('with inherit size', () => (
    <ResizableContainer>
      <Box fontSize={20}>
        <DidAddress>zysiVRb5pSUPGcitPepiz4Pm5SpQ2EtgejMV</DidAddress>
      </Box>
      <Box fontSize={32}>
        <DidAddress>zysiVRb5pSUPGcitPepiz4Pm5SpQ2EtgejMV</DidAddress>
      </Box>
    </ResizableContainer>
  ))
  .add('responsive font size', () => (
    <ResizableContainer>
      <Box fontSize={{ xs: 12, sm: 16 }}>
        <DidAddress>zysiVRb5pSUPGcitPepiz4Pm5SpQ2EtgejMV</DidAddress>
      </Box>
    </ResizableContainer>
  ))
  .add('inline element | block element', () => (
    <ResizableContainer>
      <DidAddress inline style={{ background: '#eee' }}>
        zysiVRb5pSUPGcitPepiz4Pm5SpQ2EtgejMV
      </DidAddress>
      <DidAddress inline={false} style={{ background: '#eee' }}>
        zysiVRb5pSUPGcitPepiz4Pm5SpQ2EtgejMV
      </DidAddress>

      {/* 右对齐, 测试因为 copy 前后 icon 宽度不固定导致的抖动问题 - issue #204 */}
      <div style={{ textAlign: 'right' }}>
        <span style={{ marginRight: 16 }}>right-align</span>
        <DidAddress inline size={20}>
          zysiVRb5pSUPGcitPepiz4Pm5SpQ2EtgejMV
        </DidAddress>
      </div>
    </ResizableContainer>
  ))
  .add('dynamic tagname', () => (
    <ResizableContainer>
      <div>
        <span>span tag (default) : </span>
        <DidAddress>zysiVRb5pSUPGcitPepiz4Pm5SpQ2EtgejMV</DidAddress>
      </div>
      <div>
        <span>div tag : </span>
        <DidAddress component="div">zysiVRb5pSUPGcitPepiz4Pm5SpQ2EtgejMV</DidAddress>
      </div>
    </ResizableContainer>
  ))
  .add('non-responsive & compact', () => (
    <ResizableContainer style={{ width: 300 }}>
      <Box p={1}>
        <h5 style={{ margin: '8px 0' }}>responsive=false</h5>
        <DidAddress responsive={false}>zysiVRb5pSUPGcitPepiz4Pm5SpQ2EtgejMV</DidAddress>
      </Box>
      <Box p={1}>
        <h5 style={{ margin: '8px 0' }}>responsive=false & compact</h5>
        <DidAddress responsive={false} compact inline>
          zysiVRb5pSUPGcitPepiz4Pm5SpQ2EtgejMV
        </DidAddress>
      </Box>
    </ResizableContainer>
  ))
  .add('copy text & i18n', () => (
    <ResizableContainer>
      <Box p={1}>
        <h5>locale=en (default)</h5>
        <DidAddress>zysiVRb5pSUPGcitPepiz4Pm5SpQ2EtgejMV</DidAddress>
      </Box>
      <Box p={1}>
        <h5>locale=zh</h5>
        <DidAddress locale="zh">zysiVRb5pSUPGcitPepiz4Pm5SpQ2EtgejMV</DidAddress>
      </Box>
    </ResizableContainer>
  ))
  .add('prepend & append', () => (
    <ResizableContainer>
      <div>
        <DidAddress
          size={12}
          prepend={
            <Box component="span" mr={0.5} bgcolor="#000">
              [prepend]
            </Box>
          }
          append={
            <Box component="span" ml={0.5} bgcolor="#000">
              [append]
            </Box>
          }>
          z1SBWdzYCEEY6WrvEPJv2umgpkkrvgdtBry
        </DidAddress>
      </div>

      <div>
        <DidAddress
          size={12}
          prepend={
            <Avatar
              did="z1SBWdzYCEEY6WrvEPJv2umgpkkrvgdtBry"
              size={20}
              style={{ marginRight: 8 }}
            />
          }
          append={
            <Box component="a" href="javascript:void(0)" display="flex" alignItems="center" ml={1}>
              <LinkIcon />
            </Box>
          }>
          z1SBWdzYCEEY6WrvEPJv2umgpkkrvgdtBry
        </DidAddress>
      </div>
    </ResizableContainer>
  ));

const ResizableContainer = styled.div`
  width: 600px;
  max-width: 100%;
  padding: 16px;
  border: 1px solid #ddd;
  overflow: auto;
  background: #fff;
  resize: both;

  > * + * {
    margin-top: 16px;
  }
`;
