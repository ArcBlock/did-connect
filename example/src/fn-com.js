import { Address } from '@did-connect/vue';
import withAddress from './with-address';

export default withAddress(Address);

// export default function FnCom(props, { attrs, slots, emit }) {
//   console.log(props, attrs, slots, emit);
//   const type = ref('address');
//   const interId = setInterval(() => {
//     console.log(unref(type));
//   }, 1000);
//   setTimeout(() => {
//     clearInterval(interId);
//     type.value = '';
//   }, 5000);

//   if (unref(type) === 'address') {
//     return h('div', null, h(Address, { content: attrs.msg }));
//   }
//   return h('div', null, attrs.msg);
// }

// FnCom.props = {
//   type: String,
// };

// export default defineComponent({
//   name: 'FnCom',
//   props: {
//     type: String,
//   },
//   setup(props, { attrs, slots, emit }) {
//     console.log(props, attrs, slots, emit);
//     const type = ref(props.type);
//     const interId = setInterval(() => {
//       console.log(unref(type));
//     }, 1000);
//     setTimeout(() => {
//       clearInterval(interId);
//       type.value = '';
//     }, 5000);

//     return () => {
//       if (unref(type) === 'address') {
//         return h('div', null, h(Address, { content: attrs.msg }));
//       }
//       return h('div', null, attrs.msg);
//     };
//   },
// });
