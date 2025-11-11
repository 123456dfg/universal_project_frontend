import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import mqtt from 'mqtt'
import axios from 'axios'

// MQTT连接状态枚举
export enum MqttConnectionStatus {
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  RECONNECTING = 'RECONNECTING',
  ERROR = 'ERROR'
}

// 默认MQTT配置
const DEFAULT_MQTT_CONFIG = {
  url: 'wss://120.79.175.61:23407/mqtt',
  clientId: `frontend_client_1`,
  username: '',
  password: '123456'
}

export const useMqttStore = defineStore('mqtt', () => {
  // MQTT客户端实例
  const client = ref<any | null>(null)
  
  // 连接状态
  const connectionStatus = ref<MqttConnectionStatus>(MqttConnectionStatus.DISCONNECTED)
  
  // MQTT配置
  const mqttConfig = ref({ ...DEFAULT_MQTT_CONFIG })
  
  // 视频流数据
  const videoStream = ref<ArrayBuffer | null>(null)
  
  // 是否正在加载视频
  const isLoadingVideo = ref(false)
  
  // 计算属性：是否已连接
  const isConnected = computed(() => connectionStatus.value === MqttConnectionStatus.CONNECTED)
  
  // 获取MQTT服务器配置信息
  const fetchMqttConfig = async () => {
    try {
      const response = await axios.get('/api/mqtt/info')
      if (response.data && response.data.url) {
        mqttConfig.value = {
          ...DEFAULT_MQTT_CONFIG,
          ...response.data
        }
      }
    } catch (error) {
      console.warn('Failed to fetch MQTT config, using default config:', error)
      // 使用默认配置
      mqttConfig.value = { ...DEFAULT_MQTT_CONFIG }
    }
  }
  
  // 连接到MQTT服务器
  const connect = async () => {
    if (connectionStatus.value === MqttConnectionStatus.CONNECTED) {
      return
    }
    
    connectionStatus.value = MqttConnectionStatus.CONNECTING
    
    try {
      // 如果还没有配置信息，先获取
      if (!mqttConfig.value.url) {
        await fetchMqttConfig()
      }
      
      // 断开现有连接（如果有）
      if (client.value) {
        client.value.end()
      }
      
      // 创建新的MQTT客户端
      client.value = mqtt.connect(mqttConfig.value.url, {
        clientId: mqttConfig.value.clientId,
        username: mqttConfig.value.username || '',
        password: mqttConfig.value.password || '',
        protocol: 'wss', // 明确指定协议
        reconnectPeriod: 5000, // 自动重连间隔
        connectTimeout: 30000, // 连接超时时间
        keepalive: 60, // 保持连接间隔
        clean: true, // 清除会话
        resubscribe: true, // 重新订阅
        wsOptions: {
          rejectUnauthorized: false // 支持自签名证书
        }
      })
      
      // 监听连接事件
      client.value.on('connect', () => {
        console.log('MQTT connected')
        connectionStatus.value = MqttConnectionStatus.CONNECTED
        
        // 订阅视频流主题
        client.value?.subscribe('/robot/video', (err) => {
          if (err) {
            console.error('Failed to subscribe to video topic:', err)
          }
        })
      })
      
      // 监听断开连接事件
      client.value.on('close', () => {
        console.log('MQTT disconnected')
        if (connectionStatus.value !== MqttConnectionStatus.RECONNECTING) {
          connectionStatus.value = MqttConnectionStatus.DISCONNECTED
        }
      })
      
      // 监听错误事件
      client.value.on('error', (error) => {
        console.error('MQTT error:', error)
        connectionStatus.value = MqttConnectionStatus.ERROR
      })
      
      // 监听重连事件
      client.value.on('reconnect', () => {
        console.log('MQTT reconnecting')
        connectionStatus.value = MqttConnectionStatus.RECONNECTING
      })
      
      // 监听消息事件
      client.value.on('message', (topic, payload) => {
        if (topic === '/robot/video') {
          // 处理视频流数据
          videoStream.value = payload.buffer.slice(payload.byteOffset, payload.byteOffset + payload.byteLength)
          isLoadingVideo.value = false
        }
      })
    } catch (error) {
      console.error('Failed to connect to MQTT:', error)
      connectionStatus.value = MqttConnectionStatus.ERROR
    }
  }
  
  // 断开MQTT连接
  const disconnect = () => {
    if (client.value) {
      client.value.end()
      client.value = null
    }
    connectionStatus.value = MqttConnectionStatus.DISCONNECTED
  }
  
  // 发送控制命令
  const sendCommand = (x: number, y: number) => {
    if (client.value && connectionStatus.value === MqttConnectionStatus.CONNECTED) {
      const payload = JSON.stringify({ x, y })
      client.value.publish('/robot/cmd', payload, { qos: 1 })
    }
  }
  
  // 更新MQTT配置
  const updateMqttConfig = (config: Partial<typeof mqttConfig.value>) => {
    mqttConfig.value = { ...mqttConfig.value, ...config }
  }
  
  return {
    client,
    connectionStatus,
    mqttConfig,
    videoStream,
    isLoadingVideo,
    isConnected,
    connect,
    disconnect,
    sendCommand,
    updateMqttConfig,
    fetchMqttConfig
  }
})