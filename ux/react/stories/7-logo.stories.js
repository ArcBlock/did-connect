import Typography from '@mui/material/Typography';
import { storiesOf } from '@storybook/react';
import DidLogo from '../src/Logo';

storiesOf('DID-Connect/Logo', module)
  .addParameters({
    readme: {
      sidebar: '<!-- PROPS -->',
    },
  })
  .add('with different sizes', () => (
    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
      <DidLogo size="32px" />
      <DidLogo size="64px" />
      <DidLogo size={128} />
      <DidLogo size="4rem" />
    </div>
  ))
  .add('with different styles', () => (
    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
      <DidLogo size={64} style={{ color: 'red' }} />
      <DidLogo size={64} style={{ color: 'blue' }} />
      <DidLogo size={64} style={{ color: 'green' }} />
    </div>
  ))
  .add('with inherit styles', () => (
    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
      <Typography style={{ fontSize: '48px', color: 'green' }} align="center">
        My color is green, and font size is 48px, so is the icon
        <br />
        <DidLogo />
      </Typography>
    </div>
  ))
  .add('make a logo', () => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: 32,
        borderRadius: 128,
        width: 192,
        height: 192,
        lineHeight: 192,
        background: '#4E6AF6',
        color: '#ffffff',
        margin: 32,
      }}
    >
      <DidLogo size={128} />
    </div>
  ));
