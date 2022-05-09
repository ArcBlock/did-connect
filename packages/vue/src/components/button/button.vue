<script setup>
import { computed } from 'vue';
import { NButton } from 'naive-ui';
import { createHoverColor, createPressedColor } from 'naive-ui/lib/_utils/color';
import ConnectLogo from '@arcblock/icons/src/icons/connect-logo.svg?component';

const colorDisabled = '#EBEDF0';
const textColorDisabled = '#CCCCCC';
const props = defineProps({
  color: {
    type: String,
    default: 'did',
    validator: (v) => ['did', 'primary', 'secondary', 'error', 'info', 'success', 'warning'].includes(v),
  },
  size: {
    type: String,
    default: '',
    validator: (v) => !isNaN(v) || ['', 'tiny', 'small', 'medium', 'large'].includes(v),
  },
});

function createTextStyle(color = '#fff') {
  return {
    '--n-text-color': color,
    '--n-text-color-hover': color,
    '--n-text-color-pressed': color,
    '--n-text-color-focus': color,
    '--n-text-color-disabled': textColorDisabled,
  };
}

const computedStyle = computed(() => {
  function generateStyles(color) {
    // const color = '#4598fa';
    const hoverColor = createHoverColor(color);
    const pressedColor = createPressedColor(color);
    return {
      '--n-color': color,
      '--n-color-hover': hoverColor,
      '--n-color-pressed': pressedColor,
      '--n-color-focus': hoverColor,
      '--n-color-disabled': colorDisabled,
      '--n-ripple-color': colorDisabled,

      '--n-border': `1px solid ${color}`,
      '--n-border-hover': `1px solid ${hoverColor}`,
      '--n-border-pressed': `1px solid ${pressedColor}`,
      '--n-border-focus': `1px solid ${hoverColor}`,
      '--n-border-disabled': `1px solid ${colorDisabled}`,
    };
  }
  const colorsMap = {
    primary: '#4F6AF6',
    did: '#4598fa',
    secondary: '#31AB86',
    error: '#F16E6E',
    info: '#0775F8',
    success: '#34BE74',
    warning: '#DE9E37',
  };
  const tempColors = generateStyles(colorsMap[props.color]);
  if (['did', 'secondary'].includes(props.color)) {
    return Object.assign(createTextStyle(), tempColors);
  }
  return tempColors;
});
</script>

<template>
  <NButton class="did-connect__button" :type="props.color" :size="props.size" :style="computedStyle">
    <span class="font-400">
      <slot>Continue With</slot>
    </span>
    <ConnectLogo class="h-[1.2em] w-auto mr-[4px] ml-[8px]" />
  </NButton>
</template>
