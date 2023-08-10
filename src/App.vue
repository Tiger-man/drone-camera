<script setup lang="ts">
import Player from "@/components/play/index.vue";
import MapView from "@/components/MapView/index.vue";
import { onMounted, ref } from "vue";

const model = ref<number>(1);
const toggleModel = () => {
  model.value = 3 - model.value;
  localStorage.setItem("model", model.value.toString());
};

onMounted(() => {
  const local = Number(localStorage.getItem("model"));
  model.value = local == 1 || local == 2 ? local : 1;
});
</script>

<template>
  <van-floating-bubble
    axis="xy"
    magnetic="x"
    :icon="model == 1 ? 'eye' : 'location'"
    @click="toggleModel"
  />
  <MapView v-if="model == 1" />
  <Player v-if="model == 2" />
</template>

<style lang="scss">
.model {
  position: fixed;
  bottom: 0;
}
</style>
