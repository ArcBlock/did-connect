<script setup>
import { localeProp } from '../../libs/props';
import locales from './libs/locales';

const props = defineProps({
  locale: localeProp,
});
</script>

<template>
  <!-- w-1 -->
  <div class="get-wallet__wrapper">
    <a class="get-wallet" href="https://www.abtwallet.io/" target="_blank" rel="noreferrer">
      {{ locales[props.locale].getWallet }}
    </a>
  </div>
</template>

<style scoped>
.get-wallet__wrapper {
  display: flex;
  justify-content: center;
}
.get-wallet {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  padding-bottom: 0.25rem;
  margin-top: 0.5rem;
  font-weight: 700;
  color: #9397a1;
  margin-left: 0.25rem;
  text-decoration: none;
  outline: none;
}
</style>
