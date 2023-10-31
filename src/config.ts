/**
 * 摄像头Id对应的代理端口Map
 */
const devicePortMap: Record<string, number> = {
  "44010200492000000001": 14081,
  "44010200492000000002": 14082,
  "44010200492000000003": 14083,
  "44010200492000000004": 14084,
}

// 后台服务地址
const api_service = 'http://39.106.4.50:18080'

export default devicePortMap

export { api_service }