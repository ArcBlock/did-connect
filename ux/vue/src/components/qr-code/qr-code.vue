<script setup>
import { ref, unref, watchEffect } from 'vue';
import QRCodeStyling from '@solana/qr-code-styling';

const defaults = {
  margin: 0,
  dotsOptions: {
    type: 'dots',
  },
  cornersSquareOptions: {
    type: 'extra-rounded',
  },
  cornersDotOptions: {
    type: 'dot',
  },
};

const props = defineProps({
  data: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  image: String,
  // 覆盖 qr-code-styling 配置
  config: {
    type: Object,
    default: () => ({}),
  },
});

const qrCodeRef = ref(null);
watchEffect(() => {
  const qrCode = new QRCodeStyling({
    ...defaults,
    data: props.data,
    width: props.size,
    height: props.size,
    ...(props.image && {
      image: props.image,
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: 0,
      },
    }),
    ...props.config,
  });
  qrCode.append(unref(qrCodeRef));
});
</script>

<template>
  <div ref="qrCodeRef"></div>
</template>
