/* eslint-disable @typescript-eslint/no-use-before-define */
import { styled } from '@arcblock/ux/lib/Theme';
import Refresh from '@mui/icons-material/Refresh';

interface RefreshOverlayProps {
  onRefresh(...args: any[]): any;
}

// 需要父元素设置 relative position
export default function RefreshOverlay({ onRefresh, ...rest }: RefreshOverlayProps) {
  const handleOnRefresh = (e: any) => {
    e.stopPropagation();
    onRefresh();
  };

  return (
    <Root {...rest} onClick={handleOnRefresh}>
      <span>
        <Refresh />
      </span>
    </Root>
  );
}

const Root = styled('div')`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.1);
  cursor: pointer;

  > span {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: 48px;
    height: 48px;
    border-radius: 100%;
    color: #fff;
    background-color: #4598fa;
  }
  .MuiSvgIcon-root {
    font-size: 28px;
  }
`;
