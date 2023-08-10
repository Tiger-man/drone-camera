<script lang="ts" setup>
import { getDeviceList } from "@/api";
import { closeToast, showLoadingToast, showNotify } from "vant";
import { computed, ref, watch } from "vue";
import { Device } from ".";

const emits = defineEmits<{
  (event: "pickDevice", data: Device): void;
}>();

const showPicker = ref<boolean>(false);

const handleError = (message: string) =>
  showNotify({ type: "warning", message });

const activeId = ref<string>();

const deviceList = ref<any[]>([]);

let lastController1: null | AbortController = null;

watch(showPicker, (val) => {
  if (val) {
    getDeviceListEvent();
  } else {
    // 关闭未完成的请求
    lastController1?.abort();
    lastController1 = null;
  }
});

const getDeviceListEvent = async () => {
  showLoadingToast({
    duration: 0,
    message: "获取中...",
  });
  try {
    const { request, controller } = getDeviceList();
    lastController1 = controller;
    const response = await request();
    if (response.code === 0) {
      const dataList = response.data.list as Array<any>;

      deviceList.value = dataList.map((item: any) => ({
        ...item,
        name: item.name + (Boolean(item.online) ? "" : "[离线]"),
      }));

      showPicker.value = true;
    } else {
      throw Error(response.msg || "DeviceList获取失败");
    }
  } catch (e: any) {
    handleError(e.message || e);
  }
  closeToast();
};

const pickDevice = ({
  deviceId,
  online,
}: {
  deviceId: string;
  online: boolean;
}) => {
  if (!Boolean(online)) {
    handleError("摄像头离线,请检查网络！");
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
</script>
<template>
  <van-button :type="pickerType" square block @click="getDeviceListEvent">{{
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
