<script lang="ts" setup>
import { computed, inject, onMounted, onUnmounted, ref, watch } from "vue";
import FlvExtend from "flv-extend";
import type { FlvExtend as FlvExtendTypes } from "flv-extend";
import { closeNotify, NotifyType, showNotify } from "vant";

import flvjs from "mpegts.js";

import { Device } from ".";

import Service, { checkDeviceSyncStatusRequest } from "./service";

const setChannelId = inject<(channelId: string) => void>("setChannelId");

const props = defineProps<{ device: Device }>();

const handleError = (message: string, type: NotifyType = "warning") => {
  if (destroy.value) return;

  showNotify({ type, message });
};

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
  console.log("paly instance modal mounted");
});

let flv: null | FlvExtend = null;
let playerInstance: null | FlvExtendTypes.Player = null;

const flvSettings = {
  withCredentials: false,
  hasAudio: false,
};

const extendSettings: Partial<FlvExtendTypes.Options> = {
  frameTracking: true, // 追帧设置
  updateOnStart: true, // 点击播放按钮后实时更新视频
  updateOnFocus: true, // 回到前台后实时更新
  reconnect: true, // 断流后重连
  maxReconnectAttempts: 5,
  reconnectInterval: 2000, // 重连间隔(ms)
  trackingDelta: 2, // 追帧最大延迟
  showLog: false,
};

onUnmounted(() => {
  destroyPlayer();
});

const destroy = ref<boolean>(false);

const destroyPlayer = () => {
  Service.abortFetch();
  flv && flv.destroy();
  channelList.value = [];
  activeChannelId.value = "";
  destroy.value = true;
  closeNotify();
  console.log("销毁播放器实例");
};

defineExpose({ destroyPlayer });

const videoError = ref<boolean>(false);
const videoErrorMsg = ref<string>("视频播放失败");
const loading = ref<boolean>(false);

// 在检查视频是否可以播放中捕获到异常
const catchError = (message: string) => {
  handleVideoError(message);
};

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
      handleError: catchError,
    };
    const { error: syncStatusErr, message: syncStatusErrMsg } =
      await checkDeviceSyncStatusRequest(syncObj, deviceId);

    if (syncStatusErr) {
      throw Error(syncStatusErrMsg);
    }

    return { ready: true };
  } catch (error) {
    if (error instanceof Error) {
      catchError(error.message);
    }
    return { ready: false };
  }
};

const channelList = ref<any[]>([]);
const activeChannelId = ref<string>("");

const createPlayer = async (channelId: string = "") => {
  if (!channelId) {
    channelList.value = [];
    activeChannelId.value = "";
  }

  destroy.value = false;
  setChannelId?.("");

  videoError.value = false;
  videoErrorMsg.value = "信道检查中...";
  loading.value = true;

  // 清除上次未完成的请求
  Service.abortFetch();
  const { deviceId } = props.device;
  if (!deviceId) {
    catchError("请选择摄像头");
    return;
  }

  // 检查是否可以播放
  const { ready } = await checkDeviceStatus(deviceId);
  const readyMsg = ready
    ? "视频通道连接正常,准备播放!"
    : "视频通道连接不通,请稍后重试!";

  handleError(readyMsg, ready ? "success" : "danger");

  if (!ready) return;
  if (destroy.value) return;

  if (!channelId) {
    const {
      error: channelError,
      channelList: _channelList,
      message,
    } = await Service.getChannelList(deviceId);

    if (channelError) {
      catchError(message);
      return;
    }

    channelId = activeChannelId.value = _channelList[0]["id"];
    channelList.value = _channelList;
  }

  const {
    address,
    error: er2,
    message: msg2,
    tracks: newTracks,
  } = await Service.getVideoSource(deviceId, channelId);

  if (er2) {
    handleVideoError(msg2);
    return;
  }

  setChannelId?.(channelId);

  if (newTracks) {
    tracks.value = newTracks;
  }

  if (destroy.value) return;

  const media = {
    mediaDataSource: {
      type: "flv",
      url: address,
      isLive: true,
      ...flvSettings,
    },
    config: {
      enableStashBuffer: false, // 是否启用IO隐藏缓冲区。如果您需要实时（最小延迟）来进行实时流播放，则设置为false
      autoCleanupSourceBuffer: true,
    },
  };

  if (flv) {
    flv.destroy();
    flv = null;
  }

  const element = document.getElementById("video") as HTMLElement;

  if (!element) {
    handleError("Video实例获取失败");
    return;
  }

  flv = new FlvExtend({ element, ...extendSettings });

  playerInstance = flv.init(media.mediaDataSource, media.config);

  const playCallBack = () => {
    console.log("video play back");
    loading.value = false;
    videoError.value = false;
    flv?.videoElement.removeEventListener("play", playCallBack);
  };

  flv.videoElement.addEventListener("play", playCallBack);

  playerInstance.play();

  // 绑定事件回调
  flv.onStatisticsInfo = (_data) => {
    // console.log("onStatisticsInfo:", data);
  };

  // 视频卡顿住
  flv.onStuck = () => {
    console.log(
      `视频卡顿被触发了【loading:${loading.value}】【error: ${videoError.value}】`
    );
    handleVideoError("视频卡顿，无法正常播放");
  };

  flv.onError = (err) => {
    handleVideoError(err.type);
  };

  flv.onReconnect = ({ reconnectAttempts }) => {
    handleError(`尝试第${reconnectAttempts}次重连...`);
  };

  flv.onReconnectFailed = () => {
    console.log("onReconnectFailed:", ``);
    handleVideoError("重连失败，请检查网络环境!");
  };

  flv.onProgress = (_event: never) => {
    // progress信息
  };

  playerInstance.on(flvjs.Events.LOADING_COMPLETE, (_res) => {
    console.log("video LOADING_COMPLETE");
    handleVideoError("视频流接收结束");
  });
};

//

// 视频播放异常
const handleVideoError = (msg: string = "视频播放失败!") => {
  if (destroy.value) return;
  loading.value = false;
  videoErrorMsg.value = msg;
  videoError.value = true;
};

const reload = () => window.location.reload();
const reCreatePlayer = () => createPlayer();

const selectChannel = (event: { id: string }) => {
  console.log("event:", event);
  const channelId = event.id;
  activeChannelId.value = channelId;
  createPlayer(channelId);
};

const activeChannelName = computed(
  () =>
    channelList.value.find((row) => row.id === activeChannelId.value)?.name ||
    "切换通道"
);
</script>
<template>
  <div class="play-box" :style="{ aspectRatio }">
    <div v-show="videoError || loading" class="video-mask">
      <template v-if="videoError">
        <span class="errorMsg">{{ videoErrorMsg }}</span>
        <van-space :size="10" style="flex-basis: 145px">
          <van-button type="success" size="small" @click="reload"
            >刷新页面</van-button
          >
          <van-button type="warning" size="small" @click="reCreatePlayer"
            >重新连接</van-button
          >
        </van-space>
      </template>
      <template v-if="loading">
        <span class="errorMsg">{{ videoErrorMsg || "视频连接中..." }}</span>
      </template>
    </div>
    <div class="video-instance">
      <div v-if="channelList.length" class="channel">
        <van-popover
          v-if="channelList.length > 1"
          :actions="channelList"
          @select="selectChannel"
          :show-arrow="false"
          overlay
          theme="dark"
          placement="bottom-end"
        >
          <template #reference>
            <span style="font-size: 12px; opacity: 0.8">{{
              activeChannelName
            }}</span>
          </template>
        </van-popover>
        <span v-else style="font-size: 12px; opacity: 0.8">{{
          activeChannelName
        }}</span>
      </div>
      <video
        id="video"
        autoplay
        :controls="true"
        :muted="true"
        preload="none"
      />
    </div>
  </div>
</template>

<style>
/* 隐藏视频控制条 */
/* video::-webkit-media-controls {
  display: none;
} */
/* video::-webkit-media-controls-panel {
  display: none;
} */
video::-webkit-media-controls-play-button,
video::-webkit-media-controls-start-playback-button {
  display: none !important;
}
video::-webkit-media-controls-timeline {
  display: none !important;
}
</style>

<style lang="scss" scoped>
.play-box {
  width: 100%;
  aspect-ratio: 640 / 480;
  max-height: 60vh;
  max-width: 1000px;
  background-color: #000;
  overflow: hidden;
  position: relative;
  margin: 0 auto;
  .video-mask {
    width: 100%;
    box-sizing: border-box;
    position: absolute;
    bottom: 0;
    border-top: 1px solid #4d4d4d;
    background-color: #000;
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
    #video {
      width: 100%;
      height: 100%;
      margin: 0 auto;
      // display: block;
      position: absolute;
      z-index: 1;
      object-fit: contain;
    }
    .channel {
      position: absolute;
      right: 10px;
      top: 10px;
      z-index: 2;
      color: var(--van-button-primary-color);
    }
  }
}
</style>
