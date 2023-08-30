<script setup lang="ts">
import Player from "@/components/play/index.vue";
import MapView from "@/components/MapView/index.vue";
import { computed, onMounted, ref } from "vue";
import { useDeviceListStore } from "./store";
const deviceListStore = useDeviceListStore();

const model = ref<number>(1);
const toggleModel = () => {
  model.value = 3 - model.value;
  localStorage.setItem("model", model.value.toString());
};

onMounted(() => {
  deviceListStore.requestDeviceList();
  const local = Number(localStorage.getItem("model"));
  model.value = local == 1 || local == 2 ? local : 1;
});

const modelStyle = computed(() =>
  model.value === 1
    ? { right: "0px", top: "0px", opacity: 1 }
    : { left: "2px", bottom: "2px" }
);
</script>

<template>
  <van-floating-bubble
    axis="xy"
    magnetic="x"
    :icon="model == 1 ? 'eye' : 'location'"
    @click="toggleModel"
  />
  <div class="device-msg" :style="modelStyle">
    <DeviceInfo />
  </div>

  <MapView v-if="model == 1" />
  <Player v-if="model == 2" />
</template>

<style lang="scss">
.device-msg {
  position: fixed;
  z-index: 2;
  opacity: 0.5;
}
</style>
