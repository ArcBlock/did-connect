/* eslint-disable @typescript-eslint/no-use-before-define */
import { useRef } from 'react';
import styled from 'styled-components';
import Box from '@mui/material/Box';
import translations from '../assets/locale';

type OwnProps = {
  locale?: 'en' | 'zh';
};

type Props = OwnProps & typeof GetWallet.defaultProps;

/**
 * GetWallet
 */
export default function GetWallet({ locale, ...rest }: Props) {
  const linkRef = useRef();

  return (
    // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
    <Root {...rest} onClick={() => linkRef.current.click()}>
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

GetWallet.defaultProps = {
  locale: 'en',
};

const Root = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;
