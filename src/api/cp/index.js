import request from '@/http/request'

/**
 *搜索API
 * @param { Number } page
 * @param { Number } limit
 * @param { String } code
 * @returns []
 */
export const searchApi = (page = 1, limit = 20, code) => {
  return request.get(
    `/api/warehouse/get_warehousing_detail&jfcode=${code}&name=&start=&end=&order=&agent=&${page}&${limit}`,
  )
}
