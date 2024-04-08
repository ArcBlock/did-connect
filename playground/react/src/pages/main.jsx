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
  const { t } = useLocaleContext();
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
      <ConnectButton onClick={onClick} />
      {result ? (
        <Card sx={{ mt: 2 }} variant="outlined">
          <CardContent>
            <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
              {t('result')}
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
  const { locale, t } = useLocaleContext();
  const { connectApi } = useSessionContext();
  const getWalletImgUrl = locale === 'zh' ? getWalletZhImg : getWalletEnImg;
  const getWalletUrl = `https://www.didwallet.io/${locale === 'zh' ? 'zh' : 'en'}`;
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

  const getExplorerUrl = (assetDidOrHash, type = 'txs') => {
    return `https://explorer.abtnetwork.io/explorer/${type}/${assetDidOrHash}?host=${window.blocklet.CHAIN_HOST}`;
  };

  const getConnectMessage = (claimName) => {
    return {
      title: t(`claims.${claimName}.connect.title`),
      scan: t(`claims.${claimName}.connect.scan`),
    };
  };

  const requestProfile = () => {
    const action = 'request-profile';
    results[action] = null;
    connectApi.open({
      locale,
      action,
      onSuccess({ result }) {
        results[action] = (
          <>
            <Avatar variant="circle" src={result.avatar} did={result.did} size={60} />
            <InfoRow name={t('claims.requestProfile.result.fullName')} value={result.fullName} />
            <InfoRow name={t('claims.requestProfile.result.email')} value={result.email} />
            <InfoRow name={t('claims.requestProfile.result.phone')} value={result.phone} />
          </>
        );
      },
      messages: getConnectMessage('requestProfile'),
    });
  };

  const requestTextSignature = () => {
    const action = 'request-text-signature';
    results[action] = null;
    connectApi.open({
      locale,
      action,
      onSuccess({ result }) {
        results[action] = (
          <>
            <InfoRow name={t('claims.requestTextSig.result.origin')} value={result.origin} />
            <InfoRow name={t('claims.requestTextSig.result.signature')} value={result.sig} />
          </>
        );
      },
      messages: getConnectMessage('requestTextSig'),
    });
  };

  const requestDigestSignature = () => {
    const action = 'request-digest-signature';
    results[action] = null;
    connectApi.open({
      locale,
      action,
      onSuccess({ result }) {
        results[action] = (
          <>
            <InfoRow name={t('claims.requestDigestSig.result.origin')} value={result.origin} />
            <InfoRow name={t('claims.requestDigestSig.result.digest')} value={result.digest} />
            <InfoRow name={t('claims.requestDigestSig.result.signature')} value={result.sig} />
          </>
        );
      },
      messages: getConnectMessage('requestDigestSig'),
    });
  };
  const requestTransactionSignature = () => {
    const action = 'request-transaction-signature';
    results[action] = null;
    connectApi.open({
      locale,
      action,
      onSuccess({ result }) {
        results[action] = (
          <>
            <InfoRow name={t('claims.requestTransactionSig.result.transaction')} value={result.transaction} />
            <InfoRow name={t('claims.requestTransactionSig.result.signature')} value={result.sig} />
          </>
        );
      },
      messages: getConnectMessage('requestTransactionSig'),
    });
  };

  const requestNFT = () => {
    const action = 'request-nft';
    results[action] = null;
    connectApi.open({
      locale,
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
      messages: getConnectMessage('requestNFT'),
    });
  };
  const requestPayment = () => {
    const action = 'request-payment';
    results[action] = null;
    connectApi.open({
      locale,
      action,
      onSuccess({ result }) {
        results[action] = (
          <>
            <InfoRow
              name={t('claims.requestPayment.result.hash')}
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
      messages: getConnectMessage('requestPayment'),
    });
  };
  const multipleClaims = () => {
    const action = 'multiple-claims';
    results[action] = null;
    connectApi.open({
      locale,
      action,
      onSuccess({ result }) {
        results[action] = (
          <>
            <Typography variant="h6">{t('step1.title')}</Typography>
            <Box sx={{ pl: 1 }}>
              <InfoRow name={t('claims.multipleClaims.result.origin')} value={result[0].origin} />
              <InfoRow name={t('claims.multipleClaims.result.signature')} value={result[0].sig} />
            </Box>

            <Typography variant="h6">{t('step2.title')}</Typography>
            <Box sx={{ pl: 1 }}>
              <InfoRow name={t('claims.multipleClaims.result.origin')} value={result[1].origin} />
              <InfoRow name={t('claims.multipleClaims.result.digest')} value={result[1].digest} />
              <InfoRow name={t('claims.multipleClaims.result.signature')} value={result[1].sig} />
            </Box>
          </>
        );
      },
      messages: getConnectMessage('multipleClaims'),
    });
  };

  const multipleSteps = () => {
    const action = 'multiple-steps';
    results[action] = null;
    connectApi.open({
      locale,
      action,
      onSuccess({ result }) {
        results[action] = (
          <>
            <Typography variant="h6">Step 1</Typography>
            <Box sx={{ pl: 1 }}>
              <InfoRow name={t('claims.multipleSteps.result.origin')} value={result[0].origin} />
              <InfoRow name={t('claims.multipleSteps.result.signature')} value={result[0].sig} />
            </Box>
            <Typography variant="h6">Step 2</Typography>
            <Box sx={{ pl: 1 }}>
              <InfoRow name={t('claims.multipleSteps.result.origin')} value={result[1].origin} />
              <InfoRow name={t('claims.multipleSteps.result.digest')} value={result[1].digest} />
              <InfoRow name={t('claims.multipleSteps.result.signature')} value={result[1].sig} />
            </Box>
          </>
        );
      },
      messages: getConnectMessage('multipleSteps'),
    });
  };
  return (
    <Layout>
      <Typography component="h3" variant="h4" className="section__header" color="textPrimary" gutterBottom>
        {t('step1.title')}{' '}
        <Typography component="small" color="text.secondary">
          {t('step1.prepareDIDWallet')}
        </Typography>
      </Typography>
      <Typography variant="body1">
        {t('step1.getWalletFromHere')}{' '}
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
        {t('step2.title')}{' '}
        <Typography component="small" color="text.secondary">
          {t('step2.enjoyPlayground')}
        </Typography>
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
          mb: 10,
        }}>
        <ConnectItem
          title={t('claims.requestProfile.title')}
          description={t('claims.requestProfile.description')}
          onClick={requestProfile}
          result={results['request-profile']}
        />
        <ConnectItem
          title={t('claims.requestNFT.title')}
          description={
            <>
              {t('claims.requestNFT.description')}{' '}
              <Link
                href="https://playground.staging.arcblock.io"
                target="_blank"
                underline="hover"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}>
                https://playground.staging.arcblock.io <Icon icon={iconOpenInNewRounded} />
              </Link>
            </>
          }
          onClick={requestNFT}
          result={results['request-nft']}
        />
        {/* <ConnectItem
          title="Request Verifiable Credential"
          description="Please admin a passport vc from node-dev-1.arcblock.io before click following button."
        /> */}
        <ConnectItem
          title={t('claims.requestTextSig.title')}
          description={t('claims.requestTextSig.description')}
          onClick={requestTextSignature}
          result={results['request-text-signature']}
        />
        <ConnectItem
          title={t('claims.requestDigestSig.title')}
          description={t('claims.requestDigestSig.description')}
          onClick={requestDigestSignature}
          result={results['request-digest-signature']}
        />
        <ConnectItem
          title={t('claims.requestTransactionSig.title')}
          description={t('claims.requestTransactionSig.description')}
          onClick={requestTransactionSignature}
          result={results['request-transaction-signature']}
        />
        <ConnectItem
          title={t('claims.requestPayment.title')}
          description={
            <>
              {t('claims.requestPayment.description')}

              <Box>
                {t('claims.requestPayment.takeTokenFromHere')}{' '}
                <Link
                  href="https://faucet.abtnetwork.io"
                  target="_blank"
                  underline="hover"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}>
                  https://faucet.abtnetwork.io <Icon icon={iconOpenInNewRounded} />
                </Link>
              </Box>
            </>
          }
          onClick={requestPayment}
          result={results['request-payment']}
        />
        <ConnectItem
          title={t('claims.multipleClaims.title')}
          description={t('claims.multipleClaims.description')}
          onClick={multipleClaims}
          result={results['multiple-claims']}
        />
        <ConnectItem
          title={t('claims.multipleSteps.title')}
          description={t('claims.multipleSteps.description')}
          onClick={multipleSteps}
          result={results['multiple-steps']}
        />
      </Box>
    </Layout>
  );
}

export default Main;