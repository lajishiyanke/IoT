import request from '@/utils/request'

// 获取告警规则
export function getAlarmRules(deviceId) {
  if (!deviceId) {
    return Promise.reject(new Error('设备ID不能为空'))
  }
  return request({
    url: `/alarms/${deviceId}/rules/get`,
    method: 'get'
  })
}

// 设置告警规则
export function setAlarmRule(deviceId, rule) {
  if (!deviceId) {
    return Promise.reject(new Error('设备ID不能为空'))
  }
  return request({
    url: `/alarms/${deviceId}/rules/set`,
    method: 'post',
    data: rule
  })
}

// 修改告警规则
export function updateAlarmRule(deviceId, rule) {
  if (!deviceId) {
    return Promise.reject(new Error('设备ID不能为空'))
  }
  return request({
    url: `/alarms/${deviceId}/rules/update`,
    method: 'put',
    data: rule
  })
}

// 删除告警规则
export function deleteAlarmRule(deviceId, rule) {
  if (!deviceId) {
    return Promise.reject(new Error('设备ID不能为空'))
  }
  return request({
    url: `/alarms/${deviceId}/rules/delete`,
    method: 'delete',
    data: rule
  })
}

// 查询告警记录
export const getDeviceAlarms = (params) => {
  return request({
    url: '/alarms/get',
    method: 'get',
    params
  })
}

// 获取未处理的告警记录
export const getUnhandledAlarms = () => {
  return request({
    url: '/alarms/unhandled',
    method: 'get'
  })
}

// 添加告警记录
export const addAlarmRecord = (data) => {
  return request({
    url: '/alarms/add',
    method: 'post',
    data
  })
}

// 处理告警
export const handleAlarm = (alarmId, params) => {
  return request({
    url: `/alarms/${alarmId}/handle`,
    method: 'put',
    params
  })
}

// 添加删除告警记录的接口
export const deleteAlarmRecord = (alarmId) => {
  return request({
    url: `/alarms/${alarmId}/delete`,
    method: 'delete'
  })
}
