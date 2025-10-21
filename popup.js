// popup.js - 简化版本
let refreshInterval;
let countdownInterval;
let secondsUntilRefresh = 30;

document.addEventListener('DOMContentLoaded', function() {
  initializeExtension();
  
  document.getElementById('goldPrice').addEventListener('click', function() {
    getRealGoldPrice();
  });
});

function initializeExtension() {
  updateStatus('正在获取金价...');
  getRealGoldPrice();
  setupAutoRefresh();
}

function getRealGoldPrice() {
  updateStatus('请求中...');
  document.getElementById('goldPrice').textContent = '获取中...';
  document.getElementById('usdGoldPrice').textContent = '--';
  
  chrome.runtime.sendMessage({ action: "getGoldPrice" }, (response) => {
    if (response && response.success) {
      // 显示价格
      document.getElementById('goldPrice').textContent = `${response.pricePerGramCNY} 元/克`;
      document.getElementById('usdGoldPrice').textContent = `$${response.pricePerOunceUSD} /oz`;
      document.getElementById('timestamp').textContent = `更新: ${new Date().toLocaleTimeString()}`;
      
      if (response.source === 'real') {
        updateStatus('实时数据');
      } else {
        updateStatus('估算数据', 'warning');
      }
    } else {
      document.getElementById('goldPrice').textContent = '获取失败';
      document.getElementById('usdGoldPrice').textContent = '--';
      updateStatus('获取失败', 'error');
    }
  });
}

function updateStatus(text, type = 'info') {
  const statusElement = document.getElementById('status') || createStatusElement();
  statusElement.textContent = text;
  statusElement.className = `status status-${type}`;
}

function createStatusElement() {
  const statusElement = document.createElement('div');
  statusElement.id = 'status';
  document.querySelector('.container').appendChild(statusElement);
  return statusElement;
}

function setupAutoRefresh() {
  chrome.storage.local.get(['refreshInterval'], function(result) {
    if (result.refreshInterval) {
      secondsUntilRefresh = result.refreshInterval;
    }
    
    clearInterval(refreshInterval);
    clearInterval(countdownInterval);
    
    refreshInterval = setInterval(() => {
      getRealGoldPrice();
    }, secondsUntilRefresh * 1000);
    
    countdownInterval = setInterval(updateCountdown, 1000);
    updateCountdown();
  });
}

function updateCountdown() {
  const countdownElement = document.getElementById('countdown');
  if (countdownElement) {
    countdownElement.textContent = `${secondsUntilRefresh}秒后刷新`;
    secondsUntilRefresh--;
    
    if (secondsUntilRefresh < 0) {
      secondsUntilRefresh = 30; // 重置为默认值
    }
  }
}

// 清理定时器
window.addEventListener('beforeunload', function() {
  clearInterval(refreshInterval);
  clearInterval(countdownInterval);
});