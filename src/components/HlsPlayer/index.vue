<script lang="ts" setup>
import Hls from "hls.js";
import DPlayer from "dplayer";

import { inject, onMounted, onUnmounted, Ref, watch } from "vue";
import { Address } from "..";

const address = inject<Ref<Address>>("address");

const emits = defineEmits<{
  (event: "play-error", message: string): void;
}>();

watch(
  () => address,
  () => {
    console.log("hls watch address change, will reCreate player");
    createPlayer();
  },
  { deep: true }
);

let player: any = null;
let hlsInstance: any = null;

const destroyPlayer = () => {
  console.log("销毁hls DPlayer.js播放器");
  player && player.destroy();
  player = null;
  hlsInstance && hlsInstance.destroy();
  hlsInstance = null;
};

defineExpose({ destroyPlayer });

onMounted(() => {
  createPlayer();
});

onUnmounted(() => {
  destroyPlayer();
});

const createPlayer = async () => {
  const hls = address?.value.hls;
  if (!hls) return;
  console.log("create hls player address is: ", hls);
  const container = document.getElementById("dplayer");
  if (!container) {
    monitorPlayerError("视频容器获取失败！");
    return;
  }
  if (player) {
    destroyPlayer();
    player = null;
  }

  let timer: NodeJS.Timer = setInterval(() => {
    try {
      document.getElementsByClassName(
        "dplayer-live-badge"
      )[0].innerHTML = `<span class="dplayer-live-dot" style="background: #b7daff;"></span>直播HLS`;
      clearInterval(timer);
    } catch (_error) {}
  }, 100);

  player = new DPlayer({
    container,
    autoplay: true,
    hotkey: true,
    live: true,
    video: {
      url: hls,
      type: "customHls",
      customType: {
        customHls: (video: any) => {
          hlsInstance = new Hls();
          hlsInstance.loadSource(video.src);
          hlsInstance.attachMedia(video);
        },
      },
    },
  });

  player.on("canplay", function () {
    player.play();
  });
  player.on("error", (e: any) => {
    console.log("play error event:", e);
  });
};

// 检测到播放器异常提示
const monitorPlayerError = (msg: string = "视频播放失败!") => {
  // 传递事件
  emits("play-error", msg);
};

const contextmenu = (event: Event) => {
  event.stopPropagation();
  event.preventDefault();
};
</script>

<template>
  <div id="dplayer" @contextmenu="contextmenu" />
</template>

<style>
.dplayer-controller .dplayer-icons .dplayer-full .dplayer-full-in-icon {
  display: none !important;
}
</style>
