import { h, ref } from 'vue';
import { action } from '@storybook/addon-actions';

import { Connect, BasicConnect } from '../src/components';
import { createFakeCheckFn, messages } from './util';

// const longUrl = `https://abtwallet.io/i/?action=requestAuth&url=https%253A%252F%252Fkitchen-sink-blocklet-pft-adminurl-192-168-2-3.ip.abtnet.io%252F.service%252F%2540abtnode%252Fauth-service%252Fapi%252Fdid%252Fissue-passport%252Fauth%253F_t_%253D0c39741d&extra=${'abcdefg'.repeat(
//   30
// )}`;

function TestContainer(props, { slots }) {
  const style = {
    padding: '8px',
    border: '1px solid #ddd',
    'background-color': '#eee',
    width: '720px',
    height: '780px',
    'max-width': '100%',
    'max-height': '100%',
  };
  if (props.resize) {
    style.overflow = 'auto';
    style.resize = 'both';
  }
  return h(
    'div',
    {
      style,
    },
    slots
  );
}

TestContainer.props = {
  resize: Boolean,
};

const makeConnectProps = (tokenState, props) => {
  return Object.assign(
    {
      state: Object.assign(
        {
          appInfo: {
            icon: 'https://node-dev-1.arcblock.io/admin/blocklet/logo/z8iZjySpAu4jzbMochL9k1okuji1GcS7RRRDM',
            name: 'my-app-name',
            publisher: 'did:abt:zNKYkwPJHM4V44YSJ23AxZaHpky9e72SmoKs',
          },
        },
        tokenState
      ),
      action: 'login',
      prefix: '',
      messages: {
        title: 'My Action Name',
        scan: 'My App action instruction',
        confirm: 'Confirm this request on your Wallet',
        success: 'You have successfully signed in!',
      },
      generate: () => {},
      cancelWhenScanned: () => {},
      webWalletUrl: `${window.location.protocol}//wallet.staging.arcblock.io`,
    },
    props
  );
};

export default {
  title: 'Components/Connect',
  component: Connect,
  // argTypes: {
  //   variant: {
  //     control: {
  //       type: 'select',
  //       options: ['circle', 'rounded', 'default'],
  //       defaultValue: 'default',
  //     },
  //   },
  // },
};

// const Template = (args) => ({
//   components: { Connect },
//   setup: () => ({ args }),
//   template: `<Avatar v-bind="args"></Avatar>`,
// });

export const Loading = (args) => ({
  components: { BasicConnect, TestContainer },
  setup: () => ({ args, makeConnectProps }),
  template: `
  <TestContainer resize style="width: 300px;height: 300px">
    <BasicConnect v-bind="makeConnectProps({ loading: true })" >
      <template v-if="args.loading" #loading>
        <div v-html="args.loading">
        </div>
      </template>
    </BasicConnect>
  </TestContainer>
  `,
});
Loading.args = {
  loading: `Loading...`,
};

export const Created = (args) => ({
  components: { BasicConnect, TestContainer },
  setup: () => ({ args, makeConnectProps }),
  template: `
  <TestContainer>
    <BasicConnect v-bind="makeConnectProps({
      status: 'created',
      url: 'https://abtwallet.io/i/?action=requestAuth&url=https%253A%252F%252Fplayground.staging.arcblock.io%252F.well-known%252Fservice%252Fapi%252Fdid%252Flogin%252Fauth%253F_t_%253D14b9ba1a',
      connectedDid: args.autoConnect ? 'xxx' : '',
      saveConnect: args.autoConnect,
      enabledConnectTypes: args.enabledConnectTypes
    })">
      <template v-if="args.extra" #extra>
        <div v-html="args.extra">
        </div>
      </template>
    </BasicConnect>
  </TestContainer>
  `,
});
Created.args = {
  extra: `<div style="font-size:12px; text-align:center;">
  <a href="/" style="text-decoration: none;">
    Lost your passport? Recover it from here.
  </a>
</div>`,
  autoConnect: false,
  enabledConnectTypes: ['web', 'mobile'],
};

export const Scanned = (args) => ({
  components: { BasicConnect, TestContainer },
  setup: () => ({ args, makeConnectProps }),
  template: `
  <TestContainer>
    <BasicConnect v-bind="makeConnectProps({
      status: 'scanned',
      url: 'dummy-url'
    })" />
  </TestContainer>
  `,
});

export const Succeed = (args) => ({
  components: { BasicConnect, TestContainer },
  setup: () => ({ args, makeConnectProps }),
  template: `
  <TestContainer>
    <BasicConnect v-bind="makeConnectProps({
      status: 'succeed',
      url: 'dummy-url'
    })" />
  </TestContainer>
  `,
});

export const Error = (args) => ({
  components: { BasicConnect, TestContainer },
  setup: () => ({ args, makeConnectProps }),
  template: `
  <TestContainer resize>
    <BasicConnect v-bind="makeConnectProps({
      status: 'error',
      url: 'dummy-url',
      error: args.error,
    })" />
  </TestContainer>
  `,
});
Error.args = {
  error: 'We_encountered_some_errors_when_processing_the_request '.repeat(7),
};

export const Timeout = (args) => ({
  components: { BasicConnect, TestContainer },
  setup: () => ({ args, makeConnectProps }),
  template: `
  <TestContainer>
    <BasicConnect v-bind="makeConnectProps({
      status: 'timeout',
      url: 'dummy-url'
    })" />
  </TestContainer>
  `,
});

export const BrokingAppIcon = (args) => ({
  components: { BasicConnect, TestContainer },
  setup: () => ({ args, makeConnectProps }),
  template: `
  <TestContainer resize>
    <BasicConnect v-bind="makeConnectProps({
      appInfo: {
        icon: 'https://invalid-app-icon',
        name: 'my-app-name',
        publisher: 'did:abt:zNKYkwPJHM4V44YSJ23AxZaHpky9e72SmoKs',
      },
      status: 'created',
      url: 'dummy-url',
    })" />
  </TestContainer>
  `,
});

// export const Mocking = (args) => ({
//   components: { Connect, TestContainer },
//   setup: () => {
//     const webWalletUrl = `${window.location.protocol}//www.abtnode.com`;
//     return {
//       args,
//       webWalletUrl,
//       createFakeCheckFn,
//       messages,
//       action,
//     };
//   },
//   template: `
//   <TestContainer resize>
//     <Connect
//       open
//       action="login"
//       prefix=""
//       :checkInterval="500"
//       :checkFn="createFakeCheckFn('interval')"
//       :onClose="action('login.close')"
//       :onSuccess="action('login.success')"
//       :messages="messages"
//       :webWalletUrl="webWalletUrl" />
//   </TestContainer>
//   `,
// });

export const Popup = (args) => ({
  components: { Connect, TestContainer },
  setup: () => {
    const webWalletUrl = `${window.location.protocol}//www.abtnode.com`;
    const open = ref(false);
    return {
      args,
      webWalletUrl,
      createFakeCheckFn,
      messages,
      action,
      open,
    };
  },
  template: `
  <button @click="() => {open = true}">Open</button>
  <Connect
    popup
    v-model:open="open"
    action="login"
    prefix=""
    :locale="args.locale"
    :checkInterval="args.checkInterval"
    :checkTimeout="args.checkTimeout"
    :checkFn="createFakeCheckFn('default')"
    :messages="messages"
    :webWalletUrl="webWalletUrl"
    @close="action('login.close')"
    @success="action('login.success')"
    />
  `,
});
Popup.args = {
  locale: 'en',
};
Popup.argTypes = {
  locale: {
    control: 'inline-radio',
    options: ['en', 'zh'],
  },
};

export const ApiTimeout = (args) => ({
  components: { Connect, TestContainer },
  setup: () => {
    const webWalletUrl = `${window.location.protocol}//www.abtnode.com`;
    const open = ref(false);
    return {
      args,
      webWalletUrl,
      createFakeCheckFn,
      messages,
      action,
      open,
    };
  },
  template: `
  <button @click="() => {open = true}">Open</button>
  <Connect
    popup
    v-model:open="open"
    action="login"
    prefix=""
    :checkInterval="args.checkInterval"
    :checkTimeout="args.checkTimeout"
    :checkFn="createFakeCheckFn('timeout', 2000, 0)"
    :messages="messages"
    :webWalletUrl="webWalletUrl"
    @close="action('login.close')"
    @success="action('login.success')"
    />
  `,
});
ApiTimeout.storyName = 'Api/Timeout';
ApiTimeout.args = {
  checkInterval: 2000,
  checkTimeout: 4000,
};

export const ApiError = (args) => ({
  components: { Connect, TestContainer },
  setup: () => {
    const webWalletUrl = `${window.location.protocol}//www.abtnode.com`;
    const open = ref(false);
    return {
      args,
      webWalletUrl,
      createFakeCheckFn,
      messages,
      action,
      open,
    };
  },
  template: `
  <button @click="() => {open = true}">Open</button>
  <Connect
    popup
    v-model:open="open"
    action="error"
    prefix=""
    :checkFn="createFakeCheckFn('error')"
    :messages="messages"
    :webWalletUrl="webWalletUrl"
    @close="action('login.close')"
    @success="action('login.success')"
    />
  `,
});
ApiError.storyName = 'Api/Error';
