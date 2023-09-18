<script lang="ts" setup>
import { showNotify } from "vant";
import { computed, ref, toRefs } from "vue";
import { Device } from ".";

import { useDeviceListStore } from "../../store";
const deviceListStore = useDeviceListStore();
const { deviceList } = toRefs(deviceListStore);

const emits = defineEmits<{
  (event: "pickDevice", data: Device): void;
}>();

const showPicker = ref<boolean>(false);

const handleError = (message: string) =>
  showNotify({ type: "warning", message });

const activeId = ref<string>();

const pickDevice = ({
  deviceId,
  online,
}: {
  deviceId: string;
  online: boolean;
}) => {
  if (!Boolean(online)) {
    handleError("设备不在线,无法点播！");
    return;
  }
  activeId.value = deviceId;
  showPicker.value = false;
  emits("pickDevice", { deviceId });
};

const pickerText = computed(() => {
  const isSelect = Boolean(activeId.value);
  return `${isSelect ? "切换" : "选择"}摄像头${
    isSelect ? "【" + activeId.value + "】" : ""
  }`;
});

const pickerType = computed(() => (activeId.value ? "success" : "primary"));

const openPicker = () => {
  if (deviceList.value.length) {
    showPicker.value = true;
  } else {
    handleError("暂无摄像头数据");
  }
};
</script>
<template>
  <van-button :type="pickerType" square block @click="openPicker">{{
    pickerText
  }}</van-button>

  <van-action-sheet
    v-model:show="showPicker"
    close-on-click-action
    cancel-text="取消"
    description="选择摄像头"
    :actions="deviceList"
    @select="pickDevice"
  />
</template>

<style lang="scss">
$offlineColor: var(--van-danger-color);
.offline {
  &:before {
    background-color: $offlineColor;
  }
}
.center-box {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
