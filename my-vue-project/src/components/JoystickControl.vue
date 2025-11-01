<template>
  <div class="joystick-control">
    <div ref="joystickContainer" class="joystick-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useMqttStore } from '@/stores/mqtt'

const mqttStore = useMqttStore()

// Joystick容器引用
const joystickContainer = ref<HTMLDivElement | null>(null)

// Joystick实例
let joystickManager: any = null

// 当前摇杆数据
let currentJoystickData: { x: number; y: number } | null = null

// 定时器ID
let sendCommandTimer: number | null = null

// 上次发送的数据（用于去重）
let lastSentData: { x: number; y: number } | null = null

// 初始化Joystick
const initJoystick = () => {
  if (!joystickContainer.value) return
  
  // 延迟初始化，确保DOM更新完成
  setTimeout(() => {
    if (!joystickContainer.value) return
    
    // 动态导入nipplejs
    import('nipplejs').then((nipplejsModule: any) => {
      // nipplejs导出的是一个包含create方法的对象
      const nipplejs = nipplejsModule.default || nipplejsModule
      
      joystickManager = nipplejs.create({
        zone: joystickContainer.value!,
        mode: 'static',
        position: { left: '50%', top: '50%' },
        color: 'blue',
        size: 150
      })
      
      // 监听Joystick事件
      joystickManager.on('move', (evt: any, data: any) => {
        // 确保data是单个对象而不是数组
        if (Array.isArray(data)) return
        
        if (mqttStore.isConnected) {
          // 将摇杆位置转换为-1到1之间的值
          const x = data.vector.x
          const y = -data.vector.y // Y轴翻转，使向上为正
          
          // 保存当前摇杆数据
          currentJoystickData = { x, y }
          
          // 立即发送一次控制命令（高优先级）
          sendCommandImmediately(x, y)
          
          // 启动定时器持续发送命令
          startSendingCommands()
        }
      })
      
      joystickManager.on('end', (evt: any, data: any) => {
        // 清除当前摇杆数据
        currentJoystickData = null
        
        // 停止定时器
        stopSendingCommands()
        
        // 当释放摇杆时，发送停止命令
        if (mqttStore.isConnected) {
          mqttStore.sendCommand(0, 0)
          lastSentData = { x: 0, y: 0 }
        }
      })
    })
  }, 50) // 延迟50ms初始化
}

// 立即发送命令（用于move事件）
const sendCommandImmediately = (x: number, y: number) => {
  // 添加防抖机制，只有当偏移量大于阈值时才发送
  if (Math.abs(x) > 0.05 || Math.abs(y) > 0.05) {
    // 立即发送控制命令
    mqttStore.sendCommand(x, y)
    lastSentData = { x, y }
  }
}

// 开始持续发送命令
const startSendingCommands = () => {
  // 如果定时器已经存在，先清除它
  if (sendCommandTimer) {
    clearInterval(sendCommandTimer)
  }
  
  // 设置定时器，每50ms发送一次命令（提高频率）
  sendCommandTimer = window.setInterval(() => {
    if (mqttStore.isConnected && currentJoystickData) {
      // 添加防抖机制，只有当偏移量大于阈值时才发送
      if (Math.abs(currentJoystickData.x) > 0.05 || Math.abs(currentJoystickData.y) > 0.05) {
        // 持续发送控制命令，即使数据相同也要发送以确保连续控制
        mqttStore.sendCommand(currentJoystickData.x, currentJoystickData.y)
        lastSentData = { ...currentJoystickData }
      }
    }
  }, 50) // 50ms发送一次（提高频率）
}

// 停止发送命令
const stopSendingCommands = () => {
  if (sendCommandTimer) {
    clearInterval(sendCommandTimer)
    sendCommandTimer = null
  }
}

// 清理Joystick
const cleanupJoystick = () => {
  // 停止发送命令
  stopSendingCommands()
  
  if (joystickManager) {
    joystickManager.destroy()
    joystickManager = null
  }
  
  // 清理数据
  currentJoystickData = null
  lastSentData = null
}

// 组件挂载时初始化Joystick
onMounted(() => {
  initJoystick()
})

// 组件卸载时清理Joystick
onUnmounted(() => {
  cleanupJoystick()
})
</script>

<style scoped>
.joystick-control {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: flex-end; /* 将摇杆定位在底部 */
  justify-content: center;
  padding-bottom: 20px; /* 底部留出空间 */
}

.joystick-container {
  width: 100%;
  height: 100%;
  touch-action: none;
}
</style>