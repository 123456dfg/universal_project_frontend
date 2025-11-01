<template>
  <div class="home">
    <!-- 成功连接后显示主界面 -->
    <template v-if="mqttStore.isConnected">
      <!-- 视频流区域 (35%) -->
      <div class="video-section">
        <VideoStream />
        <!-- MQTT状态显示在右上角 -->
        <div class="mqtt-status-overlay">
          <MqttStatus />
        </div>
      </div>
      
      <!-- 控制区域 (65%) -->
      <div class="control-section">
        <JoystickControl />
      </div>
    </template>
    
    <!-- 连接状态提示和操作按钮 -->
    <div v-if="!mqttStore.isConnected" class="connection-overlay">
      <div class="connection-panel">
        <div class="connection-status">
          <div v-if="mqttStore.connectionStatus === 'CONNECTING'" class="status-message">
            正在连接服务器...
          </div>
          <div v-else-if="mqttStore.connectionStatus === 'ERROR' || mqttStore.connectionStatus === 'DISCONNECTED'" class="status-message error">
            连接服务器失败
          </div>
        </div>
        
        <div class="connection-actions">
          <button 
            v-if="mqttStore.connectionStatus === 'ERROR' || mqttStore.connectionStatus === 'DISCONNECTED'" 
            @click="handleReconnect"
            class="reconnect-button"
            :disabled="isReconnecting"
          >
            {{ isReconnecting ? '重新连接中...' : '重新连接' }}
          </button>
          
          <button 
            @click="showConfigForm = !showConfigForm" 
            class="config-button"
          >
            {{ showConfigForm ? '隐藏配置' : '手动配置' }}
          </button>
        </div>
        
        <!-- MQTT配置表单 (仅在手动配置时显示) -->
        <div v-if="showConfigForm" class="config-section">
          <MqttConfigForm @connect="handleConfigConnect" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMqttStore } from '@/stores/mqtt'
import VideoStream from '@/components/VideoStream.vue'
import JoystickControl from '@/components/JoystickControl.vue'
import MqttStatus from '@/components/MqttStatus.vue'
import MqttConfigForm from '@/components/MqttConfigForm.vue'

const mqttStore = useMqttStore()
const isReconnecting = ref(false)
const showConfigForm = ref(false)

// 处理重新连接
const handleReconnect = async () => {
  if (isReconnecting.value) return
  
  isReconnecting.value = true
  try {
    await mqttStore.connect()
  } catch (error) {
    console.error('Reconnect failed:', error)
  } finally {
    isReconnecting.value = false
  }
}

// 处理配置连接
const handleConfigConnect = () => {
  // 配置连接成功后隐藏配置表单
  showConfigForm.value = false
}

// 组件挂载时尝试自动连接
onMounted(async () => {
  try {
    // 获取MQTT配置
    await mqttStore.fetchMqttConfig()
    // 尝试连接
    await mqttStore.connect()
  } catch (error) {
    console.error('Auto connect failed:', error)
  }
})
</script>

<style scoped>
.home {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.video-section {
  position: relative;
  height: 35%;
  background-color: #000;
}

.control-section {
  height: 65%;
  background-color: #f0f0f0;
}

.mqtt-status-overlay {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
}

.connection-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.connection-panel {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  min-width: 300px;
}

.connection-status {
  margin-bottom: 20px;
}

.status-message {
  text-align: center;
  font-size: 18px;
  font-weight: 500;
}

.status-message.error {
  color: #e53e3e;
}

.connection-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 20px;
}

button {
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.reconnect-button {
  background-color: #3182ce;
  color: white;
}

.reconnect-button:disabled {
  background-color: #a0aec0;
  cursor: not-allowed;
}

.config-button {
  background-color: #4a5568;
  color: white;
}

.config-section {
  margin-top: 20px;
}
</style>