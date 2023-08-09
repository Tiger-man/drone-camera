<template>
  <div v-if="isSupported" class="play-container">
    <PickPlaySource @pick-device="pickDevice" />
    <PlayInstance :device="device" />
    <CameraHandle :device="device" />
  </div>
  <div v-else>
    <van-empty
      image="error"
      description="本监控页面播放器采用了flv.js技术,您的设备不支持"
    />
  </div>
</template>

<script lang="ts">
import { Device } from ".";

import { defineComponent, provide, ref } from "vue";
import PickPlaySource from "./PickPlaySource.vue";
import PlayInstance from "./PlayInstance.vue";
import CameraHandle from "./handle/index.vue";

import flvjs from "mpegts.js";

export default defineComponent({
  components: { PickPlaySource, PlayInstance, CameraHandle },
  methods: {},
  setup() {
    const device = ref<Device>({
      deviceId: "",
      channelId: "",
    });

    const pickDevice = ({ deviceId, channelId }: Device) => {
      channelOk.value = false;
      device.value = {
        deviceId,
        channelId,
      };
    };

    const isSupported = flvjs.isSupported();

    const channelOk = ref(false);
    const setChannelOk = () => {
      channelOk.value = true;
    };
    const setChannelFail = () => {
      channelOk.value = false;
    };
    provide("channelOk", channelOk);
    provide("setChannelOk", setChannelOk);
    provide("setChannelFail", setChannelFail);

    return { device, pickDevice, isSupported, channelOk };
  },
});
</script>

<style lang="scss" scoped>
.play-container {
  max-width: 1000px;
  margin: 0 auto;
}
</style>
