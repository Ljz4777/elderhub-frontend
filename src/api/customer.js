import request from './request'

/**
 * 客户管理（/admin/customer）
 * 注意：Customer 实体直出，JSON 字段为下划线命名（customer_name/customer_sex 等）
 */

/** 入住登记 body 为下划线字段 */
export const saveCustomer = (data) => request.post('/admin/customer/save', data)

/** 修改客户 body 为下划线字段 */
export const updateCustomer = (data) => request.put('/admin/customer/update', data)

/** 删除客户（逻辑删除） */
export const removeCustomer = (id) => request.delete(`/admin/customer/remove/${id}`)

/** 老人外出（床位状态置为外出） */
export const goOut = (id) => request.post(`/admin/customer/goOut/${id}`)

/** 老人回院 */
export const comeback = (id) => request.post(`/admin/customer/comeback/${id}`)

/** 无管家客户列表（user_id 为空或 -1） */
export const listNoNurse = () => request.get('/admin/customer/no-nurse')

/** 无床位客户列表 */
export const listNoBed = () => request.get('/admin/customer/no-bed')
