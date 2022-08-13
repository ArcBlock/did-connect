import { styled } from '@mui/material/styles';
import CommonFooter from '@xmark/client/src/components/Footer';

function MyFooter({ ...rest }) {
  const Root = styled(CommonFooter)`
    .footer-brand-name,
    .footer-brand-desc {
      display: none;
    }
  `;

  return <Root {...rest} />;
}

export default MyFooter;
