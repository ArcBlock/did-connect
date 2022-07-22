import Avatar from '.';
import Basic from './demo/basic';
import ResponsiveDidMotif from './demo/responsive-did-motif';
import EthBlockies from './demo/eth-blockies';

const dids = {
  'z1YXMb8Souf2u8zVwWzexSNiD5Te7XGS313 (account)': 'z1YXMb8Souf2u8zVwWzexSNiD5Te7XGS313',
  'zNKeLKixvCM32TkVM1zmRDdAU3bvm3dTtAcM (application)': 'zNKeLKixvCM32TkVM1zmRDdAU3bvm3dTtAcM',
  'zjdj2tvjvLVF9S3eFaaX5xEEDuwLu6qdQk2t (asset)': 'zjdj2tvjvLVF9S3eFaaX5xEEDuwLu6qdQk2t',
  'z35n6X6rDp8rWWCGSiXZgvd42bixdLULmX8oX (token)': 'z35n6X6rDp8rWWCGSiXZgvd42bixdLULmX8oX',
  'invalid-did': '',
};

export default {
  title: 'Avatar',
  component: Avatar,
};

Basic.argTypes = {
  size: { control: { type: 'number', min: 20, max: 100, step: 4 }, defaultValue: 44 },
  did: {
    mapping: dids,
    options: Object.keys(dids),
    control: 'select',
    defaultValue: 'z1YXMb8Souf2u8zVwWzexSNiD5Te7XGS313',
  },
  variant: { control: 'select', options: ['rounded', 'circle'] },
  shape: { control: 'select', options: ['circle', 'hexagon', 'square', 'rectangle'] },
  src: { control: 'select', options: ['https://picsum.photos/200/100'] },
};

export { Basic, ResponsiveDidMotif, EthBlockies };
