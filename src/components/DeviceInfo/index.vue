<script lang="ts" setup>
import { toRefs } from "vue";
import { useDeviceListStore } from "../../store";

const deviceListStore = useDeviceListStore();

const { offlineNum, onlineNum } = toRefs(deviceListStore);
</script>
<template>
  <span class="device-info">
    <van-tag type="success">在线 {{ onlineNum }}</van-tag>
    <van-tag type="danger">离线{{ offlineNum }}</van-tag>
  </span>
</template>

<style>
.device-info {
  font-size: 12px;
}
</style>
