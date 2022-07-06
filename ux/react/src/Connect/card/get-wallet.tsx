import { useRef } from 'react';
import styled from 'styled-components';
import Box from '@mui/material/Box';
import { TLocaleCode } from '@did-connect/types';

import translations from '../assets/locale';

export default function GetWallet({ locale = 'en', ...rest }: { locale: TLocaleCode }): JSX.Element {
  const linkRef = useRef<HTMLAnchorElement>(null);

  return (
    <Root {...rest} onClick={() => linkRef.current?.click()}>
      <Box
        component="span"
        ml={1}
        fontWeight={700}
        fontSize={14}
        color="#9397A1"
        dangerouslySetInnerHTML={{ __html: translations[locale].getWallet }}
      />
      <a
        href={`https://www.didwallet.io/${locale === 'zh' ? 'zh' : 'en'}`}
        target="_blank"
        ref={linkRef}
        style={{ display: 'none' }}
        rel="noreferrer">
        link
      </a>
    </Root>
  );
}

const Root = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;
