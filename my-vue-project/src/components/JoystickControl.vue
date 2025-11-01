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

// Web Worker实例
let joystickWorker: Worker | null = null

// 性能监控相关
let messageCount = 0
let startTime = 0

// 初始化Joystick
const initJoystick = () => {
  if (!joystickContainer.value) return
  
  // 创建Web Worker
  try {
    joystickWorker = new Worker(new URL('../workers/joystickWorker.js', import.meta.url))
    
    // 监听Worker发来的消息
    joystickWorker.onmessage = (e) => {
      const { type, data, error } = e.data
      switch (type) {
        case 'SEND_COMMAND':
          // 接收到发送命令的请求
          mqttStore.sendCommand(data.x, data.y)
          messageCount++
          break
        case 'ERROR':
          console.error('Worker error:', error)
          break
        case 'STATS':
          // 接收性能统计信息
          const rate = data.sendCount / (data.uptime / 1000)
          console.log(`消息发送速率: ${rate.toFixed(2)} 条/秒, 总计: ${data.sendCount} 条`)
          break
      }
    }
  } catch (error) {
    console.error('Failed to create Web Worker:', error)
    // 如果Web Worker创建失败，降级到原来的方式
    console.warn('降级到单线程模式')
  }
  
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
          
          // 发送数据到Worker
          if (joystickWorker) {
            joystickWorker.postMessage({
              type: 'UPDATE_DATA',
              data: { x, y }
            })
            
            // 启动监控
            joystickWorker.postMessage({
              type: 'START_MONITORING'
            })
            
            // 记录开始时间
            if (startTime === 0) {
              startTime = Date.now()
            }
          }
        }
      })
      
      joystickManager.on('end', (evt: any, data: any) => {
        // 停止监控
        if (joystickWorker) {
          joystickWorker.postMessage({
            type: 'STOP_MONITORING'
          })
          
          // 计算并显示统计信息
          const duration = (Date.now() - startTime) / 1000
          const rate = messageCount / duration
          console.log(`摇杆使用统计: 发送 ${messageCount} 条消息, 持续 ${duration.toFixed(2)} 秒, 平均速率 ${rate.toFixed(2)} 条/秒`)
        }
        
        // 重置统计
        messageCount = 0
        startTime = 0
        
        // 当释放摇杆时，发送停止命令
        if (mqttStore.isConnected) {
          mqttStore.sendCommand(0, 0)
        }
      })
    })
  }, 25) // 延迟25ms初始化
}

// 清理Joystick
const cleanupJoystick = () => {
  if (joystickWorker) {
    joystickWorker.postMessage({
      type: 'STOP_MONITORING'
    })
    joystickWorker.terminate()
    joystickWorker = null
  }
  
  if (joystickManager) {
    joystickManager.destroy()
    joystickManager = null
  }
  
  // 重置统计
  messageCount = 0
  startTime = 0
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