<script setup>
import { computed } from 'vue';
import { NButton } from 'naive-ui';
import { createHoverColor, createPressedColor } from 'naive-ui/lib/_utils/color';
import COLORS from '../../constants/colors';

const colorDisabled = '#EBEDF0';
const textColorDisabled = '#CCCCCC';
const props = defineProps({
  color: {
    type: String,
    default: 'default',
    validator: (v) => ['default', 'did', 'primary', 'secondary', 'error', 'info', 'success', 'warning'].includes(v),
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
  if (props.color === 'default') {
    const tempColor = COLORS.DID;
    const tempHoverColor = createHoverColor(tempColor);
    const tempPressedColor = createPressedColor(tempColor);
    return {
      '--n-ripple-color': tempColor,
      '--n-text-color-hover': tempHoverColor,
      '--n-text-color-pressed': tempPressedColor,
      '--n-text-color-focus': tempHoverColor,

      '--n-border-hover': `1px solid ${tempHoverColor}`,
      '--n-border-pressed': `1px solid ${tempPressedColor}`,
      '--n-border-focus': `1px solid ${tempHoverColor}`,
      '--n-border-disabled': `1px solid ${colorDisabled}`,
    };
  }

  const propsColor = props.color === 'default' ? 'primary' : props.color;

  function generateStyles(color) {
    const hoverColor = createHoverColor(color);
    const pressedColor = createPressedColor(color);
    return {
      '--n-color': color,
      '--n-color-hover': hoverColor,
      '--n-color-pressed': pressedColor,
      '--n-color-focus': hoverColor,
      '--n-color-disabled': colorDisabled,
      '--n-ripple-color': color,

      '--n-border': `1px solid ${color}`,
      '--n-border-hover': `1px solid ${hoverColor}`,
      '--n-border-pressed': `1px solid ${pressedColor}`,
      '--n-border-focus': `1px solid ${hoverColor}`,
      '--n-border-disabled': `1px solid ${colorDisabled}`,
    };
  }

  const tempColors = generateStyles(COLORS[propsColor.toUpperCase()]);
  if (['did', 'secondary'].includes(propsColor)) {
    return Object.assign(createTextStyle(), tempColors);
  }
  return tempColors;
});
</script>

<template>
  <NButton class="did-connect__button" :type="props.color" :size="props.size" :style="computedStyle">
    <slot></slot>
    <template #icon>
      <slot name="icon"></slot>
    </template>
  </NButton>
</template>
