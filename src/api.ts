import HttpUtils from './tools/HttpUtils'
import { showDialog } from 'vant';

export async function getToken() {
  return new Promise(async (resolve, _reject) => {
    const handleError = (message: string) => {
      return showDialog({
        message,
        title: 'Token获取失败',
        confirmButtonText: '重新获取'
      }).then(() => {
        window.location.reload()
      })
    }

    try {
      const option = {
        url: '/api/user/login',
        method: 'get',
        params: {
          username: 'admin',
          password: '21232f297a57a5a743894a0e4a801fc3'
        }
      }
      const response = await HttpUtils(option).request()
      if (response && response.code === 0) {
        const token = response.data.accessToken
        localStorage.setItem('Token', token)
        resolve(token)
      } else {
        return handleError(response.msg as string)
      }
    } catch (e) {
      return handleError('Token请求失败')
    }
  })
}

export function getDeviceList() {
  return HttpUtils({
    url: '/api/device/query/devices',
    method: 'get',
    params: {
      page: 1,
      count: 1000
    }
  })
}

export function getChannelList(deviceId: string) {
  return HttpUtils({
    url: '/api/device/query/tree/' + deviceId,
    method: 'get',
    params: {
      page: 1,
      count: 1000,
      parentId: deviceId,
      onlyCatalog: false
    }
  })
}

export function startChannel(deviceId: string, channelId: string) {
  return HttpUtils({
    url: `/api/play/start/${deviceId}/${channelId}`,
    method: 'get'
  })
}

type ControlCameraOption = {
  deviceId: string
  channelId: string
  controlSpeed: number
  command: string
}

export function controlCamera({ deviceId, channelId, controlSpeed, command }: ControlCameraOption) {
  return HttpUtils({
    method: 'post',
    url: `/api/ptz/control/${deviceId}/${channelId}`,
    params: { command, horizonSpeed: controlSpeed, verticalSpeed: controlSpeed, zoomSpeed: controlSpeed }
  }).request()
}

// 查询信道状态
export function checkDeviceSync(deviceId: string) {
  return HttpUtils({
    method: 'get',
    url: `/api/device/query/devices/${deviceId}/sync`,
  })
}

// 查询是否成功
export function checkDeviceSyncStatus(deviceId: string) {
  return HttpUtils({
    method: 'get',
    url: `/api/device/query/${deviceId}/sync_status/`,
  })
}
