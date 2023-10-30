<template>
  <div class="play-container">
    <PickPlaySource @pick-device="pickDevice" />
    <PlayInstance :device="device" />
    <CameraHandle v-if="channelId" :device="device" />
  </div>
</template>

<script lang="ts">
import { Device } from ".";

import { defineComponent, provide, ref } from "vue";
import PickPlaySource from "./PickPlaySource.vue";
import PlayInstance from "./PlayInstance.vue";
import CameraHandle from "./handle/index.vue";

export default defineComponent({
  components: { PickPlaySource, PlayInstance, CameraHandle },
  methods: {},
  setup() {
    const device = ref<Device>({
      deviceId: "",
      name: "",
    });

    const channelId = ref<string>("");

    const pickDevice = ({ deviceId, name }: Device) => {
      channelId.value = "";
      device.value = {
        deviceId,
        name,
      };
    };

    const setChannelId = (chanId: string) => {
      channelId.value = chanId;
    };

    provide("setChannelId", setChannelId);
    provide("channelId", channelId);

    return { device, pickDevice, setChannelId, channelId };
  },
});
</script>

<style lang="scss" scoped>
.play-container {
  max-width: 1000px;
  margin: 0 auto;
}
</style>
