// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'styl... Remove this comment to see the full error message
import styled from 'styled-components';
import Refresh from '@mui/icons-material/Refresh';

interface RefreshOverlayProps {
  onRefresh(...args: unknown[]): unknown;
}

// 需要父元素设置 relative position
export default function RefreshOverlay({ onRefresh, ...rest }: RefreshOverlayProps) {
  const handleOnRefresh = (e: any) => {
    e.stopPropagation();
    onRefresh();
  };

  return (
    <Root {...rest} onClick={handleOnRefresh}>
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'span'.
      <span>
        // @ts-expect-error ts-migrate(2749) FIXME: 'Refresh' refers to a value, but is being used as ... Remove this
        comment to see the full error message
        <Refresh />
      </span>
    </Root>
  );
}

const Root = styled.div`
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
