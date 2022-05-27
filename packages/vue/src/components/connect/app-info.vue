<script setup>
import Avatar from '../avatar';
import Address from '../address';
import { getAppDid } from './libs/utils';

const props = defineProps({
  appInfo: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <div class="did-connect__app-info">
    <Avatar :did="props.appInfo.publisher" :src="props.appInfo.icon" :title="props.appInfo.title" :size="32" />
    <div class="did-connect__app-info__content">
      <div class="did-connect__app-info__name">
        {{ props.appInfo.name }}
      </div>
      <Address
        v-if="props.appInfo.publisher"
        :size="14"
        class="did-connect__app-info__did"
        :content="getAppDid(props.appInfo.publisher)"
      />
    </div>
  </div>
</template>

<style lang="less" scoped>
.did-connect__app-info {
  display: flex;
  align-items: center;
  position: absolute;
  left: 24px;
  right: 24px;
  top: 24px;
  font-size: 16px;
  font-weight: 700;
  color: #222;

  /* 禁止 app icon shrink */
  & > *:first-child {
    flex: 0 0 auto;
  }

  .did-connect__app-info__content {
    padding-left: 16px;
    overflow: hidden;
  }

  .did-connect__app-info__name {
    max-width: 100%;
    padding-right: 32px;
    line-height: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .did-connect__app-info__did {
    color: #666;
    font-size: 12px;
  }
}
</style>
