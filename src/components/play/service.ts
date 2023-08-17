import { checkDeviceSync, checkDeviceSyncStatus, getChannelList, startChannel } from "@/api";

type methods = 'checkDeviceSync' | 'getVideoSource' | 'abortFetch' | 'getChannelList'

type Service = {
  [key in methods]: any;
} & {
  controller: AbortController[];
};

type SyncService = Service & {
  syncFlag: boolean
  handleError: (msg: string) => void
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const Service: Service = {
  controller: [],
  abortFetch: function () {
    this.controller.forEach(controller => controller.abort())
    this.controller = []
  },
  checkDeviceSync: async function (deviceId: string) {
    try {
      const { controller, request } = checkDeviceSync(deviceId);
      // 记录请求控制器
      this.controller.push(controller);

      const response = await request();
      if (response.code === 0) {
        return { error: false };
      } else {
        throw Error(response.msg || "信道Sync失败");
      }
    } catch (e: any) {
      // 获取点播地址异常
      return { error: true, message: e.message || e };
    }
  },
  getVideoSource: async function (deviceId: string, channelId: string) {
    try {
      console.log("getVideoSource:", deviceId, channelId)
      const { controller, request } = startChannel(deviceId, channelId);
      // 记录请求控制器
      this.controller.push(controller);

      const response = await request();
      if (response.code === 0) {
        const { flv, hls, tracks } = response.data;
        return { error: false, address: { flv, hls }, tracks };
      } else {
        throw Error(response.msg || "流地址获取失败");
      }
    } catch (e: any) {
      // 获取点播地址异常
      return { error: true, message: e.message || e };
    }
  },
  getChannelList: async function (deviceId: string) {
    try {
      const { request, controller } = getChannelList(deviceId);
      // 记录请求控制器
      this.controller.push(controller);

      const response = await request();
      if (response.code === 0) {
        const channelList = response.data.list as any[]
        if (channelList.length) {
          return { error: false, channelList: channelList.map(row => ({ ...row, text: row.name })) }
        }
      }
      throw Error(response.msg || "视频流通道获取失败！");
    } catch (e: any) {
      return { error: true, message: e.message || e };
    }
  }
}

const checkDeviceSyncStatusRequest = async function (syncObj: SyncService, deviceId: string): Promise<any> {
  try {
    const { controller, request } = checkDeviceSyncStatus(deviceId);
    // 记录请求控制器
    syncObj.controller.push(controller);

    const response = await request();

    if (response.code === 0) {
      if (!syncObj.syncFlag) {
        syncObj.syncFlag = true;
      }

      if (response.data != null) {
        if (response.data.syncIng) {
          if (response.data.total == 0) {
            syncObj.handleError("信道检查中...")
          } else {
            const { total, current } = response.data;
            syncObj.handleError(`同步中...[${current}/${total}]`)
          }
          await delay(1500)
          return checkDeviceSyncStatusRequest(syncObj, deviceId)
        } else {
          const errorMsg = response.data.errorMsg
          if (errorMsg) {
            syncObj.handleError(errorMsg)
            throw Error(errorMsg)
          } else {
            // 成功
            syncObj.handleError('通道正常,准备播放')
            return { error: false }
          }
        }
      }
    } else {
      if (syncObj.syncFlag) {
        // 成功
        syncObj.handleError('通道正常,准备播放')
        return { error: false }
      } else {
        syncObj.handleError(response.msg)
        throw Error(response.msg)
      }
    }
  } catch (e: any) {
    // 获取点播地址异常
    return { error: true, message: e.message || e };
  }
}

export default Service
export { checkDeviceSyncStatusRequest }