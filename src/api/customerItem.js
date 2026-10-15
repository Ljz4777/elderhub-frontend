import request from './request'

/**
 * 客户护理项目（/admin/customer，管理员操作）
 * VO 为驼峰字段（nursingName/nurseNumber/buyTime/maturityTime/status/statusMsg）
 */

/** 设置护理级别（query 传参） */
export const setCustomerLevel = (customerId, levelId) =>
  request.post('/admin/customer/level/set', null, { params: { customerId, levelId } })

/** 移除护理级别（级联清理级别绑定的项目） */
export const removeCustomerLevel = (customerId) =>
  request.delete(`/admin/customer/level/remove/${customerId}`)

/** 查看客户已购项目（含状态） */
export const listCustomerItemsAdmin = (customerId) =>
  request.get(`/admin/customer/nurse-items/${customerId}`)

/** 单独购买项目 body: { customerId, itemId, addCount?, maturityTime? } */
export const buyItem = (data) => request.post('/admin/customer/nurse-item/buy', data)

/** 续费（query 传参：id 购买记录ID, addCount 增加次数） */
export const renewItem = (id, addCount) =>
  request.post('/admin/customer/nurse-item/renew', null, { params: { id, addCount } })

/** 移除客户单个项目 */
export const removeCustomerItem = (id) =>
  request.delete(`/admin/customer/nurse-item/remove/${id}`)
