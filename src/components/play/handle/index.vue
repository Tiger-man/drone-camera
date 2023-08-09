<script lang="ts" setup>
import { controlCamera } from "@/api";
import { closeNotify, NotifyOptions, showNotify } from "vant";
import { inject, Ref, ref } from "vue";

import "./index.scss";

import HandleBtn from "./HandleBtn.vue";

import { Device } from "../index";

import { ControlMenu } from ".";

const channelOk = inject<Ref<boolean>>("channelOk");

const props = defineProps<{ device: Device }>();

const controlSpeed = ref<number>(50);

const handleError = (message: string, option: NotifyOptions = {}) =>
  showNotify({ type: "warning", message, ...option });

const ptzCamera = async (command: string) => {
  const { deviceId, channelId } = props.device;
  if (!deviceId || !channelId) {
    handleError("请选择视频源", { duration: 800 });
    return;
  }

  if (!channelOk?.value) {
    handleError("无法移动,摄像机通道未联通！");
    return;
  }

  if (command !== "stop") {
    handleError("摄像机移动中...", { duration: 0 });
  } else {
    closeNotify();
  }

  try {
    const response = await controlCamera({
      deviceId,
      channelId,
      command,
      controlSpeed: controlSpeed.value,
    });
    if (response.code !== 0) {
      throw Error(response.msg);
    }
  } catch (error) {
    if (error instanceof Error) {
      handleError(error.message);
    }
  }
};
</script>
<template>
  <van-notice-bar text="操作摄像头时,因网络原因可能存在延时,请缓慢操作！" />
  <div class="handle-wrapper">
    <div class="control-row">
      <div class="control-full">
        <div class="control-wrapper">
          <HandleBtn
            v-for="control of ControlMenu"
            :key="control.id"
            :class-name="'control-btn ' + control.className"
            @down-event="() => ptzCamera(control.id)"
            @up-event="() => ptzCamera('stop')"
          >
            <template v-if="control.id === 'stop'">
              <div class="control-round-inner">
                <van-icon name="pause" size="50px" />
              </div>
            </template>
            <template v-else>
              <van-icon name="play" />
              <div class="control-inner-btn control-inner"></div>
            </template>
          </HandleBtn>
        </div>
      </div>

      <div class="control-zoom-wrapper">
        <HandleBtn
          class-name=""
          @down-event="() => ptzCamera('zoomin')"
          @up-event="() => ptzCamera('stop')"
        >
          <van-button square plain type="primary" icon="plus" />
        </HandleBtn>

        <HandleBtn
          class-name=""
          @down-event="() => ptzCamera('zoomout')"
          @up-event="() => ptzCamera('stop')"
        >
          <van-button square plain type="primary" icon="minus" />
        </HandleBtn>
      </div>
    </div>

    <div class="control-speed" style="padding: 1.5rem">
      <van-slider v-model="controlSpeed" :step="10" :max="120" />
    </div>
  </div>
</template>
