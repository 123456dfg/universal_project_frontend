<template>
  <div class="mqtt-status" :class="statusClass">
    <span class="status-text">{{ statusText }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMqttStore, MqttConnectionStatus } from '@/stores/mqtt'

const mqttStore = useMqttStore()

// 计算状态文本
const statusText = computed(() => {
  switch (mqttStore.connectionStatus) {
    case MqttConnectionStatus.CONNECTING:
      return '连接中...'
    case MqttConnectionStatus.CONNECTED:
      return '已连接'
    case MqttConnectionStatus.DISCONNECTED:
      return '未连接'
    case MqttConnectionStatus.RECONNECTING:
      return '重连中...'
    case MqttConnectionStatus.ERROR:
      return '连接错误'
    default:
      return '未知状态'
  }
})

// 计算状态类名
const statusClass = computed(() => {
  return {
    'connecting': mqttStore.connectionStatus === MqttConnectionStatus.CONNECTING,
    'connected': mqttStore.connectionStatus === MqttConnectionStatus.CONNECTED,
    'disconnected': mqttStore.connectionStatus === MqttConnectionStatus.DISCONNECTED,
    'reconnecting': mqttStore.connectionStatus === MqttConnectionStatus.RECONNECTING,
    'error': mqttStore.connectionStatus === MqttConnectionStatus.ERROR
  }
})
</script>

<style scoped>
.mqtt-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.connecting {
  background-color: #fff3cd;
  color: #856404;
}

.connected {
  background-color: #d4edda;
  color: #155724;
}

.disconnected {
  background-color: #f8d7da;
  color: #721c24;
}

.reconnecting {
  background-color: #cce7ff;
  color: #004085;
}

.error {
  background-color: #f8d7da;
  color: #721c24;
}
</style>