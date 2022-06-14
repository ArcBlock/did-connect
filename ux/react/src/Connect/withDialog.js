import { forwardRef } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/styles';
import Slide from '@mui/material/Slide';
import useBrowser from '@arcblock/react-hooks/lib/useBrowser';

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// TODO: close dialog (close button) 时最好能调用 useToken#cancel
export default function withDialog(Component) {
  function WithDialogComponent({ popup, open, dialogStyle, responsive, hideCloseButton, ...rest }) {
    const browser = useBrowser();
    const theme = useTheme();
    // 屏宽小于 sm 且在 mobile 设备中全屏显示 dialog (PC 端屏宽小于 sm 的情况正常弹窗, 不全屏显示)
    const isFullScreen = useMediaQuery(theme.breakpoints.down('md')) && browser.mobile.any;

    if (!popup && !responsive) {
      return <Component {...rest} />;
    }

    // replace deprecated disableBackdropClick/disableEscapeKeyDown with handleOnClose
    // eslint-disable-next-line no-unused-vars
    const handleOnClose = (e, reason) => {};

    // 兼容 did-react 版本中存在的 onClose prop
    const handleClose = () => {
      if (rest.onClose) {
        rest.onClose();
      }
    };

    // 兼容 did-react 版本中存在的 responsive prop, responsive=true 则让 dialog 始终保持 open 状态, 否则遵循外部传入的 open prop
    const isOpen = responsive ? true : open;

    return (
      <Dialog
        open={isOpen}
        fullScreen={isFullScreen}
        maxWidth="lg"
        onClose={handleOnClose}
        // mobile 弹出面板相关
        {...(isFullScreen && {
          TransitionComponent: Transition,
          PaperProps: { style: { background: 'transparent' } },
          style: { paddingTop: 44 },
        })}
      >
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
          }}
        >
          {!hideCloseButton && <CloseButton onClick={handleClose}>&times;</CloseButton>}
          <Component {...rest} />
        </DialogContent>
      </Dialog>
    );
  }

  WithDialogComponent.propTypes = {
    // deprecated: responsive 目的是兼容旧版本 (did-react), responsive=true 等价于 popup=true 和 open=true, 后续建议直接使用 popup 和 open
    // - 旧版本中 responsive=true 的思路是: 将 Auth 在 Dialog 中显示, 并且显示/隐藏完全由外部控制, 显示则渲染 Auth+Dialog 到 DOM 中, 隐藏则在 DOM 中清除 Auth+Dialog
    // - 新版本 (did-connect) 中 popup+open 的思路是: 导出 withDialog(Auth), 让 Auth 具有在弹出窗中显示的能力, 但是否在 Dialog 中显示取决于 popup prop 是否为 true,
    //   如果为 popup 为 true, 可以直接将 Auth 渲染到 DOM 中 (不需要外部控制), 外部通过传入 open state & onClose 来控制 Auth 的显示/隐藏 (或者说启用/关闭)
    responsive: PropTypes.bool,
    // 是否弹出显示, true 表示在 Dialog 中渲染, 并可以通过 open/onClose 控制 dialog 的显示/隐藏, false 表示直接渲染原内容
    popup: PropTypes.bool,
    open: PropTypes.bool,
    dialogStyle: PropTypes.object,
    hideCloseButton: PropTypes.bool,
  };

  WithDialogComponent.defaultProps = {
    responsive: false,
    popup: false,
    open: false,
    dialogStyle: {},
    hideCloseButton: false,
  };

  return WithDialogComponent;
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
