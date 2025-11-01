<template>
  <div class="mqtt-config-form">
    <h3>MQTT配置</h3>
    <form @submit.prevent="handleConnect">
      <div class="form-group">
        <label for="mqtt-url">服务器地址:</label>
        <input 
          id="mqtt-url" 
          v-model="formData.url" 
          type="text" 
          placeholder="ws://120.79.175.61:23408/mqtt"
        >
      </div>
      
      <div class="form-group">
        <label for="mqtt-client-id">客户端ID:</label>
        <input 
          id="mqtt-client-id" 
          v-model="formData.clientId" 
          type="text" 
          placeholder="frontend_client"
        >
      </div>
      
      <div class="form-group">
        <label for="mqtt-username">用户名:</label>
        <input 
          id="mqtt-username" 
          v-model="formData.username" 
          type="text" 
          placeholder="（可选）"
        >
      </div>
      
      <div class="form-group">
        <label for="mqtt-password">密码:</label>
        <input 
          id="mqtt-password" 
          v-model="formData.password" 
          type="password" 
          placeholder="123456"
        >
      </div>
      
      <div class="form-actions">
        <button type="submit" :disabled="isConnecting">
          {{ isConnecting ? '连接中...' : '连接' }}
        </button>
        <button type="button" @click="handleReset" class="secondary">
          重置默认值
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useMqttStore } from '@/stores/mqtt'

// 定义事件发射器
const emit = defineEmits<{
  (e: 'connect'): void
}>()

const mqttStore = useMqttStore()

// 表单数据
const formData = reactive({ ...mqttStore.mqttConfig })

// 是否正在连接
const isConnecting = ref(false)

// 处理连接
const handleConnect = async () => {
  isConnecting.value = true
  
  try {
    // 更新MQTT配置
    mqttStore.updateMqttConfig({ ...formData })
    
    // 连接MQTT
    await mqttStore.connect()
    
    // 发射连接成功事件
    emit('connect')
  } finally {
    isConnecting.value = false
  }
}

// 重置为默认值
const handleReset = () => {
  Object.assign(formData, {
    url: 'ws://120.79.175.61:23408/mqtt',
    clientId: 'frontend_client',
    username: '',
    password: '123456'
  })
}
</script>

<style scoped>
.mqtt-config-form {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

button:not(.secondary) {
  background-color: #007bff;
  color: white;
}

button.secondary {
  background-color: #6c757d;
  color: white;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>