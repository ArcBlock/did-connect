import { h } from 'vue';
// import Address from '../components/address';

export default (Com) => {
  return function withAddress(props, { attrs, slots }) {
    return h(
      'div',
      {
        class: 'test-div',
      },
      h(Com, attrs, slots)
    );
  };
  // return defineComponent({
  //   name: 'WithWebWallet',
  //   props: {
  //     content: String,
  //   },
  //   setup(props, { slots }) {
  //     return () =>
  //       h(
  //         'div',
  //         {
  //           class: 'test-div',
  //         },
  //         h(Com, props, slots)
  //       );
  //   },
  // });
};

// WithWebWallet(Connect);

// const WithWebWallet = defineComponent({
//   name: 'WithWebWallet',
//   setup(props, { attrs, slots }) {
//     return () => h('div', null, () => h(Connect, attrs, slots));
//   },
// });
