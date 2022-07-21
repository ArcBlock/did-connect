/* eslint-disable react/jsx-filename-extension */
import Avatar from '..';

export default function Demo(props) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-around' }} {...props}>
      <Avatar did="0x8d75FD337071AdcC22B9c7D7C0ccff2e5aaCB112" size={24} />
      <Avatar did="0x1928fe1bba8adef1cf89946985d711a01dfcf27e" size={36} />
      <Avatar did="0x8d75FD337071AdcC22B9c7D7C0ccff2e5aaCB112" size={64} />
    </div>
  );
}
