import request from './request'

/**
 * 护理记录（管家 /nurse/nurse-record、管理员 /admin/nurse-record）
 * VO 为驼峰：{ id, customerId, itemId, userId, nursingName, nursingTime, nursingContent, nursingCount }
 */

/** 管家：录入护理记录（后端按 DTO 内 userId 归属，同时扣减客户项目次数） */
export const butlerSaveRecord = (dto, userId) =>
  request.post('/nurse/nurse-record-mine/save', { ...dto, userId })

/** 管家：查看护理记录（customerId 为空表示全部客户，后端按 userId 过滤） */
export const butlerListRecords = (customerId, userId) =>
  request.get('/nurse/nurse-record-mine/list', { params: { customerId, userId } })

/** 管理员：查看客户护理记录 */
export const adminListRecords = (customerId) =>
  request.get(`/admin/nurse-record/list/${customerId}`)

/** 管理员：删除护理记录（逻辑删除） */
export const adminRemoveRecord = (id) => request.delete(`/admin/nurse-record/remove/${id}`)
