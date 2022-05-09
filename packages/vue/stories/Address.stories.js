import Address from '../src/components/address';

export default {
  title: 'Components/Address',
  component: Address,
  argTypes: {
    default: {
      control: 'text',
      description: 'Slot content',
    },
    prepend: {
      control: 'text',
      description: 'Prepend Slot content',
    },
    append: {
      control: 'text',
      description: 'Append Slot content',
    },
    compact: {
      control: 'boolean',
      description: 'Compact mode',
      defaultValue: false,
    },
    responsive: {
      control: 'boolean',
      defaultValue: true,
    },
    copyable: {
      control: 'boolean',
      defaultValue: true,
    },
    inline: {
      control: 'boolean',
      defaultValue: true,
    },
    size: {
      control: 'number',
      defaultValue: 0,
    },
    startChars: {
      control: 'number',
      defaultValue: 6,
    },
    endChars: {
      control: 'number',
      defaultValue: 6,
    },
    content: {
      control: 'text',
      description: 'address',
    },
    locale: {
      control: 'inline-radio',
      options: ['en', 'zh'],
      defaultValue: 'en',
    },
  },
};

const Template = (args) => ({
  components: { Address },
  setup() {
    return {
      args,
    };
  },
  template: `<div
  :style="{
    width: '300px',
    height: '120px',
    border: '1px solid #eee',
    overflow: 'auto',
    resize: 'both',
    padding: '10px'
  }">
  <Address v-bind="args">
    <template #prepend>{{args.prepend}}</template>
    <template v-if="args.default">{{args.default}}</template>
    <template v-if="args.append" #append>{{args.append}}</template>
  </Address>
</div>`,
});

export const DidAddress = Template.bind({});
DidAddress.args = {
  content: 'abcdefghijklmnopqrstuvwxyz',
  responsive: true,
};
