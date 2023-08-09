<script lang="ts" setup>
defineProps<{
  className: string;
}>();

const emits = defineEmits<{
  (event: "up-event"): void;
  (event: "down-event"): void;
}>();

const touchStartEvent = (e: MouseEvent | TouchEvent) => {
  e.preventDefault();
  emits("down-event");
};

const touchEndEvent = (e: MouseEvent | TouchEvent) => {
  e.preventDefault();
  emits("up-event");
};
</script>
<template>
  <button
    :class="['handle-btn', className]"
    @touchstart="touchStartEvent"
    @touchend="touchEndEvent"
    @mousedown="touchStartEvent"
    @mouseup="touchEndEvent"
  >
    <slot />
  </button>
</template>

<style lang="scss" scoped>
.handle-btn {
  display: block;
  outline: none;
  user-select: none;
  border: none;
  background-color: transparent;
  padding: 0;
  &:active,
  &:focus {
    background-color: #c4c4c4;
  }
}
</style>
