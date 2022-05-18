<script setup>
import { ref, computed, onMounted, unref } from 'vue';
import { useClipboard } from '@vueuse/core';
import { NTooltip } from 'naive-ui';

import '@fontsource/ubuntu-mono/400.css';

import useLoadFont from '../../hooks/use-load-font';
import COLORS from '../../constants/colors';

const translations = {
  en: {
    copy: 'Click To Copy',
    copied: 'Copied!',
  },
  zh: {
    copy: '点击复制',
    copied: '已复制!',
  },
};

const props = defineProps({
  size: {
    type: Number,
    default: 0,
  },
  copyable: {
    type: Boolean,
    default: true,
  },
  content: {
    type: String,
    default: '',
    required: true,
  },
  inline: {
    type: Boolean,
    default: true,
  },
  compact: Boolean,
  dark: Boolean,
  startChars: {
    type: Number,
    default: 6,
  },
  endChars: {
    type: Number,
    default: 6,
  },
  locale: {
    type: String,
    validator: (v) => ['en', 'zh'].includes(v),
    default: 'en',
  },
});
const emits = defineEmits(['test']);
const initialWidth = ref(0);
const copyContent = ref('');
const textRef = ref(null);
const addressRef = ref(null);

defineExpose({
  initialWidth,
});

onMounted(() => {
  useLoadFont('Ubuntu Mono', () => {
    initialWidth.value = unref(addressRef).clientWidth;
  });
});

const { copy, copied } = useClipboard({ source: copyContent });

const computedContent = computed(() => {
  if (props.compact) {
    if (props.content.length > props.startChars + props.endChars + 3) {
      return `${props.content.slice(0, props.startChars)}...${props.content.slice(
        props.content.length - props.endChars
      )}`;
    }
  }
  return props.content;
});
const computedLocale = computed(() => {
  if (!translations[props.locale]) {
    return 'en';
  }
  return props.locale;
});

function onCopy() {
  const copyRaw = props.content || textRef.value.textContent;
  copyContent.value = String(copyRaw).trim();
  copy();
}

const getFontSize = (size) => {
  // 12px 及以上的 size 有效, 否则返回 inherit
  if (size && Number(size) >= 12) {
    return `${Number(size)}px`;
  }
  return 'inherit';
};
</script>

<template>
  <div
    ref="addressRef"
    class="did-address"
    :style="{
      display: initialWidth ? (props.inline ? 'inline-flex' : 'flex') : 'inline-flex',
      visibility: initialWidth ? 'visible' : 'hidden',
      fontSize: getFontSize(props.size),
    }"
    @click="emits('test')"
  >
    <slot name="prepend"></slot>

    <div class="did-address__text did-address__truncate" ref="textRef">
      <slot :showContent="computedContent">{{ computedContent }}</slot>
    </div>
    <span v-if="copyable" class="did-address__copy-wrapper">
      <i
        v-if="!copied"
        class="did-address__copy cursor-pointer text-[#999] i-mdi:content-copy"
        @click="onCopy"
        :title="translations[computedLocale].copy"
      />
      <NTooltip
        v-else
        :show="true"
        size="small"
        :style="{
          padding: '5px 12px',
          'line-height': 1.35,
          'font-size': '14px',
          '--n-text-color': props.dark ? 'rgb(255 255 255 / 82%)' : '#fff',
          '--n-color': props.dark ? '#48484e' : '#6d6d6d',
        }"
      >
        <template #trigger>
          <i
            class="did-address__copy i-mdi:check"
            :style="{
              color: COLORS.SUCCESS,
            }"
          />
        </template>
        {{ translations[computedLocale].copied }}
      </NTooltip>
    </span>

    <slot name="append"></slot>
  </div>
</template>

<style scoped>
.did-address {
  display: inline-flex;
  align-items: center;
}
.did-address__text {
  font-family: 'Ubuntu Mono', monospace;
  color: #666;
}
.did-address__text :deep(a) {
  color: inherit;
}
.did-address__copy-wrapper {
  margin-left: 8px;
}
.did-address__copy {
  width: 1em;
  height: 1em;
  color: #999;
  cursor: pointer;
}
.did-address__truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
