import SockJS from 'sockjs-client'
import { Stomp } from '@stomp/stompjs'

// 配置 WebSocket 连接
export const createWebSocketConnection = () => {
  const socket = new SockJS(import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws')
  return Stomp.over(socket)
} 