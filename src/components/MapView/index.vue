<script lang="ts" setup>
import "@amap/amap-jsapi-types";
import { Device } from "../play";
import PlayInstance from "../play/PlayInstance.vue";
import * as AMapLoader from "@amap/amap-jsapi-loader";
import { shallowRef } from "@vue/reactivity";
import { showNotify } from "vant";
import {
  nextTick,
  onMounted,
  onUnmounted,
  provide,
  ref,
  toRefs,
  watch,
} from "vue";

const centerLngLatList: [number, number] = [112.115037, 21.666972];

const defaultLngLatList = [
  [112.110247, 21.660825],
  [112.087895, 21.611638],
  [112.140354, 21.571767],
  [112.178216, 21.623936],
  [112.15039, 21.54419],
  [112.172286, 21.567524],
  [112.221552, 21.608669],
  [112.05277, 21.610365],
  [112.206955, 21.618847],
  [112.154039, 21.659129],
];

import { useDeviceListStore } from "../../store";

const mapInstance = shallowRef<AMap.Map | null>(null);

const playerInstance = ref<typeof PlayInstance | null>(null);
const device = ref<Device>({ deviceId: "", name: "" });
const show = ref<boolean>(false);

const channelId = ref<string>("");
const setChannelId = (chanId: string) => {
  channelId.value = chanId;
};

provide("setChannelId", setChannelId);
provide("channelId", channelId);

const deviceListStore = useDeviceListStore();
const { deviceList } = toRefs(deviceListStore);

const initMap = async () => {
  const loaderOPtion = {
    key: "0b856d5ac5313df7326dc999b8cc1afc",
    version: "2.0",
    plugins: [""],
  };
  try {
    const AMap = await AMapLoader.load(loaderOPtion);
    const mapOption: AMap.MapOptions = {
      viewMode: "3D",
      // pitch: 83,
      // terrain: true,
      zoom: 11.9,
      center: centerLngLatList, //初始化地图中心点位置
    };
    mapInstance.value = new AMap.Map("map-container", mapOption);
    mapListener();
    setMarker();
  } catch (error) {}
};

const mapListener = () => {
  if (!mapInstance.value) return;
  mapInstance.value.on("click", (ev: any) => {
    const {
      lnglat: { lng, lat },
    } = ev;
    console.log("点击的ev:", ev);
    console.log("点击的经纬度是:", `${lng}, ${lat}`);
    const zoom = mapInstance.value?.getZoom();
    console.log("当前地图缩放等级为:", zoom);
  });
};

const setMarker = () => {
  const map = mapInstance.value;
  if (!map) return;
  const addMarker = (device: Record<string, any>, index: number) => {
    const icon = new AMap.Icon({
      size: new AMap.Size(60, 60),
      image:
        "https://gaoguantong.ruitong369.com/GaoGuanTongServer/gaoguantongHTML/img/direction/gaoguantong/map/camera" +
        (device.online ? "" : "_error") +
        ".png", // Icon的图像
      // imageOffset: new AMap.Pixel(0, -60), // 图像相对展示区域的偏移量，适于雪碧图等
      imageSize: new AMap.Size(60, 60), // 根据所设置的大小拉伸或压缩图片
    });
    // 将 Icon 实例添加到 marker 上:
    const [lng, lat] = defaultLngLatList[index];
    const marker = new AMap.Marker({
      position: new AMap.LngLat(lng, lat),
      offset: new AMap.Pixel(-10, -10),
      icon: icon,
      title: device.name || "摄像机",
    });

    marker.setLabel({
      offset: new AMap.Pixel(0, -10), //设置文本标注偏移量
      content: `<div class='marker-name'>${device.name || "摄像机"}</div>`, //设置文本标注内容
      direction: "bottom", //设置文本标注方位
    });

    marker.on("click", (_ev: any) => {
      console.log("marker click:", lng, lat);
      if (!device.online) {
        showNotify({ message: "设备不在线,无法点播！", type: "warning" });
        return;
      }
      pickDevice(device.deviceId, device.name);
    });
    map.add(marker);
  };
  map.clearMap();

  console.log("new deviceList marker will redraws");

  deviceList.value.forEach((device, index) => {
    addMarker(device, index);
  });
};

const pickDevice = (deviceId: string, name: string) => {
  show.value = true;
  nextTick(() => {
    device.value = { deviceId, name };
  });
};
const destroyPlayer = () => {
  playerInstance.value?.destroyPlayer?.();
  return true;
};

onMounted(() => {
  initMap();
});

onUnmounted(() => {
  console.log("卸载地图");
  mapInstance.value?.destroy();
});

watch(() => deviceList.value, setMarker);
</script>
<template>
  <div>
    <div id="map-container"></div>

    <van-dialog
      v-model:show="show"
      style="width: 96%; max-width: 1000px; border-radius: none"
      :show-confirm-button="false"
      :closeOnClickOverlay="true"
      @closed="destroyPlayer"
      :title="'[' + device.name + ']' + '实时影像'"
    >
      <PlayInstance ref="playerInstance" :device="device" />
    </van-dialog>
  </div>
</template>

<style lang="scss">
.van-dialog {
  border-radius: 10px;
  .van-dialog__header {
    padding: 8px 0 4px;
  }
}
.amap-marker-label {
  background-color: transparent;
  border: none;
  .marker-name {
    color: rgba(0, 0, 0, 0.5);
  }
}
</style>

<style scoped>
#map-container {
  padding: 0px;
  margin: 0px;
  width: 100%;
  height: 100vh;
}
</style>
