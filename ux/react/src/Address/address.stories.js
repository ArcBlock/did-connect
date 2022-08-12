/* eslint-disable react/jsx-filename-extension */
import { styled } from '@arcblock/ux/lib/Theme';
import DidAddress from '.';

import Basic from './demo/basic';
import WithInheritSize from './demo/with-inherit-size';
import WithExtraContent from './demo/with-extra-content';

export default {
  title: 'Basic/Address',
  component: DidAddress,
  decorators: [
    (Story) => (
      <ResizableContainer>
        <Story />
      </ResizableContainer>
    ),
  ],
};

Basic.argTypes = {
  size: { control: 'select', options: [14, 16, 20, 24, 36] },
  copyable: { control: 'boolean', defaultValue: true },
  responsive: { control: 'boolean', defaultValue: true },
  compact: { control: 'boolean' },
  inline: { control: 'boolean' },
  component: { control: 'select', options: ['span', 'div'] },
  locale: { control: 'select', options: ['en', 'zh'] },
};

WithInheritSize.argTypes = {
  containerFontSize: { control: 'select', options: [14, 16, 20, 24, 36] },
};

WithInheritSize.parameters = {
  controls: { include: ['containerFontSize'] },
};

export { Basic, WithInheritSize, WithExtraContent };

const ResizableContainer = styled('div')`
  width: 600px;
  max-width: 100%;
  padding: 16px;
  border: 1px solid #ddd;
  overflow: auto;
  background: #fff;
  resize: both;

  > * + * {
    margin-top: 16px;
  }
`;
