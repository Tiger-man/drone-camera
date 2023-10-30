import { getToken } from '@/api'
import { api_service } from "@/config"

const FETCH_TIME_OUT = 3 * 60 * 1000
// const FETCH_TIME_OUT = 300

let isRefreshing = false

const waitHttpList: ({ request: () => void, controller: AbortController })[] = []

type FetchOption = {
  url: string
  method: string
  headers?: Partial<Headers>
  params?: Record<string, any>
  data?: any
}

const HttpUtils = (option: FetchOption) => {
  const { url, method, headers, data, params } = option
  const fetchUrl = new URL(api_service + url)

  const token = localStorage.getItem('Token')

  const _headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  if (token) {
    _headers['Access-Token'] = token
  }

  if (headers) {
    Object.assign(_headers, headers)
  }

  if (params) {
    Object.keys(params).forEach(key => fetchUrl.searchParams.append(key, params[key]));
  }

  const controller = new AbortController();
  const signal = controller.signal;

  const timer = setTimeout(() => {
    controller.abort()
  }, FETCH_TIME_OUT)

  return {
    controller,
    request: () => {
      return fetch(fetchUrl, {
        method: method || 'get',
        headers: _headers,
        body: JSON.stringify(data),
        signal
      }).then(response => response.json()).then(async (data): Promise<any> => {
        clearTimeout(timer)
        console.log('fetch data:', data)
        console.log('waitHttpList:', waitHttpList.length)
        // Token失效
        if (data.code === 401) {
          console.log('fetch isRefresh：', isRefreshing)
          if (isRefreshing) {
            // 正在刷新token
            const instance = HttpUtils(option)
            waitHttpList.push(instance)
            return instance.request
          } else {
            // Token未刷新
            isRefreshing = true
            await getToken()
            isRefreshing = false
            waitHttpList.forEach(cb => cb.request())

            waitHttpList.length = 0
            return HttpUtils(option).request()
          }
        }
        return data
      }).catch(error => {
        console.dir(error)
        let msg = error.message || ''
        if (msg === 'Failed to fetch') {
          msg = '服务响应异常'
        }
        if (msg.includes('aborted')) {
          msg = '请求已被取消'
        }
        throw Error(msg || error)
      });
    }
  }

}

export default HttpUtils