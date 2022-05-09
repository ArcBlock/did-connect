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
        options: ['tiny', 'small', 'medium', 'large'],
        defaultValue: 'medium',
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
  size: 'medium',
  default: 'Continue With',
};
