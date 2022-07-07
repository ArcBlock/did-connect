import { forwardRef } from 'react';
import styled from 'styled-components';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/styles';
import Slide from '@mui/material/Slide';
import useBrowser from '@arcblock/react-hooks/lib/useBrowser';

import { TDialogProps } from '../types';

const Transition = forwardRef(function Transition(props, ref) {
  // @ts-ignore
  return <Slide direction="up" ref={ref} {...props} />;
});

// TODO: close dialog (close button) 时最好能调用 useToken#cancel
export default function withDialog(Component: any) {
  function WrappedComponent({
    popup = false,
    open = false,
    dialogStyle = {},
    disableClose = false,
    onClose,
    ...rest
  }: TDialogProps): JSX.Element {
    const browser = useBrowser();
    const theme = useTheme();
    // 屏宽小于 sm 且在 mobile 设备中全屏显示 dialog (PC 端屏宽小于 sm 的情况正常弹窗, 不全屏显示)
    const isFullScreen = useMediaQuery((theme as any).breakpoints.down('md')) && browser.mobile.any;

    if (!popup) {
      return <Component {...rest} />;
    }

    // replace deprecated disableBackdropClick/disableEscapeKeyDown with handleOnClose
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleOnClose = (e: any, reason: any) => {};

    // 兼容 did-react 版本中存在的 onClose prop
    const handleClose = () => {
      if (onClose) {
        onClose();
      }
    };

    return (
      <Dialog
        open={open}
        fullScreen={isFullScreen}
        maxWidth="lg"
        onClose={handleOnClose}
        // mobile 弹出面板相关
        {...(isFullScreen && {
          TransitionComponent: Transition,
          PaperProps: { style: { background: 'transparent' } },
          style: { paddingTop: 44 },
        })}>
        <DialogContent
          style={{
            width: isFullScreen ? '100%' : 720,
            height: isFullScreen ? '100%' : 780,
            maxWidth: '100%',
            maxHeight: '100%',
            padding: 0,
            ...dialogStyle,
            // mobile 弹出面板相关
            ...(isFullScreen && {
              position: 'relative', // !修复 iOS safari 圆角问题
              borderRadius: '16px 16px 0 0',
              background: '#fff',
            }),
          }}>
          {!disableClose && <CloseButton onClick={handleClose}>&times;</CloseButton>}
          <Component {...rest} />
        </DialogContent>
      </Dialog>
    );
  }

  return WrappedComponent;
}

const CloseButton = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 999;
  color: #222222;
  font-size: 2rem;
  line-height: 1rem;
  cursor: pointer;
  user-select: none;
`;
