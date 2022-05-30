import Avatar from '../src/components/avatar';

export default {
  title: 'Components/Avatar',
  component: Avatar,
  argTypes: {
    variant: {
      control: {
        type: 'select',
        options: ['circle', 'rounded', 'default'],
        defaultValue: 'default',
      },
    },
    shape: {
      control: {
        type: 'select',
        options: ['', 'rectangle', 'square', 'hexagon', 'circle'],
        defaultValue: '',
      },
    },
    size: {
      control: {
        type: 'number',
        defaultValue: 36,
      },
    },
    animation: {
      control: {
        type: 'boolean',
        defaultValue: false,
      },
    },
    responsive: {
      control: {
        type: 'boolean',
        defaultValue: false,
      },
    },
  },
};

const Template = (args) => ({
  components: { Avatar },
  setup: () => ({ args }),
  template: `<Avatar v-bind="args"></Avatar>`,
});

export const Primary = (args) => ({
  components: { Avatar },
  setup: () => ({ args }),
  template: `
  <div v-if="args.responsive" :style="{
    width: '240px',
    height: '240px',
    border: '1px solid #eee',
    overflow: 'auto',
    resize: 'both',
    padding: '10px'
  }">
    <Avatar v-bind="args"></Avatar>
  </div>
  <Avatar v-else v-bind="args"></Avatar>
  `,
});
Primary.storyName = 'DID Avatar';
Primary.parameters = { controls: { exclude: ['src', 'variant'] } };
Primary.args = {
  did: 'zysiVRb5pSUPGcitPepiz4Pm5SpQ2EtgejMV',
  size: 60,
  animation: true,
  shape: '',
  responsive: false,
};

export const AvatarETH = Template.bind({});
AvatarETH.storyName = 'ETH Avatar';
AvatarETH.parameters = { controls: { exclude: ['shape', 'animation', 'responsive'] } };
AvatarETH.args = {
  did: '0x8d75FD337071AdcC22B9c7D7C0ccff2e5aaCB112',
  size: 60,
  variant: 'default',
};

export const AvatarImg = Template.bind({});
AvatarImg.storyName = 'Image Avatar';
AvatarImg.parameters = { controls: { exclude: ['shape', 'animation', 'responsive'] } };
AvatarImg.args = {
  did: '0x8d75FD337071AdcC22B9c7D7C0ccff2e5aaCB112',
  src: '/favicon.svg',
  size: 60,
  variant: 'circle',
};
