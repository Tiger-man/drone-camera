<script lang="ts" setup>
import {
  computed,
  inject,
  nextTick,
  onMounted,
  onUnmounted,
  provide,
  reactive,
  ref,
  watch,
} from "vue";

import { Device } from ".";

import Service, { checkDeviceSyncStatusRequest } from "./service";

import flvjs from "mpegts.js";

const setChannelId = inject<(channelId: string) => void>("setChannelId");

const props = defineProps<{ device: Device }>();

// 播放器宽高比
const tracks: any = ref([]);

const aspectRatio = computed(() => {
  try {
    const tracksValue = tracks.value;
    if (!tracksValue) {
      throw Error("未读取到视频宽高");
    }
    const { width, height } = tracksValue[0];
    return `${width} / ${height}`;
  } catch (error) {
    return "640 / 480";
  }
});

watch(
  () => props.device,
  (val) => val && createPlayer(),
  { deep: true }
);

onMounted(() => {
  console.log("play parent mounted");
});

onUnmounted(() => {
  destroyPlayer();
});

const flvPlayerInstance = ref<any>(null);
const dPlayerInstance = ref<any>(null);
const destroy = ref<boolean>(false);

const destroyPlayer = () => {
  // TODO 判断播放器
  Service.abortFetch();
  flvPlayerInstance.value?.destroyPlayer?.();
  dPlayerInstance.value?.destroyPlayer?.();
  channelList.value = [];
  activeChannelId.value = "";
  destroy.value = true;
};

defineExpose({ destroyPlayer });

// 检查设备通道信息
const checkDeviceStatus = async (deviceId: string) => {
  try {
    // 查看信道是否是通的
    const { error: synErr, message: syncErrMsg } =
      await Service.checkDeviceSync(deviceId);

    if (synErr) {
      throw Error(syncErrMsg);
    }

    // 查看同步状态[checkDeviceSyncStatusRequest 内部存在多次调用]
    const syncObj = {
      ...Service,
      syncFlag: false,
      handleError: abnormalNotify,
    };
    const { error: syncStatusErr, message: syncStatusErrMsg } =
      await checkDeviceSyncStatusRequest(syncObj, deviceId);

    if (syncStatusErr) {
      throw Error(syncStatusErrMsg);
    }

    return { ready: true };
  } catch (error) {
    if (error instanceof Error) {
      abnormalNotify(error.message);
    }
    return { ready: false };
  }
};

const channelList = ref<any[]>([]);
const activeChannelId = ref<string>("");

const address = ref<{ flv: string; hls: string }>({ flv: "", hls: "" });
provide("address", address);

const createPlayer = async (channelId: string = "") => {
  destroy.value = false;
  if (!channelId) {
    channelList.value = [];
    activeChannelId.value = "";
  }

  setChannelId?.("");

  abnormalNotify("信道检查中...");

  // 清除上次未完成的请求
  Service.abortFetch();
  const { deviceId } = props.device;
  if (!deviceId) {
    abnormalNotify("请选择摄像头");
    return;
  }

  // 检查是否可以播放
  const { ready } = await checkDeviceStatus(deviceId);

  if (!ready || destroy.value) {
    console.warn(
      `无需执行后续代码: ready: ${ready}, destroy: ${destroy.value}`
    );
    return;
  }

  if (!channelId) {
    const {
      error: channelError,
      channelList: _channelList,
      message,
    } = await Service.getChannelList(deviceId);

    if (channelError) {
      abnormalNotify(message);
      return;
    }

    channelId = activeChannelId.value = _channelList[0]["id"];
    channelList.value = _channelList;
  }

  const {
    address: videoAddress,
    error: er2,
    message: msg2,
    tracks: newTracks,
  } = await Service.getVideoSource(deviceId, channelId);

  if (er2) {
    abnormalNotify(msg2);
    return;
  }

  setChannelId?.(channelId);

  if (newTracks) {
    tracks.value = newTracks;
  }

  console.log("set new address:", { ...videoAddress });
  address.value = { ...videoAddress };

  setTimeout(() => {
    closeAbnormal();
  }, 800);
};

const abnormal = reactive<{ visible: boolean; message: string }>({
  visible: false,
  message: "",
});

// 视频播放异常
const abnormalNotify = (msg: string = "视频播放失败!") => {
  abnormal.message = msg;
  nextTick(() => {
    abnormal.visible = true;
  });
};

// 隐藏异常提示
const closeAbnormal = () => {
  abnormal.visible = false;
  nextTick(() => {
    abnormal.message = "";
  });
};

const reload = () => window.location.reload();

const selectChannel = (event: { id: string }) => {
  const channelId = event.id;
  activeChannelId.value = channelId;
  createPlayer(channelId);
};

provide("channelList", channelList);

const currentPlayer = ref<string>(flvjs.isSupported() ? "flv" : "hls");

const togglePlayer = () => {
  currentPlayer.value = currentPlayer.value === "flv" ? "hls" : "flv";
};

provide("currentPlayer", currentPlayer);
</script>
<template>
  <div class="play-box" :style="{ aspectRatio }">
    <div v-show="abnormal.visible" class="video-mask">
      <span class="errorMsg">{{ abnormal.message }}</span>
      <van-space :size="10">
        <van-button type="success" size="small" @click="reload"
          >刷新页面</van-button
        >
        <!-- <van-button type="warning" size="small" @click="reCreatePlayer"
          >重新连接</van-button
        > -->
      </van-space>
    </div>
    <div class="video-instance">
      <div class="setting-area" v-if="address.flv || address.hls">
        <Setting @selectChannel="selectChannel" @togglePlayer="togglePlayer" />
      </div>

      <div class="player-instance-area">
        <flv-player v-if="currentPlayer === 'flv'" ref="flvPlayerInstance" />
        <hls-player v-else ref="dPlayerInstance" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.play-box {
  width: 100%;
  aspect-ratio: 640 / 480;
  max-height: 60vh;
  min-height: 220px;
  max-width: 1000px;
  background-color: #333;
  overflow: hidden;
  position: relative;
  margin: 0 auto;
  .video-mask {
    width: 100%;
    box-sizing: border-box;
    position: absolute;
    bottom: 0;
    border-top: 1px solid #4d4d4d;
    background-color: #333;
    padding: 4px 8px;
    min-height: 46px;
    // inset: 0;
    // margin: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-direction: row;
    z-index: 2;
    .errorMsg {
      font-size: var(--van-button-normal-font-size);
      color: #fff;
      flex: 1;
    }
  }
  .video-instance {
    width: 100%;
    height: 100%;
    position: relative;
    .player-instance-area {
      width: 100%;
      height: 100%;
      margin: 0 auto;
      position: relative;
      z-index: 1;
      .dplayer {
        width: 100%;
        height: 100%;
      }
    }
    .channel,
    .setting-area {
      position: absolute;
      right: 10px;
      top: 10px;
      z-index: 1000;
      color: var(--van-button-primary-color);
    }
  }
}
</style>
