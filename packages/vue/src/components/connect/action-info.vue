<script setup>
const props = defineProps({
  messages: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <div class="action-info">
    <h6 className="action-info__title">
      {{ props.messages.title }}
    </h6>
    <p v-if="props.messages.scan" className="action-info__desc">
      {{ props.messages.scan }}
    </p>
  </div>
</template>

<style lang="less" scoped>
.action-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 48px;
  text-align: center;
  .action-info__title {
    margin: 0;
    font-size: 28px;
    color: #222;
  }
  .action-info__desc {
    margin: 8px 0 0 0;
    font-size: 18px;
    color: #9397a1;
  }
  @media (max-width: 768px) {
    .action-info__title {
      font-size: 24px;
    }
    .action-info__desc {
      font-size: 14px;
    }
  }
}
</style>
