import request from '@/utils/request'

// 获取告警规则
export const getAlarmRules = (deviceId) => {
  return request({
    url: `/alarms/${deviceId}/rules/get`,
    method: 'get'
  })
}

// 设置告警规则
export const setAlarmRule = (deviceId, data) => {
  return request({
    url: `/alarms/${deviceId}/rules/set`,
    method: 'post',
    data
  })
}

// 修改告警规则
export const updateAlarmRule = (deviceId, data) => {
  return request({
    url: `/alarms/${deviceId}/rules/update`,
    method: 'put',
    data
  })
}

// 删除告警规则
export const deleteAlarmRule = (deviceId, data) => {
  return request({
    url: `/alarms/${deviceId}/rules/delete`,
    method: 'delete',
    data
  })
}

// 查询告警记录
export const getDeviceAlarms = (deviceId, params) => {
  return request({
    url: `/alarms/${deviceId}/alarms/get`,
    method: 'get',
    params
  })
}

// 获取未处理的告警记录
export const getUnhandledAlarms = (deviceId) => {
  return request({
    url: `/alarms/${deviceId}/alarms/unhandled`,
    method: 'get'
  })
}

// 添加告警记录
export const addAlarmRecord = (data) => {
  return request({
    url: '/alarms/alarms/add',
    method: 'post',
    data
  })
}

// 处理告警
export const handleAlarm = (alarmId, params) => {
  return request({
    url: `/alarms/${alarmId}/alarms/handle`,
    method: 'put',
    params
  })
} 