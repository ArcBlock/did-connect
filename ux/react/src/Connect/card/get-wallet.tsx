import { useRef } from 'react';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'styl... Remove this comment to see the full error message
import styled from 'styled-components';
import Box from '@mui/material/Box';
import translations from '../assets/locale';

type OwnProps = {
  locale?: 'en' | 'zh';
};

// @ts-expect-error ts-migrate(2565) FIXME: Property 'defaultProps' is used before being assig... Remove this comment to see the full error message
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
        // @ts-expect-error ts-migrate(2322) FIXME: Type 'MutableRefObject<undefined>' is not assignab... Remove this comment to see the full error message
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
