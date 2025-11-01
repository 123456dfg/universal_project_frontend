// 摇杆监控Worker
let isMonitoring = false;
let currentData = null;
let lastSentData = null;
let messageQueue = [];
let isProcessingQueue = false;

// 性能监控相关
let sendCount = 0;
let lastReportTime = Date.now();
let reportInterval = 5000; // 5秒报告一次

// 监听来自主线程的消息
self.onmessage = function(e) {
  const { type, data } = e.data;
  
  switch (type) {
    case 'START_MONITORING':
      startMonitoring();
      break;
    case 'STOP_MONITORING':
      stopMonitoring();
      break;
    case 'UPDATE_DATA':
      currentData = data;
      break;
    case 'SET_INTERVAL':
      // 可以设置监控间隔
      break;
    case 'GET_STATS':
      // 返回统计信息
      self.postMessage({
        type: 'STATS',
        data: {
          sendCount: sendCount,
          uptime: Date.now() - lastReportTime
        }
      });
      break;
  }
};

// 启动监控
function startMonitoring() {
  if (isMonitoring) return;
  
  isMonitoring = true;
  lastReportTime = Date.now();
  sendCount = 0;
  monitorLoop();
}

// 停止监控
function stopMonitoring() {
  isMonitoring = false;
  currentData = null;
  messageQueue = [];
  isProcessingQueue = false;
  
  // 报告最终统计
  self.postMessage({
    type: 'STATS',
    data: {
      sendCount: sendCount,
      uptime: Date.now() - lastReportTime
    }
  });
}

// 监控循环
function monitorLoop() {
  if (!isMonitoring) return;
  
  // 检查当前摇杆数据
  if (currentData) {
    // 只有当偏移量大于阈值时才发送消息
    if (Math.abs(currentData.x) > 0.05 || Math.abs(currentData.y) > 0.05) {
      // 检查是否与上次发送的数据相同
      if (!lastSentData || lastSentData.x !== currentData.x || lastSentData.y !== currentData.y) {
        // 发送消息到主线程
        self.postMessage({
          type: 'SEND_COMMAND',
          data: { x: currentData.x, y: currentData.y }
        });
        lastSentData = { x: currentData.x, y: currentData.y };
        sendCount++;
      }
    }
  }
  
  // 定期报告统计信息
  const now = Date.now();
  if (now - lastReportTime > reportInterval) {
    self.postMessage({
      type: 'STATS',
      data: {
        sendCount: sendCount,
        uptime: now - lastReportTime
      }
    });
    sendCount = 0;
    lastReportTime = now;
  }
  
  // 继续循环 - 使用setTimeout控制频率
  setTimeout(monitorLoop, 20); // 约50Hz频率
}

// 处理错误
self.onerror = function(error) {
  self.postMessage({
    type: 'ERROR',
    error: error.message
  });
};