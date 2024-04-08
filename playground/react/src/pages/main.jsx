import PropTypes from 'prop-types';
import { Box, Card, CardContent, Link, Typography } from '@mui/material';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import ConnectButton from '@arcblock/did-connect/lib/Button';
import { useReactive } from 'ahooks';
import Avatar from '@arcblock/ux/lib/Avatar';
import { Icon } from '@iconify/react';
import iconOpenInNewRounded from '@iconify-icons/material-symbols/open-in-new-rounded';

import Layout from '../components/layout';
import getWalletEnImg from '../assets/get_wallet_en.png';
import getWalletZhImg from '../assets/get_wallet_zh.png';
import { useSessionContext } from '../libs/session';

function ConnectItem({ title, description, result, onClick }) {
  return (
    <Box>
      <Typography variant="h6" component="h5" color="textPrimary">
        {title}
      </Typography>
      {description ? (
        <Typography variant="body1" color="text.secondary" gutterBottom>
          {description}
        </Typography>
      ) : null}
      <ConnectButton size="large" onClick={onClick} />
      {result ? (
        <Card sx={{ mt: 2 }} variant="outlined">
          <CardContent>
            <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
              Result
            </Typography>
            {result}
          </CardContent>
        </Card>
      ) : null}
    </Box>
  );
}

ConnectItem.propTypes = {
  title: PropTypes.any.isRequired,
  description: PropTypes.any,
  result: PropTypes.any,
  onClick: PropTypes.func,
};

ConnectItem.defaultProps = {
  description: null,
  result: null,
  onClick: () => {},
};

function InfoRow({ name, value }) {
  return (
    <Typography variant="body1" color="text.primary" gutterBottom>
      {name}:{' '}
      <Typography
        component="span"
        color="text.secondary"
        sx={{
          wordBreak: 'break-word',
        }}>
        {value}
      </Typography>
    </Typography>
  );
}

InfoRow.propTypes = {
  name: PropTypes.any.isRequired,
  value: PropTypes.any.isRequired,
};

function Main() {
  const { locale } = useLocaleContext();
  const { connectApi } = useSessionContext();
  const getWalletImgUrl = locale === 'zh' ? getWalletZhImg : getWalletEnImg;
  const getWalletUrl = `https://www.didwallet.io/${locale === 'zh' ? 'zh' : 'en'}`;
  const getExplorerUrl = (assetDidOrHash, type = 'txs') => {
    return `https://explorer.abtnetwork.io/explorer/${type}/${assetDidOrHash}?host=${window.blocklet.CHAIN_HOST}`;
  };
  const results = useReactive({
    'request-profile': null,
    'request-text-signature': null,
    'request-digest-signature': null,
    'request-transaction-signature': null,
    'multiple-claims': null,
    'multiple-steps': null,
    'request-nft': null,
    'request-payment': null,
  });

  const requestProfile = () => {
    const action = 'request-profile';
    results[action] = null;
    connectApi.open({
      action,
      onSuccess({ result }) {
        results[action] = (
          <>
            <Avatar variant="circle" src={result.avatar} did={result.did} size={60} />
            <InfoRow name="FullName" value={result.fullName} />
            <InfoRow name="Email" value={result.email} />
            <InfoRow name="Phone" value={result.phone} />
          </>
        );
      },
    });
  };

  const requestTextSignature = () => {
    const action = 'request-text-signature';
    results[action] = null;
    connectApi.open({
      action,
      onSuccess({ result }) {
        results[action] = (
          <>
            <InfoRow name="Raw data" value={result.origin} />
            <InfoRow name="Signature" value={result.sig} />
          </>
        );
      },
    });
  };

  const requestDigestSignature = () => {
    const action = 'request-digest-signature';
    results[action] = null;
    connectApi.open({
      action,
      onSuccess({ result }) {
        results[action] = (
          <>
            <InfoRow name="Raw data" value={result.origin} />
            <InfoRow name="Digest data" value={result.digest} />
            <InfoRow name="Signature" value={result.sig} />
          </>
        );
      },
    });
  };
  const requestTransationSignature = () => {
    const action = 'request-transaction-signature';
    results[action] = null;
    connectApi.open({
      action,
      onSuccess({ result }) {
        results[action] = (
          <>
            <InfoRow name="Transation" value={result.transaction} />
            <InfoRow name="Signature" value={result.sig} />
          </>
        );
      },
    });
  };

  const requestNFT = () => {
    const action = 'request-nft';
    results[action] = null;
    connectApi.open({
      action,
      onSuccess({ result }) {
        results[action] = (
          // eslint-disable-next-line react/jsx-no-useless-fragment
          <>
            <InfoRow
              name="NFT"
              value={
                <Link
                  href={getExplorerUrl(result.asset, 'assets')}
                  target="_blank"
                  underline="hover"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}>
                  {result.asset} <Icon icon={iconOpenInNewRounded} />
                </Link>
              }
            />
          </>
        );
      },
    });
  };
  const requestPayment = () => {
    const action = 'request-payment';
    results[action] = null;
    connectApi.open({
      action,
      onSuccess({ result }) {
        results[action] = (
          <>
            <InfoRow
              name="Transation Hash"
              value={
                <Link
                  href={getExplorerUrl(result.hash)}
                  target="_blank"
                  underline="hover"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}>
                  {result.hash} <Icon icon={iconOpenInNewRounded} />
                </Link>
              }
            />
            <InfoRow name="Signature" value={result.sig} />
          </>
        );
      },
    });
  };
  const multipleClaims = () => {
    const action = 'multiple-claims';
    results[action] = null;
    connectApi.open({
      action,
      onSuccess({ result }) {
        results[action] = (
          <>
            <Typography variant="h6">Step 1</Typography>
            <Box sx={{ pl: 1 }}>
              <InfoRow name="Raw data" value={result[0].origin} />
              <InfoRow name="Signature" value={result[0].sig} />
            </Box>
            <Typography variant="h6">Step 2</Typography>
            <Box sx={{ pl: 1 }}>
              <InfoRow name="Raw data" value={result[1].origin} />
              <InfoRow name="Digest data" value={result[1].digest} />
              <InfoRow name="Signature" value={result[1].sig} />
            </Box>
          </>
        );
      },
    });
  };

  const multipleSteps = () => {
    const action = 'multiple-steps';
    results[action] = null;
    connectApi.open({
      action,
      onSuccess({ result }) {
        results[action] = (
          <>
            <Typography variant="h6">Step 1</Typography>
            <Box sx={{ pl: 1 }}>
              <InfoRow name="Raw data" value={result[0].origin} />
              <InfoRow name="Signature" value={result[0].sig} />
            </Box>
            <Typography variant="h6">Step 2</Typography>
            <Box sx={{ pl: 1 }}>
              <InfoRow name="Raw data" value={result[1].origin} />
              <InfoRow name="Digest data" value={result[1].digest} />
              <InfoRow name="Signature" value={result[1].sig} />
            </Box>
          </>
        );
      },
    });
  };
  return (
    <Layout>
      <Typography component="h3" variant="h4" className="section__header" color="textPrimary" gutterBottom>
        Step 1{' '}
        <Typography component="small" color="text.secondary">
          Prepare DID Wallet
        </Typography>
      </Typography>
      <Typography variant="body1">
        Get DID Wallet in Here{' '}
        <Link
          href={getWalletUrl}
          target="_blank"
          underline="hover"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
          }}>
          DID Wallet <Icon icon={iconOpenInNewRounded} />
        </Link>
      </Typography>
      <Box
        component="a"
        href={getWalletUrl}
        target="_blank"
        rel="noreferrer"
        sx={{
          display: 'block',
          px: {
            sm: 0,
            md: 8,
            lg: 16,
          },
        }}>
        <Box
          component="img"
          src={getWalletImgUrl}
          alt="Prepare DID Wallet"
          sx={{
            width: '100%',
          }}
        />
      </Box>

      <Typography component="h3" variant="h4" color="text.primary" gutterBottom sx={{ mt: 2 }}>
        Step 2{' '}
        <Typography component="small" color="text.secondary">
          Enjoy The DID Connect Playground
        </Typography>
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          mb: 5,
        }}>
        <ConnectItem
          title="Request Profile"
          description="If the app need user name/email to function properly, you can request a profile from the user."
          onClick={requestProfile}
          result={results['request-profile']}
        />
        <ConnectItem
          title="Request NFT"
          description="Please purchase a Server Ownership NFT from launcher.staging.arcblock.io before click following button."
          onClick={requestNFT}
          result={results['request-nft']}
        />
        {/* <ConnectItem
          title="Request Verifiable Credential"
          description="Please admin a passport vc from node-dev-1.arcblock.io before click following button."
        /> */}
        <ConnectItem
          title="Request Text Signature"
          description="In some cases, app may want user to sign some text to authorize the app to do something."
          onClick={requestTextSignature}
          result={results['request-text-signature']}
        />
        <ConnectItem
          title="Request Digest Signature"
          description="In some cases, when the data to be signed is too large to display in DID Wallet, the app shall request the Wallet to sign the digest of the data."
          onClick={requestDigestSignature}
          result={results['request-digest-signature']}
        />
        <ConnectItem
          title="Request Transation Signature"
          description="When the app needs user to sign some transaction that can be broadcast to arcblock chain."
          onClick={requestTransationSignature}
          result={results['request-transaction-signature']}
        />
        <ConnectItem
          title="Request Payment"
          description="When the app needs user to pay some token to get some service."
          onClick={requestPayment}
          result={results['request-payment']}
        />
        <ConnectItem
          title="Multiple Claims"
          description="Request profile and NFT ownership in a single session."
          onClick={multipleClaims}
          result={results['multiple-claims']}
        />
        <ConnectItem
          title="Multiple Steps"
          description="Request profile and then present NFT ownership."
          onClick={multipleSteps}
          result={results['multiple-steps']}
        />
      </Box>
    </Layout>
  );
}

export default Main;
