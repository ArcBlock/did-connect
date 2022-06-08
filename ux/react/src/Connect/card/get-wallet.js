import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Box from '@mui/material/Box';
import translations from '../assets/locale';

/**
 * GetWallet
 */
export default function GetWallet({ locale, ...rest }) {
  const linkRef = React.useRef();

  return (
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
        rel="noreferrer"
      >
        link
      </a>
    </Root>
  );
}

GetWallet.propTypes = {
  locale: PropTypes.oneOf(['en', 'zh']),
};

GetWallet.defaultProps = {
  locale: 'en',
};

const Root = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;
