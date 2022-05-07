import Button from '../src/components/button';

export default {
  title: 'Components/Button',
  component: Button,
  argTypes: {
    color: {
      control: {
        type: 'select',
        options: ['did', 'primary', 'secondary', 'error', 'info', 'success', 'warning'],
        defaultValue: 'did',
      },
    },
    size: {
      control: {
        type: 'select',
        options: ['x-small', 'small', 'default', 'large', 'x-large'],
        defaultValue: 'default',
      },
    },
    default: {
      control: 'text',
      defaultValue: 'Continue With',
    },
  },
};

const Template = (args) => ({
  components: { Button },
  setup: () => ({ args }),
  template: `<Button v-bind="args">
  {{args.default}}
</Button>`,
});

export const Primary = Template.bind({});
Primary.storyName = 'Connect Button';
Primary.args = {
  color: 'did',
  size: 'default',
  default: 'Continue With',
};
