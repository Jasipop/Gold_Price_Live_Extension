// background.js - 使用统一数据源

// 监听来自popup的请求
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getGoldPrice") {
    console.log('收到获取金价请求');
    fetchGoldPrices()
      .then(prices => {
        console.log('成功获取金价:', prices);
        sendResponse({ success: true, ...prices });
      })
      .catch(error => {
        console.error('获取金价失败:', error);
        sendResponse({ 
          success: false, 
          error: error.message
        });
      });
    return true;
  }
});

// 单位转换函数
function convertToGram(pricePerOunce) {
  try {
    console.log('转换价格:', pricePerOunce);
    
    if (!pricePerOunce || typeof pricePerOunce !== 'string') {
      throw new Error('价格参数无效');
    }
    
    const ouncesPerGram = 31.1034768;
    const cleanPrice = pricePerOunce.replace(/[^\d.]/g, '');
    const priceNum = parseFloat(cleanPrice);
    
    if (isNaN(priceNum)) {
      throw new Error(`价格格式无效: "${pricePerOunce}"`);
    }
    
    const pricePerGram = priceNum / ouncesPerGram;
    return pricePerGram.toFixed(2);
  } catch (error) {
    console.error('单位转换错误:', error);
    throw error;
  }
}

// 从exchangerates.org.uk获取美元价格
async function fetchUSDPrice() {
  console.log('开始获取美元价格...');
  try {
    const response = await fetch('https://www.exchangerates.org.uk/commodities/live-gold-prices.html?iso=USD');
    
    if (!response.ok) {
      throw new Error(`HTTP错误! 状态: ${response.status}`);
    }

    const html = await response.text();
    console.log('获取到美元价格HTML，长度:', html.length);

    // 查找美元价格
    const priceMatch = html.match(/<span class="price" id="p_XAUUSD">([^<]+)<\/span>/);
    
    if (priceMatch && priceMatch[1]) {
      const price = priceMatch[1].trim();
      console.log('找到美元价格:', price);
      return price;
    } else {
      throw new Error('无法找到美元价格元素');
    }
  } catch (error) {
    console.error('获取美元价格失败:', error);
    throw new Error(`美元价格获取失败: ${error.message}`);
  }
}

// 从exchangerates.org.uk获取人民币价格
async function fetchCNYPrice() {
  console.log('开始获取人民币价格...');
  try {
    const response = await fetch('https://www.exchangerates.org.uk/commodities/live-gold-prices.html?iso=CNY');
    
    if (!response.ok) {
      throw new Error(`HTTP错误! 状态: ${response.status}`);
    }

    const html = await response.text();
    console.log('获取到人民币价格HTML，长度:', html.length);

    // 查找人民币价格
    const priceMatch = html.match(/<span class="price" id="p_XAUUSD">([^<]+)<\/span>/);
    
    if (priceMatch && priceMatch[1]) {
      const pricePerOunce = priceMatch[1].trim();
      console.log('找到人民币/盎司价格:', pricePerOunce);
      
      // 转换为克
      const pricePerGram = convertToGram(pricePerOunce);
      console.log('转换后人民币/克价格:', pricePerGram);
      
      return pricePerGram;
    } else {
      throw new Error('无法找到人民币价格元素');
    }
  } catch (error) {
    console.error('获取人民币价格失败:', error);
    throw new Error(`人民币价格获取失败: ${error.message}`);
  }
}

// 主函数：获取金价
async function fetchGoldPrices() {
  console.log('开始获取金价数据...');
  
  try {
    // 并行获取美元和人民币价格
    const [usdPrice, cnyPrice] = await Promise.all([
      fetchUSDPrice(),
      fetchCNYPrice()
    ]);

    console.log('最终价格 - 人民币:', cnyPrice, '美元:', usdPrice);
    
    return {
      pricePerGramCNY: cnyPrice,
      pricePerOunceUSD: usdPrice,
      source: 'real'
    };
  } catch (error) {
    console.error('获取金价失败，使用估算值:', error);
    
    // 返回估算值
    return {
      pricePerGramCNY: "507.32",
      pricePerOunceUSD: "2324.56",
      source: 'estimated',
      error: error.message
    };
  }
}