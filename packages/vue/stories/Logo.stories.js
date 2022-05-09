import Logo from '../src/components/logo';

export default {
  title: 'Components/Logo',
  component: Logo,
  argTypes: {
    size: {
      control: {
        type: 'number',
      },
    },
  },
};

const Template = (args) => ({
  components: { Logo },
  setup: () => ({ args }),
  template: `<Logo v-bind="args" />`,
});

export const CustomSizeNumber = Template.bind({});
CustomSizeNumber.storyName = 'Custom Size (Number)';
CustomSizeNumber.args = {
  size: 40,
};

export const CustomSizeString = Template.bind({});
CustomSizeString.storyName = 'Custom Size (String)';
CustomSizeString.argTypes = {
  size: {
    control: {
      type: 'text',
    },
  },
};
CustomSizeString.args = {
  size: '4rem',
};

export const CustomStyle = (args) => ({
  components: { Logo },
  setup: () => ({ args }),
  template: `<Logo v-bind="args" :size="64" :style="{color:args.color}"/>`,
});
CustomStyle.parameters = { controls: { exclude: ['size'] } };
CustomStyle.storyName = 'Custom Style';
CustomStyle.argTypes = {
  color: {
    control: {
      type: 'color',
      presetColors: ['red', 'green'],
    },
  },
};
CustomStyle.args = {
  color: 'blue',
};

export const InheritStyle = (args) => ({
  components: { Logo },
  setup: () => ({ args }),
  template: `
  <div :style="args.style">
    My color is green, and font size is 64px, so is the icon
    <br />
    <Logo v-bind="args"/>
  </div>
  `,
});
InheritStyle.parameters = { controls: { exclude: ['size'] } };
InheritStyle.argTypes = {
  style: {
    control: {
      type: 'object',
    },
  },
};
InheritStyle.args = {
  style: {
    color: 'green',
    fontSize: '64px',
    textAlign: 'center',
  },
};

export const ComposeUse = (args) => ({
  components: { Logo },
  setup: () => ({ args }),
  template: `
  <div
    :style="{
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      padding: '32px',
      borderRadius: '128px',
      width: '192px',
      height: '192px',
      background: '#4E6AF6',
      color: '#ffffff',
      margin: '32px',
    }">
    <Logo v-bind="args" :size="128" />
  </div>
  `,
});
ComposeUse.parameters = { controls: { exclude: ['size'] } };
