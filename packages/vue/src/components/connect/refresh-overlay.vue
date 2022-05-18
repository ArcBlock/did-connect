<script setup>
const emits = defineEmits(['refresh']);
</script>

<template>
  <div class="did-refresh-overlay" @click.stop="emits('refresh')">
    <span>
      <i class="i-mdi:refresh"></i>
    </span>
  </div>
</template>

<style lang="less" scoped>
.did-refresh-overlay {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.1);
  cursor: pointer;
  font-size: 28px;

  & > span {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: 48px;
    height: 48px;
    border-radius: 100%;
    color: #fff;
    background-color: #4598fa;
  }
}
</style>
