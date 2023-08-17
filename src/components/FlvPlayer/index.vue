<script lang="ts" setup>
import { onMounted, onUnmounted, watch, inject, Ref } from "vue";
import FlvExtend from "flv-extend";
import type { FlvExtend as FlvExtendTypes } from "flv-extend";
import DPlayer from "dplayer";

import { Address } from "..";

const address = inject<Ref<Address>>("address");

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
  showLog: true,
};

const emits = defineEmits<{
  (event: "play-error", message: string): void;
}>();

watch(
  () => address,
  () => {
    console.log("flv watch address change, will reCreate player");
    createPlayer();
  },
  { deep: true }
);

let dPlayerInstance: any = null;
let flvInstance: null | FlvExtend = null;

const destroyPlayer = () => {
  flvInstance && flvInstance.destroy();
  flvInstance = null;
  console.log("销毁flv DPlayer.js播放器");
  dPlayerInstance && dPlayerInstance.destroy();
  dPlayerInstance = null;
};

defineExpose({ destroyPlayer });

onMounted(() => {
  createPlayer();
});

onUnmounted(() => {
  destroyPlayer();
});

const createPlayer = async () => {
  const flv = address?.value.flv;
  if (!flv) return;
  console.log("create flv player address is ", flv);
  const container = document.getElementById("dplayerFlv");
  if (!container) {
    monitorPlayerError("视频容器获取失败！");
    return;
  }
  if (dPlayerInstance) {
    destroyPlayer();
    dPlayerInstance = null;
  }
  dPlayerInstance = new DPlayer({
    container,
    autoplay: true,
    hotkey: false,
    live: true,
    contextmenu: [
      {
        text: "custom1",
        link: "https://github.com/DIYgod/DPlayer",
      },
    ],
    video: {
      url: flv,
      type: "customFlv",
      customType: {
        customFlv: (video: any) => {
          const media = {
            mediaDataSource: {
              type: "flv",
              url: flv,
              isLive: true,
              ...flvSettings,
            },
            config: {
              enableStashBuffer: false, // 是否启用IO隐藏缓冲区。如果您需要实时（最小延迟）来进行实时流播放，则设置为false
              autoCleanupSourceBuffer: true,
            },
          };

          if (flvInstance) {
            flvInstance.destroy();
            flvInstance = null;
          }

          flvInstance = new FlvExtend({ element: video, ...extendSettings });

          flvInstance.init(media.mediaDataSource, media.config);

          // playerInstance.play();

          let isStuck = false;

          if (flvInstance) {
            // 视频卡顿住[会持续触发]
            flvInstance.onStuck = () => {
              if (isStuck) return;
              isStuck = true;
              monitorPlayerError("视频卡顿了···");
            };

            flvInstance.onError = (err) => {
              monitorPlayerError(err.type);
            };

            flvInstance.onReconnect = ({ reconnectAttempts }) => {
              monitorPlayerError(`尝试第${reconnectAttempts}次重连...`);
            };

            flvInstance.onReconnectFailed = () => {
              console.log("onReconnectFailed:", ``);
              monitorPlayerError("重连失败，请检查网络环境!");
            };

            flvInstance.onProgress = (_event: never) => {
              isStuck = false;
              // progress信息
            };
          }
        },
      },
    },
  });

  dPlayerInstance.on("canplay", function () {
    dPlayerInstance.play();
  });
  dPlayerInstance.on("error", (e: any) => {
    console.log("play error event:", e);
  });
};

// 检测到播放器异常提示
const monitorPlayerError = (msg: string = "视频播放失败!") => {
  // 传递事件
  emits("play-error", msg);
};
</script>

<template>
  <div id="dplayerFlv" />
</template>

<style>
/* .dplayer-full {
  display: none !important;
} */

.dplayer-controller .dplayer-icons .dplayer-full .dplayer-full-in-icon {
  display: none !important;
}
</style>
