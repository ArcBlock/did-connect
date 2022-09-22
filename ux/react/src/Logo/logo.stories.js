import DidLogo from '.';
import Basic from './demo/basic';
import CustomStyle from './demo/custom-style';

export default {
  title: 'Components/Logo',
  component: DidLogo,
};

Basic.argTypes = {
  size: { control: 'select', options: ['32px', '64px', 128, '4rem'], defaultValue: '32px' },
};

export { Basic, CustomStyle };
