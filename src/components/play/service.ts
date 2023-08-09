import { checkDeviceSync, checkDeviceSyncStatus, startChannel } from "@/api";

type methods = 'checkDeviceChannel' | 'getVideoSource' | 'abortFetch'

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
  checkDeviceChannel: async function (deviceId: string, _channelId: string) {
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
        const { flv: address, tracks } = response.data;
        return { error: false, address, tracks };
      } else {
        throw Error(response.msg || "流地址获取失败");
      }
    } catch (e: any) {
      // 获取点播地址异常
      return { error: true, message: e.message || e };
    }
  }
}

const checkDeviceChannelSyncStatus = async function (syncObj: SyncService, deviceId: string): Promise<any> {
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
            syncObj.handleError("检查视频通道中...")
          } else {
            const { total, current } = response.data;
            syncObj.handleError(`同步中...[${current}/${total}]`)
          }
          await delay(1500)
          return checkDeviceChannelSyncStatus(syncObj, deviceId)
        } else {
          const errorMsg = response.data.errorMsg
          if (errorMsg) {
            syncObj.handleError(errorMsg)
            throw Error(errorMsg)
          } else {
            // 成功
            syncObj.handleError('视频通道正常,准备播放')
            return { error: false }
          }
        }
      }
    } else {
      if (syncObj.syncFlag) {
        // 成功
        syncObj.handleError('视频通道正常,准备播放')
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
export { checkDeviceChannelSyncStatus }