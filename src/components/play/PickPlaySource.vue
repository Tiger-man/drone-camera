<script lang="ts" setup>
import { getDeviceList, getChannelList } from "@/api";
import { showNotify } from "vant";
import { computed, ref, watch } from "vue";
import { Device } from ".";

const emits = defineEmits<{
  (event: "pickDevice", data: Device): void;
}>();

const showPicker = ref<boolean>(false);

const openPopup = () => {
  showPicker.value = true;
};

const handleError = (message: string) =>
  showNotify({ type: "warning", message });

const activeId = ref<string>();
const activeIndex = ref<number>(0);

const deviceList = ref<any[]>([]);
const deviceLoading = ref<boolean>(false);

let lastController1: null | AbortController = null;
let lastController2: null | AbortController = null;

watch(showPicker, (val) => {
  if (val) {
    setDeviceList();
  } else {
    // 关闭未完成的请求
    lastController1?.abort();
    lastController1 = null;
    lastController2?.abort();
    lastController2 = null;
  }
});

const setDeviceList = async () => {
  deviceList.value = [];
  deviceLoading.value = true;
  try {
    const { request, controller } = getDeviceList();
    lastController1 = controller;
    const response = await request();
    if (response.code === 0) {
      const dataList = response.data.list as Array<any>;

      deviceList.value = dataList.map((item: any) => ({
        ...item,
        text: item.name,
        id: item.deviceId,
        className: item.online ? "online" : "offline",
      }));

      const defaultDevice = dataList[0];
      if (defaultDevice) {
        setChannelList(defaultDevice.deviceId);
      }
    } else {
      throw Error(response.msg || "DeviceList获取失败");
    }
  } catch (e: any) {
    handleError(e.message || e);
    showPicker.value = false;
  }

  deviceLoading.value = false;
};

watch(activeIndex, (index) => {
  const { deviceId } = deviceList.value[index];
  setChannelList(deviceId);
});

const setChannelList = async (deviceId: string) => {
  try {
    const { request, controller } = getChannelList(deviceId);
    lastController2 = controller;
    const response = await request();
    if (response.code === 0) {
      const dataList = response.data.list as Array<any>;
      const index = deviceList.value.findIndex(
        (row) => row.deviceId === deviceId
      );
      if (index > -1) {
        deviceList.value[index]["children"] = dataList.map((item: any) => ({
          ...item,
          text: `${item.name}[播放该源]`,
          id: item.id,
        }));
      }
    } else {
      throw Error(response.msg || "Channel获取失败");
    }
  } catch (e: any) {
    handleError(e.message || e);
  }
};

const pickDeviceChannel = ({
  deviceId,
  id: channelId,
}: {
  deviceId: string;
  id: string;
}) => {
  const deviceStatus = deviceList.value.find(
    (device) => device.deviceId === deviceId
  )?.["online"];

  if (!deviceStatus) {
    activeId.value = "";
    handleError("摄像头离线,请检查网络！");
    return;
  }

  showPicker.value = false;

  emits("pickDevice", { deviceId, channelId });
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
  <van-button :type="pickerType" square block @click="openPopup">{{
    pickerText
  }}</van-button>

  <van-popup
    v-model:show="showPicker"
    position="bottom"
    :style="{ width: '100%', height: '50%' }"
    :closeable="false"
  >
    <template v-if="deviceLoading">
      <div class="center-box">
        <van-loading color="#1989fa" vertical>查询设备列表中...</van-loading>
      </div>
    </template>
    <template v-else>
      <template v-if="deviceList.length">
        <van-tree-select
          style="height: 50vh"
          v-model:active-id="activeId"
          v-model:main-active-index="activeIndex"
          :items="deviceList"
          @click-item="pickDeviceChannel"
        />
      </template>
      <template v-else>
        <div class="center-box">
          <van-empty description="暂无设备信息!" />
        </div>
      </template>
    </template>
  </van-popup>
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
