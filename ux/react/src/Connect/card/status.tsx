/* eslint-disable react/require-default-props */
/* eslint-disable @typescript-eslint/no-use-before-define */
import { styled } from '@arcblock/ux/lib/Theme';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Check from '@mui/icons-material/Check';
import Clear from '@mui/icons-material/Clear';
import ConnectIcon from '@arcblock/icons/lib/Connect';
import DidWalletLogo from '@arcblock/icons/lib/DidWalletLogo';
import { TSessionStatus, TLocaleCode } from '@did-connect/types';

import translations from '../assets/locale';
import Card from './card';
import { isSessionActive, noop } from '../../utils';
import { TConnectMessage } from '../../types';

const StyledButton = styled(Button)`
  && {
    padding: 4px 16px;
    color: #4598fa;
    background-color: #eaf4ff;

    &:hover {
      color: #fff;
      background-color: #4598fa;
    }
  }
`;

export type StatusProps = {
  status: TSessionStatus;
  locale: TLocaleCode;
  messages: TConnectMessage;
  onCancel: (...args: any[]) => any;
  onRetry: (...args: any[]) => any;
} & React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;

/**
 * Status (scanned/succeed/error)
 */
export default function Status({
  status,
  onCancel = noop,
  onRetry = noop,
  messages,
  locale = 'en',
  ...rest
}: StatusProps): JSX.Element {
  return (
    <Root {...rest}>
      {isSessionActive(status) && (
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
          <Box>
            <ConnectIcon style={{ width: 48, height: 48, fill: '#4598FA' }} />
          </Box>
          <Box mt={2} lineHeight="34px" color="#4598fa" fontSize={24} textAlign="center" fontWeight={400}>
            {translations[locale].scanned}
          </Box>
          <Box mt={1.5} display="flex" alignItems="center">
            <Box color="#a8b4c5" fontSize={16} fontWeight={400}>
              {translations[locale].connected}
            </Box>
            <DidWalletLogo style={{ height: '1em', marginLeft: 8 }} />
          </Box>
          <Box mt={5}>
            <StyledButton onClick={() => onCancel()}>{translations[locale].back}</StyledButton>
          </Box>
        </Box>
      )}
      {status === 'completed' && (
        <Box textAlign="center" className="status--succeed">
          <span className="status_icon">
            <Check />
          </span>
          <Box component="p" className="status_icon-text">
            {translations[locale].success}
          </Box>
          <Box component="p" className="status_desc">
            {messages.success}
          </Box>
        </Box>
      )}
      {['error', 'rejected', 'timeout', 'canceled'].includes(status) && (
        <Box textAlign="center" className="status--error">
          <span className="status_icon">
            <Clear />
          </span>
          <Box component="p" className="status_icon-text">
            {translations[locale].failed}
          </Box>
          <Box component="p" className="status_desc">
            {messages.error || translations[locale].error}
          </Box>
          <Box mt={5}>
            <StyledButton onClick={onRetry}>{translations[locale].retry}</StyledButton>
          </Box>
        </Box>
      )}
    </Root>
  );
}

const Root = styled(Card)<any>`
  display: flex;
  justify-content: center;
  align-items: center;
  color: #a8b4c5;
  border: 0;
  border-radius: 0;
  background-color: transparent;
  .status_icon {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: 48px;
    height: 48px;
    border-radius: 100%;
    color: #fff;
  }
  .status_icon-text {
    margin: 16px 0;
    font-size: 24px;
    font-weight: 400;
  }
  .status_desc {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    font-size: 14px;
  }
  .status--succeed {
    .status_icon {
      background-color: #3ab39d;
    }
    .status_icon-text {
      color: #3ab39d;
    }
  }
  .status--error {
    .status_icon {
      background-color: #f16e6e;
    }
    .status_icon-text {
      color: #f16e6e;
    }
    .status_desc {
      word-break: break-all;
    }
  }
  .text-wallet {
    color: #334660;
    font-size: 14px;
    font-weight: 700;
  }
`;
