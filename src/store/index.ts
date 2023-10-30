import { getDeviceList } from '@/api';
import { createPinia, defineStore } from 'pinia'

export const useDeviceListStore = defineStore({
  id: 'deviceList',
  state: () => ({
    lastControl: null as unknown as AbortController,
    deviceList: [] as any[]
  }),
  getters: {
    onlineNum(state): number {
      return state.deviceList.filter((device: { online: any }) => Boolean(device.online)).length;
    },
    offlineNum(state): number {
      const onlineNum = useDeviceListStore().onlineNum;
      const offlineNum = state.deviceList.length - onlineNum
      return Math.max(offlineNum, 0);
    },
  },
  actions: {
    async getDeviceListAction() {
      console.log("查询设备数据")
      if (this.lastControl) {
        this.lastControl.abort()
      }
      const { request, controller } = getDeviceList();
      this.lastControl = controller
      const response = await request();
      if (response.code === 0) {
        const list = response.data.list as Record<string, any>[];
        this.deviceList = list.map(device => ({ ...device, name: device.name + (device.online ? '' : '[离线]') }))
      }
      console.log("newest deviceList:", this.deviceList)
    },
    requestDeviceList() {
      this.getDeviceListAction()
      setInterval(this.getDeviceListAction, .25 * 60 * 1000)
    }
  }
})

const pinia = createPinia()
export default pinia
