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
    },
    copyable: {
      control: 'boolean',
    },
    inline: {
      control: 'boolean',
    },
    size: {
      control: 'number',
    },
    startChars: {
      control: 'number',
    },
    endChars: {
      control: 'number',
    },
    content: {
      control: 'text',
      description: 'address',
    },
    locale: {
      control: 'inline-radio',
      options: ['en', 'zh'],
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
DidAddress.parameters = { controls: { exclude: ['default'] } };
DidAddress.args = {
  content: 'abcdefghijklmnopqrstuvwxyz',
  responsive: true,
};

export const LinkAddress = (args) => ({
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
    <template v-slot="{showContent}">
      <a :href="args.link">{{showContent}}</a>
    </template>
  </Address>
</div>`,
});
LinkAddress.parameters = { controls: { exclude: ['default', 'prepend', 'append'] } };

LinkAddress.args = {
  link: 'https://www.arcblock.io',
  content: 'abcdefghijklmnopqrstuvwxyz',
  responsive: true,
  compact: false,
  inline: true,
  copyable: true,
};
