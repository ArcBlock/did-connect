<script setup>
import ConnectIcon from '@arcblock/icons/src/icons/connect.svg?component';
import DidWalletLogo from '@arcblock/icons/src/icons/did-wallet-logo.svg?component';
import { localeProp } from '../../libs/props';

import BaseButton from '../button/base-button.vue';
import locales from './libs/locales';
import COLORS from '../../constants/colors';

const props = defineProps({
  status: {
    type: String,
    required: true,
  },
  locale: localeProp,
  messages: {
    type: Object,
    required: true,
  },
});
const emits = defineEmits(['cancel', 'retry']);
</script>

<template>
  <div class="status-card">
    <div v-if="status === 'scanned'" class="status-card--scanned">
      <span class="status-card__icon">
        <ConnectIcon
          :style="{
            width: '48px',
            height: '48px',
            fill: COLORS.DID,
          }"
        />
      </span>
      <div class="mt-2 leading-[34px] text-[#4598fa] text-center font-600" style="font-size: 24px">
        {{ locales[props.locale].scanned }}
      </div>
      <div class="mt-1.5 flex items-center">
        <div class="text-[#a8b4c5] font-400" style="font-size: 16px">
          {{ locales[props.locale].connected }}
        </div>
        <DidWalletLogo class="h-[1em] ml-[8px]" />
      </div>
      <div class="mt-8">
        <BaseButton @click="emits('cancel')">
          {{ locales[props.locale].back }}
        </BaseButton>
      </div>
    </div>

    <div v-if="status === 'succeed'" class="status-card--succeed">
      <span class="status-card__icon">
        <i class="text-2xl i-mdi:check" />
      </span>
      <p class="status-card__icon-text">
        {{ locales[props.locale].success }}
      </p>
      <p class="status-card__desc">
        {{ props.messages.success }}
      </p>
    </div>

    <div v-if="status === 'error'" class="status-card--error">
      <span class="status-card__icon">
        <i class="text-2xl i-mdi:close" />
      </span>
      <p class="status-card__icon-text">
        {{ locales[props.locale].failed }}
      </p>
      <p class="status-card__desc">
        {{ props.messages.error || locales[props.locale].error }}
      </p>
      <div class="mt-8">
        <BaseButton @click="emits('retry')">
          {{ locales[props.locale].retry }}
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.status-card {
  display: flex;
  justify-content: center;
  align-items: center;
  color: #a8b4c5;
  border: 0;
  border-radius: 0;
  background-color: transparent;
  .status-card__icon {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: 48px;
    height: 48px;
    border-radius: 100%;
    color: #fff;
  }
  .status-card__icon-text {
    margin: 16px 0;
    font-size: 24px;
    font-weight: 400;
  }
  .status-card__desc {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    font-size: 14px;
  }
  .status-card--scanned {
    .status-card__icon {
      color: #4598fa;
    }
  }
  .status-card--scanned,
  .status-card--succeed,
  .status-card--error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .status-card--succeed {
    .status-card__icon {
      background-color: #3ab39d;
    }
    .status-card__icon-text {
      color: #3ab39d;
    }
  }
  .status-card--error {
    .status-card__icon {
      background-color: #f16e6e;
    }
    .status-card__icon-text {
      color: #f16e6e;
    }
    .status-card__desc {
      word-break: break-all;
    }
  }
  .text-wallet {
    color: #334660;
    font-size: 14px;
    font-weight: 700;
  }
}
</style>
