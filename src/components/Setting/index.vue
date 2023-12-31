<script lang="ts" setup>
import { computed, inject, Ref, ref } from "vue";

import flvjs from "mpegts.js";

import devicePortMap from "../../config";
import { showNotify } from "vant";

const isSupportedFlv = flvjs.isSupported();

const channelList = inject<Ref<any[]>>("channelList");
const currentPlayer = inject<Ref<string>>("currentPlayer");

const actions = computed(() => {
  const list = channelList?.value || [];
  let newList: any = [];
  if (list.length > 1) {
    newList = list.map((channel) => {
      return { ...channel, name: "信道:" + channel.name };
    });
  }
  if (isSupportedFlv) {
    if (currentPlayer?.value === "flv") {
      newList.push({ name: "切换Hls源", alias: "source" });
    } else {
      newList.push({ name: "切换Flv源", subname: "延迟低", alias: "source" });
    }
  }
  newList.push({ name: "后台设置", subname: "推荐电脑端操作" });
  return newList;
});

const emits = defineEmits<{
  (event: "selectChannel", data: Record<string, any>): void;
  (event: "togglePlayer"): void;
}>();

const show = ref(false);
const onSelect = (item: Record<string, any>) => {
  // 默认情况下点击选项时不会自动收起
  // 可以通过 close-on-click-action 属性开启自动收起
  show.value = false;
  if (item.id) {
    // 点击信道
    emits("selectChannel", item);
    return;
  }
  if (item.alias === "source") {
    emits("togglePlayer");
    return;
  }
  // 打开后台设置
  openAdmin();
};

const openAdmin = () => {
  const deviceId = channelList?.value[0].deviceId;
  if (deviceId) {
    const port = devicePortMap[deviceId];
    if (port) {
      window.open(`http://39.106.4.50:${port}/doc/page/config.asp`, "_blank");
    } else {
      showNotify({ type: "warning", message: `未配置${deviceId}对应的端口！` });
    }
  } else {
    showNotify({ type: "warning", message: "未发现deviceId！" });
  }
};

const openSetting = () => {
  show.value = true;
};
</script>
<template>
  <van-action-sheet
    teleport="body"
    v-model:show="show"
    :actions="actions"
    @select="onSelect"
    cancel-text="取消"
    title="设置"
  />

  <div style="display: inline-block" @click="openSetting">
    <svg
      t="1692249063321"
      class="icon"
      viewBox="0 0 1024 1024"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      p-id="4489"
      width="30"
      height="30"
    >
      <path
        d="M878.177 396.379h-18.696a365.007 365.007 0 0 0-20.1-48.48l13.233-13.233c30.197-30.199 30.197-79.157 0-109.355l-54.676-54.676c-30.197-30.197-79.157-30.197-109.355 0l-13.233 13.233a364.916 364.916 0 0 0-48.479-20.1v-18.697c0-42.705-34.618-77.323-77.325-77.323H472.22c-42.704 0-77.325 34.618-77.325 77.323v18.697a364.981 364.981 0 0 0-48.478 20.1l-13.233-13.233c-30.199-30.197-79.157-30.197-109.357 0l-54.676 54.676c-30.195 30.197-30.195 79.155 0 109.355l13.234 13.234a364.939 364.939 0 0 0-20.1 48.479H143.59c-42.705 0-77.325 34.618-77.325 77.323v77.325c0 42.708 34.62 77.325 77.325 77.325h18.697a364.981 364.981 0 0 0 20.1 48.478l-13.235 13.235c-30.195 30.197-30.195 79.157 0 109.355l54.676 54.678c30.199 30.197 79.157 30.197 109.357 0l13.234-13.235a365.006 365.006 0 0 0 48.476 20.099v18.697c0 42.705 34.62 77.323 77.325 77.323h77.325c42.706 0 77.325-34.618 77.325-77.323v-18.697a364.981 364.981 0 0 0 48.478-20.1l13.235 13.235c30.197 30.197 79.157 30.197 109.355 0l54.676-54.678c30.197-30.197 30.197-79.157 0-109.355L839.38 676.83a364.916 364.916 0 0 0 20.1-48.479h18.697c42.705 0 77.323-34.616 77.323-77.325v-77.325c0-42.704-34.618-77.322-77.323-77.322z m38.661 154.648c0 21.355-17.309 38.664-38.66 38.664h-47.815c-8.105 33.603-21.375 65.19-38.922 93.878l28.042 28.042 5.794 5.794c15.098 15.098 15.098 39.577 0 54.676l-54.676 54.676c-15.1 15.1-39.579 15.1-54.676 0l-33.845-33.845c-28.686 17.539-60.271 30.804-93.869 38.908v47.838c0 21.351-17.309 38.662-38.664 38.662H472.22c-21.351 0-38.662-17.311-38.662-38.662V831.82a326.767 326.767 0 0 1-93.868-38.907l-33.844 33.844c-15.102 15.1-39.581 15.1-54.678 0l-54.676-54.676c-15.1-15.1-15.1-39.579 0-54.676l33.834-33.834c-17.547-28.688-30.817-60.276-38.923-93.879H143.59c-21.353 0-38.66-17.309-38.66-38.664v-77.325c0-21.351 17.307-38.662 38.66-38.662h47.813c8.105-33.603 21.375-65.19 38.922-93.878l-28.041-28.041-5.792-5.792c-15.1-15.1-15.1-39.581 0-54.678l54.676-54.676c15.098-15.098 39.577-15.098 54.678 0l33.843 33.844c28.686-17.539 60.271-30.804 93.868-38.907v-47.838c0-21.353 17.311-38.66 38.662-38.66h77.325c21.355 0 38.664 17.307 38.664 38.66v47.838c33.598 8.104 65.182 21.369 93.869 38.908l33.845-33.845c15.098-15.098 39.577-15.098 54.676 0l54.676 54.676c15.098 15.098 15.098 39.579 0 54.678l-33.834 33.834c17.546 28.688 30.816 60.275 38.921 93.877h47.815c21.351 0 38.66 17.311 38.66 38.662v77.324zM510.883 435.04c-42.705 0-77.325 34.62-77.325 77.325 0 42.706 34.62 77.327 77.325 77.327 42.706 0 77.327-34.62 77.327-77.327-0.001-42.705-34.621-77.325-77.327-77.325z m0 115.987c-21.351 0-38.662-17.309-38.662-38.662 0-21.351 17.311-38.662 38.662-38.662 21.353 0 38.662 17.311 38.662 38.662 0 21.352-17.309 38.662-38.662 38.662z m0-231.975c-106.762 0-193.312 86.55-193.312 193.312 0 106.764 86.55 193.312 193.312 193.312 106.764 0 193.312-86.548 193.312-193.312 0-106.762-86.548-193.312-193.312-193.312z m0 347.964c-85.411 0-154.649-69.24-154.649-154.651s69.238-154.649 154.649-154.649 154.651 69.239 154.651 154.649-69.24 154.651-154.651 154.651z"
        p-id="4490"
        fill="#07c160"
      ></path>
    </svg>
  </div>
</template>
