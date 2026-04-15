import request from '@/http/request'

/**
 *搜索API
 * @param { Number } page
 * @param { Number } limit
 * @param { String } code
 * @param { string } start 开始时间
 * @param { string } end 结束时间
 * @param { string } agent 厂家
 * @returns []
 */
export const searchApi = (page = 1, limit = 20, code, start = '', end = '', agent = '') => {
  return request.get(
    `/api/warehouse/get_warehousing_detail&jfcode=${code}&name=&start=${start}&end=${end}&order=&agent=${agent}&${page}&${limit}`,
  )
}

/**
 * 信息搜索
 * ser XD-C0001
 * @param { string } ser 编码
 * 
 *https://saas.juwoxing.com/order/api.php?s=/api/warehouse/get_move_child&page=1&ser=XD-&onetype=&twotype=&zerotype=&brand=&kw=&kwmh=21&page=1&limit=100
https://saas.juwoxing.com/order/api.php?s=/api/warehouse/get_move_child&page=1&ser=XD-C0001&onetype=&twotype=&zerotype=&brand=&kw=&kwmh=&page=1&limit=100
 */
export const searchInfoApi = (ser = '', key = '', page = 1, limit = 2) => {
  console.log(ser)

  return request.get(
    `/api/warehouse/get_move_child&page=1&ser=${ser}&onetype=&twotype=&zerotype=&brand=&kw=&kwmh=${key}&page=1&limit=5`,
  )
}

/**
 * 深度搜索
 * 智能搜索：可以同时搜索编码，助记码，名称，车型，品牌，OE，商品备注
 * https://saas.juwoxing.com/order/api.php?s=/api
 * @param { string } znss 关键词
 * @param { number } page 当前页
 * @param { number } limit 总页数
 *
 *
 */
export const searchApi2 = (znss = '', page = 1, limit = 2) => {
  console.log(znss)

  return request.get(
    `/api/goods/inventory_new&goods_ty=&keyword=&onetype=&twotype=&brand=&car_vin=&car_type=&inventory_ty=&znss=${znss}&inventory_status=1&group_type=&page=${page}&limit=${limit}`,
  )
}
