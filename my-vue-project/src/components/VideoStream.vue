<template>
  <div 
    class="video-stream" 
    ref="videoStreamRef"
    @click="showControls"
    @mouseleave="hideControls"
  >
    <div v-if="isLoading" class="loading">
      数据加载中...
    </div>
    <img 
      v-else-if="videoUrl" 
      :src="videoUrl" 
      alt="视频流" 
      class="video-frame"
      ref="videoFrameRef"
    >
    <div v-else class="no-video">
      无视频数据
    </div>
    
    <!-- 全屏按钮 -->
    <div class="video-controls" v-show="showControlsFlag">
      <button 
        class="fullscreen-button" 
        @click.stop="toggleFullscreen"
      >
        {{ isFullscreen ? '退出全屏' : '全屏' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useMqttStore } from '@/stores/mqtt'

const mqttStore = useMqttStore()

// DOM引用
const videoStreamRef = ref<HTMLDivElement | null>(null)
const videoFrameRef = ref<HTMLImageElement | null>(null)

// 控制按钮显示状态
const showControlsFlag = ref(false)

// 全屏状态
const isFullscreen = ref(false)

// 控制按钮显示的定时器
let controlsTimer: number | null = null

// 是否正在加载
const isLoading = computed(() => mqttStore.isLoadingVideo)

// 创建视频URL
const videoUrl = computed(() => {
  if (mqttStore.videoStream) {
    const blob = new Blob([mqttStore.videoStream], { type: 'image/jpeg' })
    return URL.createObjectURL(blob)
  }
  return null
})

// 清理对象URL以防止内存泄漏
watch(videoUrl, (newUrl, oldUrl) => {
  if (oldUrl) {
    URL.revokeObjectURL(oldUrl)
  }
})

// 显示控制按钮
const showControls = () => {
  showControlsFlag.value = true
  
  // 清除之前的定时器
  if (controlsTimer) {
    clearTimeout(controlsTimer)
  }
  
  // 3秒后自动隐藏
  controlsTimer = window.setTimeout(() => {
    showControlsFlag.value = false
  }, 3000)
}

// 隐藏控制按钮
const hideControls = () => {
  // 清除之前的定时器
  if (controlsTimer) {
    clearTimeout(controlsTimer)
  }
  
  // 延迟隐藏，避免鼠标稍微移出就隐藏
  controlsTimer = window.setTimeout(() => {
    showControlsFlag.value = false
  }, 500)
}

// 切换全屏
const toggleFullscreen = () => {
  if (!videoStreamRef.value) return
  
  if (!isFullscreen.value) {
    // 进入全屏
    enterFullscreen()
  } else {
    // 退出全屏
    exitFullscreen()
  }
}

// 进入全屏
const enterFullscreen = () => {
  const element = videoStreamRef.value
  if (!element) return
  
  try {
    if (element.requestFullscreen) {
      element.requestFullscreen()
    } else if ((element as any).mozRequestFullScreen) { // Firefox
      (element as any).mozRequestFullScreen()
    } else if ((element as any).webkitRequestFullscreen) { // Chrome, Safari and Opera
      (element as any).webkitRequestFullscreen()
    } else if ((element as any).msRequestFullscreen) { // IE/Edge
      (element as any).msRequestFullscreen()
    }
    
    isFullscreen.value = true
  } catch (error) {
    console.error('Failed to enter fullscreen:', error)
  }
}

// 退出全屏
const exitFullscreen = () => {
  try {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if ((document as any).mozCancelFullScreen) { // Firefox
      (document as any).mozCancelFullScreen()
    } else if ((document as any).webkitExitFullscreen) { // Chrome, Safari and Opera
      (document as any).webkitExitFullscreen()
    } else if ((document as any).msExitFullscreen) { // IE/Edge
      (document as any).msExitFullscreen()
    }
    
    isFullscreen.value = false
  } catch (error) {
    console.error('Failed to exit fullscreen:', error)
  }
}

// 处理全屏变化事件
const handleFullscreenChange = () => {
  const isCurrentlyFullscreen = 
    document.fullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).msFullscreenElement
    
  isFullscreen.value = !!isCurrentlyFullscreen
}

// 组件挂载时添加事件监听器
onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  document.addEventListener('mozfullscreenchange', handleFullscreenChange)
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
  document.addEventListener('msfullscreenchange', handleFullscreenChange)
})

// 组件卸载时移除事件监听器
onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
  document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
  document.removeEventListener('msfullscreenchange', handleFullscreenChange)
  
  // 清理可能存在的对象URL
  if (videoUrl.value) {
    URL.revokeObjectURL(videoUrl.value)
  }
  
  // 清理定时器
  if (controlsTimer) {
    clearTimeout(controlsTimer)
  }
})
</script>

<style scoped>
.video-stream {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #000;
  position: relative;
  border-top: 1px solid #ddd;
  border-bottom: 1px solid #ddd;
  cursor: pointer;
}

.loading, .no-video {
  color: #fff;
  font-size: 16px;
}

.video-frame {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* 视频控制区域 */
.video-controls {
  position: absolute;
  bottom: 10px;
  right: 10px;
  z-index: 10;
}

/* 全屏按钮样式 */
.fullscreen-button {
  padding: 6px 12px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.3s ease;
}

.fullscreen-button:hover {
  background-color: rgba(0, 0, 0, 0.9);
}

/* 全屏时的样式 */
.video-stream:fullscreen .video-frame,
.video-stream:-webkit-full-screen .video-frame,
.video-stream:-moz-full-screen .video-frame,
.video-stream:-ms-fullscreen .video-frame {
  width: 100vw;
  height: 100vh;
  object-fit: contain;
  border: none;
}

/* 全屏时锁定横屏显示 */
.video-stream:fullscreen,
.video-stream:-webkit-full-screen,
.video-stream:-moz-full-screen,
.video-stream:-ms-fullscreen {
  transform: rotate(0deg);
  width: 100vw;
  height: 100vh;
  border: none;
}
</style>