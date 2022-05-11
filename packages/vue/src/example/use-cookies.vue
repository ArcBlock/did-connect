<script setup>
import useCookies from '../hooks/use-cookies';

const testCookie = useCookies('test_cookie', 'test-initialize');
function changeCookie() {
  testCookie.value = testCookie.value + '-';
}
</script>

<template>
  <button @click="changeCookie">change cookies</button>
  <div>{{ testCookie }}</div>
</template>
