const PAGE_SIZE = 5;
let historyList = [];
let currentPage = 1;

// 3D 場景相關變數
let scene, camera, renderer;
let cssScene, cssRenderer;
let cards = [];
let cssCards = [];
let animationId;
let preloadedTextures = {}; // 預載入的材質快取

// 抽獎狀態管理
let isDrawing = false;

// 效能監控變數
let performanceMonitor = {
  frames: 0,
  lastTime: 0,
  fps: 60,
  lowFpsCount: 0,
  performanceDegraded: false,
  fpsHistory: []
};

// 檢測效能並自動降級
function checkPerformanceAndDegrade() {
  const now = performance.now();
  const delta = now - performanceMonitor.lastTime;
  
  if (delta >= 1000) { // 每秒檢測一次
    performanceMonitor.fps = Math.round((performanceMonitor.frames * 1000) / delta);
    performanceMonitor.fpsHistory.push(performanceMonitor.fps);
    
    // 保持最近 5 秒的 FPS 記錄
    if (performanceMonitor.fpsHistory.length > 5) {
      performanceMonitor.fpsHistory.shift();
    }
    
    // 計算平均 FPS
    const avgFPS = performanceMonitor.fpsHistory.reduce((a, b) => a + b, 0) / performanceMonitor.fpsHistory.length;
    
    // 如果平均 FPS 低於 30 且未降級
    if (avgFPS < 30 && !performanceMonitor.performanceDegraded) {
      performanceMonitor.lowFpsCount++;
      console.warn(`Low FPS detected: ${avgFPS.toFixed(1)} FPS (count: ${performanceMonitor.lowFpsCount})`);
      
      // 連續 3 次低 FPS 則啟動降級
      if (performanceMonitor.lowFpsCount >= 3) {
        degradePerformance();
      }
    } else {
      performanceMonitor.lowFpsCount = 0; // 重置低 FPS 計數
    }
    
    performanceMonitor.frames = 0;
    performanceMonitor.lastTime = now;
  }
  
  performanceMonitor.frames++;
}

// 效能降級函數
function degradePerformance() {
  performanceMonitor.performanceDegraded = true;
  console.log('🚨 Performance degradation activated - switching to simplified rendering');
  
  // 顯示用戶通知
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 9999;
    background: #ff9800; color: white; padding: 12px 16px;
    border-radius: 4px; font-size: 14px; max-width: 300px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `;
  notification.innerHTML = '⚡ 為優化效能，已切換至簡化渲染模式';
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 5000);
  
  // 實施降級策略
  if (renderer) {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1)); // 降低像素比
    renderer.antialias = false; // 關閉抗鋸齒
  }
  
  // 減少粒子效果
  if (cards) {
    cards.forEach(card => {
      if (card.material && card.material.transparent) {
        card.material.transparent = false; // 關閉透明度
      }
    });
  }
}

// 預載入 3D 資源
async function preloadResources() {
  try {
    // 預載入 moda 品牌 logo 圖片
    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';
    logoImg.src = 'https://yt3.googleusercontent.com/D9Q7NjE7vztVgb0c2-OwofJtZOdFjghZWLw0Yj17dW9X9oMrve4Xt-16vN4tOvAvxcRu43TR=s900-c-k-c0x00ffffff-no-rj';
    
    await new Promise((resolve) => {
      logoImg.onload = () => {
        // 圖片載入成功後創建材質
        preloadedTextures.logoMaterial = createLogoTexture();
        resolve();
      };
      logoImg.onerror = () => {
        // 即使圖片載入失敗，也創建後備材質
        preloadedTextures.logoMaterial = createLogoTexture();
        resolve();
      };
    });
    
    console.log('3D resources preloaded successfully');
  } catch (error) {
    console.warn('Some resources failed to preload:', error);
    // 確保即使出錯也有後備材質
    preloadedTextures.logoMaterial = createLogoTexture();
  }
}

// 初始化 3D 場景
function initThreeScene() {
  const canvas = document.getElementById('three-canvas');
  
  // 創建場景
  scene = new THREE.Scene();
  
  // 創建攝影機 - 優化裁剪面設定防止面分離
  camera = new THREE.PerspectiveCamera(
    45, // 縮小視角 (FOV)，類似長焦鏡頭，放大主體
    window.innerWidth / window.innerHeight, // 長寬比
    0.5, // 稍微增加近裁剪面以避免 z-fighting
    1000 // 遠裁剪面
  );
  camera.position.z = 3.5; // 攝影機稍微靠近
  
  // 創建渲染器 - 針對超高品質文字優化
  renderer = new THREE.WebGLRenderer({ 
    canvas: canvas,
    alpha: true, // 透明背景
    antialias: true, // 抗鋸齒
    powerPreference: "high-performance", // 高效能
    precision: "highp", // 高精度
    stencil: false,
    depth: true,
    logarithmicDepthBuffer: false,
    preserveDrawingBuffer: false // 優化性能
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  // 對於超高品質文字，使用完整的設備像素比
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 降低以防止問題
  renderer.outputEncoding = THREE.sRGBEncoding;
  
  // 防止面分離的重要設定
  renderer.sortObjects = true; // 確保物件正確排序
  renderer.autoClear = true;
  
  // 新增：深度緩衝優化，防止 z-fighting 和面分離
  renderer.shadowMap.enabled = false; // 禁用陰影以提升性能
  renderer.physicallyCorrectLights = false;
  
  // 優化深度測試設定
  if (renderer.capabilities.floatVertexTextures) {
    renderer.precision = 'highp';
  }
  
  // 啟用更好的材質過濾
  renderer.capabilities.getMaxAnisotropy && 
  renderer.capabilities.getMaxAnisotropy() > 1 && 
  (renderer.anisotropySupport = renderer.capabilities.getMaxAnisotropy());
  
  // 設置 canvas 樣式
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '1';
  
  // 渲染器分離測試模式 - 用於隔離 Safari 混合渲染問題
  const renderTestMode = window.location.search.includes('render=');
  const webglOnly = window.location.search.includes('render=webgl');
  const css3dOnly = window.location.search.includes('render=css3d');

  // 創建 CSS3D 場景和渲染器（用於清晰文字）
  if (typeof THREE.CSS3DRenderer !== 'undefined' && !webglOnly) {
    cssScene = new THREE.Scene();
    cssRenderer = new THREE.CSS3DRenderer();
    cssRenderer.setSize(window.innerWidth, window.innerHeight);
    cssRenderer.domElement.style.position = 'absolute';
    cssRenderer.domElement.style.top = '0';
    cssRenderer.domElement.style.left = '0';
    cssRenderer.domElement.style.pointerEvents = 'none';
    cssRenderer.domElement.style.zIndex = '2'; // 在 WebGL 之上
    
    // 將 CSS3D 渲染器添加到 overlay
    const overlay = document.getElementById('overlay');
    overlay.appendChild(cssRenderer.domElement);
    console.log('CSS3DRenderer loaded successfully', { renderTestMode, webglOnly, css3dOnly });
  } else {
    console.info('CSS3DRenderer not available or disabled, using enhanced WebGL-only mode');
    cssScene = null;
    cssRenderer = null;
  }

  if (renderTestMode) {
    console.log(`Safari 渲染測試模式: ${webglOnly ? 'WebGL Only' : css3dOnly ? 'CSS3D Only' : 'Mixed Mode'}`);
  }
  
  // 加入基本光照
  const ambientLight = new THREE.AmbientLight(0x404040, 0.6); // 環境光
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); // 平行光
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);
}

// 創建超高品質文字材質的函數 (SDF-like approach) - moda 黑白黃主題
// Safari 用戶代理檢測
function isSafari() {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

function createUltraTextTexture(text, fontSize = 48, textColor = '#1a1a1a', bgColor = '#FFD700') {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  // 優化解析度：平衡品質與性能
  const superRes = 3; // 降低超採樣倍數提升性能
  const baseWidth = 1024; // 降低基礎解析度
  const baseHeight = 512;
  canvas.width = baseWidth * superRes;
  canvas.height = baseHeight * superRes;
  
  // 設置背景
  context.fillStyle = bgColor;
  context.fillRect(0, 0, canvas.width, canvas.height);
  
  // 啟用所有可用的渲染優化
  context.textRenderingOptimization = 'optimizeQuality';
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.mozImageSmoothingEnabled = true;
  context.webkitImageSmoothingEnabled = true;
  context.msImageSmoothingEnabled = true;
  
  // 設置極高品質的文字樣式
  const scaledFontSize = fontSize * 4 * superRes;
  context.fillStyle = textColor;
  context.font = `bold ${scaledFontSize}px 'SF Pro Display', 'PingFang TC', 'Noto Sans TC', 'Microsoft JhengHei', 'Helvetica Neue', Arial, sans-serif`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  
  // 添加外描邊以增強清晰度 - moda 主題
  context.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  context.lineWidth = 3 * superRes;
  context.strokeText(text, canvas.width / 2, canvas.height / 2);
  
  // 添加細微內描邊
  context.strokeStyle = 'rgba(0, 0, 0, 0.2)';
  context.lineWidth = 1 * superRes;
  context.strokeText(text, canvas.width / 2, canvas.height / 2);
  
  // 繪製主文字
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  
  // 創建材質
  const texture = new THREE.CanvasTexture(canvas);
  
  // 優化材質設定
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.format = THREE.RGBAFormat;
  
  // Safari 專屬 flipY 調整
  texture.flipY = isSafari() ? true : false;
  
  // 強制更新紋理 - 修復 Safari 快取問題
  texture.needsUpdate = true;
  
  // 如果支持各向異性過濾，啟用最高級別
  if (renderer && renderer.capabilities) {
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    if (maxAnisotropy > 1) {
      texture.anisotropy = maxAnisotropy;
    }
  }
  
  return new THREE.MeshBasicMaterial({ 
    map: texture,
    transparent: true,
    alphaTest: 0.1,
    side: THREE.DoubleSide
  });
}

// 創建完美清晰的 CSS3D 文字卡片
function createCSSCard(winnerName) {
  // 檢測暗色主題
  const isDarkMode = document.body.classList.contains('dark');
  
  // 創建 HTML 元素
  const cardElement = document.createElement('div');
  cardElement.className = 'css-card';
  cardElement.innerHTML = `
    <div class="card-front">
      <div class="card-content">
        <div class="card-text">${winnerName}</div>
        <div class="card-decoration">moda</div>
      </div>
    </div>
    <div class="card-back">
      <div class="logo-container">
        <div class="logo-circle">
          <div class="logo-text">moda</div>
          <div class="logo-subtitle">LUCKY DRAW</div>
        </div>
        <div class="decoration-dots"></div>
      </div>
    </div>
  `;
  
  // 卡片主容器樣式
  cardElement.style.width = '400px';
  cardElement.style.height = '240px';
  cardElement.style.position = 'relative';
  cardElement.style.transformStyle = 'preserve-3d';
  cardElement.style.borderRadius = '16px';
  cardElement.style.overflow = 'hidden';
  
  // 正面樣式 - moda 黃色主題
  const cardFront = cardElement.querySelector('.card-front');
  cardFront.style.position = 'absolute';
  cardFront.style.width = '100%';
  cardFront.style.height = '100%';
  cardFront.style.background = 'linear-gradient(135deg, #FFD700, #FFA500)';
  cardFront.style.borderRadius = '16px';
  cardFront.style.boxShadow = '0 15px 35px rgba(255,215,0,0.4)';
  cardFront.style.display = 'flex';
  cardFront.style.alignItems = 'center';
  cardFront.style.justifyContent = 'center';
  cardFront.style.backfaceVisibility = 'hidden';
  cardFront.style.border = '3px solid rgba(255,255,255,0.6)';
  
  // 背面樣式 - moda 黑白主題
  const cardBack = cardElement.querySelector('.card-back');
  cardBack.style.position = 'absolute';
  cardBack.style.width = '100%';
  cardBack.style.height = '100%';
  cardBack.style.background = isDarkMode ?
    'radial-gradient(circle at center, #1a1a1a 0%, #000000 70%, #000000 100%)' :
    'radial-gradient(circle at center, #ffffff 0%, #f8f9fa 70%, #e9ecef 100%)';
  cardBack.style.borderRadius = '16px';
  cardBack.style.boxShadow = '0 15px 35px rgba(0,0,0,0.3)';
  cardBack.style.display = 'flex';
  cardBack.style.alignItems = 'center';
  cardBack.style.justifyContent = 'center';
  cardBack.style.backfaceVisibility = 'hidden';
  cardBack.style.transform = 'rotateY(180deg)';
  cardBack.style.border = '3px solid rgba(255,215,0,0.5)';
  
  // Logo 容器
  const logoContainer = cardElement.querySelector('.logo-container');
  logoContainer.style.position = 'relative';
  logoContainer.style.width = '100%';
  logoContainer.style.height = '100%';
  logoContainer.style.display = 'flex';
  logoContainer.style.alignItems = 'center';
  logoContainer.style.justifyContent = 'center';
  
  // Logo 圓形背景 - 增強 moda 黃色主題
  const logoCircle = cardElement.querySelector('.logo-circle');
  logoCircle.style.position = 'relative';
  logoCircle.style.width = '160px';
  logoCircle.style.height = '160px';
  logoCircle.style.background = 'radial-gradient(circle, #FFD700 0%, #FFED4E 30%, #FFA500 100%)'; // 更豐富的漸層
  logoCircle.style.borderRadius = '50%';
  logoCircle.style.display = 'flex';
  logoCircle.style.flexDirection = 'column';
  logoCircle.style.alignItems = 'center';
  logoCircle.style.justifyContent = 'center';
  logoCircle.style.boxShadow = '0 12px 30px rgba(255,215,0,0.7), inset 0 4px 15px rgba(255,255,255,0.4), 0 0 20px rgba(255,215,0,0.3)'; // 更強烈的光暈
  logoCircle.style.border = '4px solid rgba(255,255,255,0.9)'; // 更明顯的邊框
  
  // Logo 文字 - moda 白色字體
  const logoText = cardElement.querySelector('.logo-text');
  logoText.style.color = '#ffffff';
  logoText.style.fontSize = '32px'; // 稍微增大字體
  logoText.style.fontWeight = '900'; // 更粗的字體
  logoText.style.fontFamily = "'SF Pro Display', 'PingFang TC', 'Noto Sans TC', 'Microsoft JhengHei', sans-serif";
  logoText.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5), 0 0 8px rgba(0,0,0,0.3)'; // 更強烈的陰影
  logoText.style.letterSpacing = '2px'; // 增加字母間距
  
  // Logo 副標題
  const logoSubtitle = cardElement.querySelector('.logo-subtitle');
  logoSubtitle.style.color = 'rgba(255,255,255,0.9)'; // 改為白色
  logoSubtitle.style.fontSize = '12px'; // 稍微增大
  logoSubtitle.style.fontWeight = 'bold';
  logoSubtitle.style.fontFamily = "'SF Pro Display', 'PingFang TC', 'Noto Sans TC', sans-serif";
  logoSubtitle.style.marginTop = '4px'; // 增加間距
  logoSubtitle.style.letterSpacing = '3px'; // 增加字母間距
  logoSubtitle.style.textShadow = '1px 1px 2px rgba(0,0,0,0.5)'; // 添加陰影
  
  // 正面內容樣式
  const cardContent = cardElement.querySelector('.card-content');
  cardContent.style.display = 'flex';
  cardContent.style.flexDirection = 'column';
  cardContent.style.alignItems = 'center';
  cardContent.style.gap = '10px';
  
  const cardText = cardElement.querySelector('.card-text');
  cardText.style.color = '#1a1a1a';
  cardText.style.fontSize = '32px';
  cardText.style.fontWeight = 'bold';
  cardText.style.fontFamily = "'PingFang TC', 'Noto Sans TC', 'Microsoft JhengHei', sans-serif";
  cardText.style.textShadow = '1px 1px 2px rgba(255,255,255,0.5)';
  cardText.style.letterSpacing = '1px';
  
  const cardDecoration = cardElement.querySelector('.card-decoration');
  cardDecoration.style.fontSize = '28px'; // 增大字體
  cardDecoration.style.fontWeight = '900'; // 更粗字體
  cardDecoration.style.color = '#ffffff'; // 白色文字
  cardDecoration.style.textShadow = '2px 2px 4px rgba(0,0,0,0.7), 0 0 12px rgba(255,215,0,0.5)'; // 強烈陰影 + 金色光暈
  cardDecoration.style.letterSpacing = '3px'; // 增加字母間距
  cardDecoration.style.opacity = '0.95'; // 稍微提高不透明度
  cardDecoration.style.fontFamily = "'SF Pro Display', 'PingFang TC', 'Noto Sans TC', 'Microsoft JhengHei', sans-serif";
  
  // 創建 CSS3D 物件
  const cssObject = new THREE.CSS3DObject(cardElement);
  
  // 設置初始變換
  cssObject.scale.set(0.006, 0.006, 0.006); // 調整到合適的 3D 空間大小
  
  return cssObject;
}

// 繪製精美的後備 Logo
function drawFallbackLogo(context) {
  const centerX = 512;
  const centerY = 256;
  
  // 檢測暗色主題
  const isDarkMode = document.body.classList.contains('dark');
  
  // 設置高品質的背景漸層
  const bgGradient = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, 400);
  if (isDarkMode) {
    bgGradient.addColorStop(0, '#161b22');
    bgGradient.addColorStop(0.7, '#0d1117');
    bgGradient.addColorStop(1, '#010409');
  } else {
    bgGradient.addColorStop(0, '#ffffff');
    bgGradient.addColorStop(0.7, '#f8f9fa');
    bgGradient.addColorStop(1, '#e9ecef');
  }
  context.fillStyle = bgGradient;
  context.fillRect(0, 0, 1024, 512);
  
  // 主要圓形背景 - 更大更現代
  context.beginPath();
  context.arc(centerX, centerY, 140, 0, Math.PI * 2);
  const mainGradient = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, 140);
  if (isDarkMode) {
    mainGradient.addColorStop(0, '#00d260');
    mainGradient.addColorStop(1, '#00b851');
  } else {
    mainGradient.addColorStop(0, '#2ECC71');
    mainGradient.addColorStop(1, '#27AE60');
  }
  context.fillStyle = mainGradient;
  context.fill();
  
  // 內圈裝飾圓
  context.beginPath();
  context.arc(centerX, centerY, 100, 0, Math.PI * 2);
  context.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  context.lineWidth = 2;
  context.stroke();
  
  // 高光效果
  context.beginPath();
  context.arc(centerX - 40, centerY - 40, 80, 0, Math.PI * 2);
  const glossGradient = context.createRadialGradient(centerX - 40, centerY - 40, 0, centerX - 40, centerY - 40, 80);
  glossGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
  glossGradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.1)');
  glossGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  context.fillStyle = glossGradient;
  context.fill();
  
  // 品牌名稱 "moda" - 更現代的字體
  context.fillStyle = '#ffffff';
  context.font = 'bold 68px "SF Pro Display", "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  
  // 強化文字陰影
  context.shadowColor = 'rgba(0, 0, 0, 0.6)';
  context.shadowOffsetX = 3;
  context.shadowOffsetY = 3;
  context.shadowBlur = 6;
  
  context.fillText('moda', centerX, centerY - 10);
  
  // 清除陰影設定
  context.shadowColor = 'transparent';
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 0;
  context.shadowBlur = 0;
  
  // 副標題
  context.fillStyle = 'rgba(255, 255, 255, 0.9)';
  context.font = 'bold 24px "SF Pro Display", "PingFang TC", "Noto Sans TC", sans-serif';
  context.fillText('LUCKY DRAW', centerX, centerY + 40);
  
  // 裝飾性小圓點 - 更精緻的排列
  const decorationPoints = [
    { x: centerX - 80, y: centerY - 80, size: 6 },
    { x: centerX + 80, y: centerY - 80, size: 6 },
    { x: centerX - 80, y: centerY + 80, size: 6 },
    { x: centerX + 80, y: centerY + 80, size: 6 },
    { x: centerX, y: centerY - 110, size: 4 },
    { x: centerX, y: centerY + 110, size: 4 },
    { x: centerX - 110, y: centerY, size: 4 },
    { x: centerX + 110, y: centerY, size: 4 }
  ];
  
  decorationPoints.forEach(point => {
    context.beginPath();
    context.arc(point.x, point.y, point.size, 0, Math.PI * 2);
    context.fillStyle = 'rgba(255, 255, 255, 0.8)';
    context.fill();
    
    // 小光暈效果
    context.beginPath();
    context.arc(point.x, point.y, point.size * 1.5, 0, Math.PI * 2);
    context.fillStyle = 'rgba(255, 255, 255, 0.2)';
    context.fill();
  });
  
  // 外圈裝飾環
  context.beginPath();
  context.arc(centerX, centerY, 160, 0, Math.PI * 2);
  context.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  context.lineWidth = 3;
  context.stroke();
}

// 創建 Logo 材質的函數
function createLogoTexture() {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  // 提高解析度
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = 1024 * pixelRatio;
  canvas.height = 512 * pixelRatio;
  canvas.style.width = '1024px';
  canvas.style.height = '512px';
  
  // 縮放 context
  context.scale(pixelRatio, pixelRatio);
  
  // 設置背景顏色
  context.fillStyle = '#f8f9fa';
  context.fillRect(0, 0, 1024, 512);
  
  // 啟用圖片反鋸齒
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  
  // 創建紋理
  const texture = new THREE.CanvasTexture(canvas);
  
  // 嘗試載入實際 Logo 圖片
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = function() {
    // 圖片載入成功，繪製到 canvas 上
    const scale = Math.min(1024 / img.width, 512 / img.height) * 0.8;
    const width = img.width * scale;
    const height = img.height * scale;
    const x = (1024 - width) / 2;
    const y = (512 - height) / 2;
    
    context.drawImage(img, x, y, width, height);
    
    // 強制更新紋理 - 修復 Safari 非同步載入問題
    texture.needsUpdate = true;
  };
  img.onerror = function() {
    // 圖片載入失敗，使用精美的後備設計
    drawFallbackLogo(context);
    
    // 強制更新紋理
    texture.needsUpdate = true;
  };
  
  // 載入實際 Logo
  img.src = 'https://yt3.googleusercontent.com/D9Q7NjE7vztVgb0c2-OwofJtZOdFjghZWLw0Yj17dW9X9oMrve4Xt-16vN4tOvAvxcRu43TR=s900-c-k-c0x00ffffff-no-rj';
  
  // 先設置預設內容
  drawFallbackLogo(context);
  
  // 啟用 Mipmap 生成以獲得更好的渲染品質
  texture.generateMipmaps = true;
  
  // 使用最高品質的 Mipmap 篩選器
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.format = THREE.RGBAFormat;
  
  // Safari 專屬 flipY 調整
  texture.flipY = isSafari() ? true : false;
  
  // 初始強制更新紋理
  texture.needsUpdate = true;
  
  return new THREE.MeshBasicMaterial({ 
    map: texture,
    transparent: true,
    alphaTest: 0.1,
    side: THREE.DoubleSide
  });
}

// 創建 3D 卡牌的工廠函式 - 性能優化版本
function createWinnerCard(winnerName) {
  // 優化尺寸：在品質和性能間平衡，增加厚度防止面分離
  const cardWidth = 2.0; // 稍微縮小以提升性能
  const cardHeight = 1.2;
  const cardDepth = 0.08; // 增加厚度以避免 z-fighting 和面分離
  
  // 修正：使用最簡單的幾何體設定，避免面分離
  const geometry = new THREE.BoxGeometry(cardWidth, cardHeight, cardDepth);
  
  // 確保幾何體是一個整體，防止面分離
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  
  // 新增：確保頂點完整性以防止面分離
  geometry.computeVertexNormals();
  geometry.normalizeNormals();
  
  // 修正材質映射：確保材質正確對應到各個面
  const sideMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xFFD700,
    transparent: false,
    side: THREE.FrontSide
  }); // moda 黃色側面
  
  // 正確創建正面和背面材質
  const frontMaterial = createUltraTextTexture(winnerName, 60, '#1a1a1a', '#FFD700');
  let backMaterial;
  
  // 安全獲取背面材質
  try {
    backMaterial = preloadedTextures.logoMaterial || createLogoTexture();
  } catch (error) {
    console.warn('Failed to create logo material, using fallback:', error);
    backMaterial = new THREE.MeshBasicMaterial({ color: 0x1a1a1a }); // 黑色後備
  }
  
  // 驗證材質創建成功
  if (!frontMaterial || !backMaterial) {
    console.error('Material creation failed for card:', winnerName);
    return null;
  }
  
  // 色塊材質測試模式 - 用於驗證 Safari 材質映射
  const debugMode = window.location.search.includes('debug=materials');
  
  let materials;
  if (debugMode) {
    // 6色測試材質驗證 BoxGeometry 面對應
    const testColors = [
      new THREE.MeshBasicMaterial({ color: 0xFF0000, side: THREE.DoubleSide }), // 0: 紅色 - 右面 (+X)
      new THREE.MeshBasicMaterial({ color: 0x00FF00, side: THREE.DoubleSide }), // 1: 綠色 - 左面 (-X)
      new THREE.MeshBasicMaterial({ color: 0x0000FF, side: THREE.DoubleSide }), // 2: 藍色 - 上面 (+Y)
      new THREE.MeshBasicMaterial({ color: 0xFFFF00, side: THREE.DoubleSide }), // 3: 黃色 - 下面 (-Y)
      new THREE.MeshBasicMaterial({ color: 0xFF00FF, side: THREE.DoubleSide }), // 4: 洋紅 - 前面 (+Z) - 應顯示文字
      new THREE.MeshBasicMaterial({ color: 0x00FFFF, side: THREE.DoubleSide })  // 5: 青色 - 後面 (-Z) - 應顯示 Logo
    ];
    materials = testColors;
    console.log('Debug mode: Using 6-color test materials for Safari compatibility verification');
  } else {
    // THREE.js BoxGeometry 標準面順序映射
    materials = [
      sideMaterial,   // 0: 右面 (+X)
      sideMaterial,   // 1: 左面 (-X) 
      sideMaterial,   // 2: 上面 (+Y)
      sideMaterial,   // 3: 下面 (-Y)
      frontMaterial,  // 4: 前面 (+Z) - 文字面
      backMaterial    // 5: 後面 (-Z) - Logo 面
    ];
  }
  
  console.log(`Created materials for card: ${winnerName}`, {
    frontMaterial: frontMaterial.map ? 'with texture' : 'basic material',
    backMaterial: backMaterial.map ? 'with texture' : 'basic material',
    isSafari: isSafari(),
    debugMode: debugMode
  });
  
  // 驗證所有材質都正確創建
  const invalidMaterials = materials.filter(mat => !mat || typeof mat.dispose !== 'function');
  if (invalidMaterials.length > 0) {
    console.error('Invalid materials detected:', invalidMaterials);
    return null;
  }
  
  // 創建網格
  const card = new THREE.Mesh(geometry, materials);
  
  // 確保卡片正確初始化
  if (!card) {
    console.error('Failed to create card mesh for:', winnerName);
    return null;
  }
  
  // 設置卡片屬性以提升渲染品質和防止面分離
  card.castShadow = false; // 優化性能
  card.receiveShadow = false;
  card.frustumCulled = true; // 啟用視錐體剔除
  
  // 新增：設置渲染順序防止面分離
  card.renderOrder = 1; // 確保卡片在正確的渲染順序
  card.matrixAutoUpdate = true; // 確保矩陣自動更新
  
  return card;
}

// 動畫循環 (簡化版)
// 全域變數存儲爆炸粒子和時間
let explosionParticles = [];
let lastTime = performance.now();

function animate() {
  // 這個 ID 會在 stopAnimation 被清除，所以這是循環的條件
  animationId = requestAnimationFrame(animate);

  // 效能監控
  checkPerformanceAndDegrade();

  // 計算 deltaTime
  const currentTime = performance.now();
  const deltaTime = (currentTime - lastTime) / 1000; // 轉換為秒
  lastTime = currentTime;

  // 如果有動畫庫（TWEEN.js），更新補間動畫
  if (typeof TWEEN !== 'undefined') {
    TWEEN.update();
  }
  
  // 更新螢幕震動效果
  updateCameraShake(deltaTime);
  
  // 更新爆炸粒子動畫
  if (explosionParticles.length > 0) {
    updateExplosionParticles(explosionParticles, deltaTime);
  }

  // 渲染器分離測試 - 用於 Safari 相容性除錯
  const renderTestMode = window.location.search.includes('render=');
  const webglOnly = window.location.search.includes('render=webgl');
  const css3dOnly = window.location.search.includes('render=css3d');

  // 渲染 WebGL 場景（背景和效果）
  if (renderer && scene && camera && !css3dOnly) {
    renderer.render(scene, camera);
  }

  // 渲染 CSS3D 場景（清晰文字）
  if (cssRenderer && cssScene && camera && !webglOnly) {
    cssRenderer.render(cssScene, camera);
  }
}

// 停止動畫循環
function stopAnimation() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

// 清理 3D 場景
function cleanupThreeScene() {
  // stopAnimation(); // 移到 showCardShowerAnimation 的結尾處呼叫，避免重複
  
  // 清理 WebGL 卡牌 - 強化 GPU 記憶體管理
  cards.forEach((card, index) => {
    try {
      // 清理幾何體
      if (card.geometry) {
        card.geometry.dispose();
        card.geometry = null;
      }
      
      // 清理材質和紋理
      if (card.material) {
        if (Array.isArray(card.material)) {
          card.material.forEach((mat, matIndex) => {
            try {
              // 清理紋理
              if (mat.map) {
                mat.map.dispose();
                mat.map = null;
              }
              // 清理其他可能的紋理
              if (mat.normalMap) {
                mat.normalMap.dispose();
                mat.normalMap = null;
              }
              if (mat.roughnessMap) {
                mat.roughnessMap.dispose();
                mat.roughnessMap = null;
              }
              if (mat.metalnessMap) {
                mat.metalnessMap.dispose();
                mat.metalnessMap = null;
              }
              // 清理材質本身
              mat.dispose();
            } catch (error) {
              console.warn(`Failed to dispose material ${matIndex} for card ${index}:`, error);
            }
          });
        } else {
          try {
            // 清理單一材質的所有紋理
            if (card.material.map) {
              card.material.map.dispose();
              card.material.map = null;
            }
            if (card.material.normalMap) {
              card.material.normalMap.dispose();
              card.material.normalMap = null;
            }
            if (card.material.roughnessMap) {
              card.material.roughnessMap.dispose();
              card.material.roughnessMap = null;
            }
            if (card.material.metalnessMap) {
              card.material.metalnessMap.dispose();
              card.material.metalnessMap = null;
            }
            card.material.dispose();
          } catch (error) {
            console.warn(`Failed to dispose material for card ${index}:`, error);
          }
        }
        card.material = null;
      }
      
      // 從場景移除
      if (scene && card) {
        scene.remove(card);
      }
      
      // 清理用戶數據
      if (card.userData) {
        card.userData = null;
      }
      
    } catch (error) {
      console.warn(`Failed to cleanup WebGL card at index ${index}:`, error);
    }
  });
  cards = [];
  
  // 清理 CSS3D 卡牌 - 強化穩定性
  cssCards.forEach((cssCard, index) => {
    try {
      // 從 CSS3D 場景移除
      if (cssScene && cssCard) {
        cssScene.remove(cssCard);
      }
      // 從 DOM 移除元素
      if (cssCard && cssCard.element) {
        const element = cssCard.element;
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
        // 確保事件監聽器也被清理
        element.onclick = null;
        element.onmousedown = null;
        element.onmouseup = null;
      }
    } catch (error) {
      console.warn(`Failed to cleanup CSS3D card at index ${index}:`, error);
    }
  });
  cssCards = [];
  
  // 額外清理：移除任何殘留的 CSS 卡片元素 - 多層保護
  try {
    const overlay = document.getElementById('overlay');
    if (overlay) {
      // 清理 .css-card 元素
      const cssCardElements = overlay.querySelectorAll('.css-card');
      cssCardElements.forEach((element, index) => {
        try {
          if (element.parentNode) {
            element.parentNode.removeChild(element);
          }
        } catch (error) {
          console.warn(`Failed to remove CSS card element at index ${index}:`, error);
        }
      });
      
      // 清理可能的 CSS3D 渲染器 DOM 節點
      const css3dElements = overlay.querySelectorAll('[style*="transform-style"]');
      css3dElements.forEach(element => {
        if (element.classList.contains('css-card') || 
            element.querySelector('.css-card')) {
          try {
            element.remove();
          } catch (error) {
            console.warn('Failed to remove CSS3D element:', error);
          }
        }
      });
    }
  } catch (error) {
    console.warn('Failed during additional CSS card cleanup:', error);
  }
  
  // 清理渲染器
  if (renderer) {
    renderer.dispose();
    renderer = null;
  }
  
  if (cssRenderer && cssRenderer.domElement) {
    const overlay = document.getElementById('overlay');
    if (overlay && cssRenderer.domElement.parentNode === overlay) {
      overlay.removeChild(cssRenderer.domElement);
    }
    cssRenderer = null;
  }
  
  // 清理場景和攝影機
  scene = null;
  cssScene = null;
  camera = null;
}

// 計算最終網格佈局位置 (V3 - 精準計算邊界)
function calculateGridLayout(cardCount) {
  // --- 1. 計算攝影機在 Z=0 平面上的可視範圍 ---
  const fovInRadians = (camera.fov * Math.PI) / 180;
  const visibleHeight = 2 * Math.tan(fovInRadians / 2) * camera.position.z;
  const visibleWidth = visibleHeight * camera.aspect;

  // --- 2. 初始佈局計算 ---
  const positions = [];
  const cardBaseWidth = 2.5;
  const cardBaseHeight = 1.5;
  const padding = 0.5;
  const cardWidthWithPadding = cardBaseWidth + padding;
  const cardHeightWithPadding = cardBaseHeight + padding;

  const maxCols = Math.floor(visibleWidth / cardWidthWithPadding);
  const cols = Math.min(cardCount, maxCols > 0 ? maxCols : 1);
  const rows = Math.ceil(cardCount / cols);

  // --- 3. [最終修正] 精準計算網格佔用的實際空間 ---
  // 佔用寬度 = (欄數-1)*間距 + 卡牌自身寬度
  // 佔用高度 = (列數-1)*間距 + 卡牌自身高度
  const occupiedWidth = (cols - 1) * cardWidthWithPadding + cardBaseWidth;
  const occupiedHeight = (rows - 1) * cardHeightWithPadding + cardBaseHeight;

  // --- 4. 檢測是否超出可視範圍並計算縮放比例 ---
  let scale = 1.0;
  // 為了留出邊界，我們用 90% 的可視範圍來比較
  const safeVisibleWidth = visibleWidth * 0.9;
  const safeVisibleHeight = visibleHeight * 0.9;
  
  // 使用修正後的佔用寬高進行判斷
  if (occupiedWidth > safeVisibleWidth) {
    scale = Math.min(scale, safeVisibleWidth / occupiedWidth);
  }
  if (occupiedHeight > safeVisibleHeight) {
    scale = Math.min(scale, safeVisibleHeight / occupiedHeight);
  }

  // --- 5. 生成最終位置 (應用縮放) ---
  const finalGridWidth = (cols - 1) * cardWidthWithPadding;
  const finalGridHeight = (rows - 1) * cardHeightWithPadding;
  const startX = -finalGridWidth / 2;
  const startY = finalGridHeight / 2;

  for (let i = 0; i < cardCount; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    
    positions.push({
      x: (startX + col * cardWidthWithPadding) * scale,
      y: (startY - row * cardHeightWithPadding) * scale,
      z: 0
    });
  }

  // 返回位置和縮放比例
  return { positions, scale };
}

// 生成分散的飛舞位置，避免穿模
function generateScatteredPositions(count) {
  const positions = [];
  const minDistance = 3.0; // 最小距離防止穿模
  
  // 獲取攝影機視野範圍
  const fovInRadians = (camera.fov * Math.PI) / 180;
  const visibleHeight = 2 * Math.tan(fovInRadians / 2) * camera.position.z;
  const visibleWidth = visibleHeight * camera.aspect;
  
  // 根據卡片數量調整分佈策略
  if (count <= 3) {
    // 少量卡片：使用預定義的分散位置
    const presetPositions = [
      { x: -visibleWidth * 0.3, y: visibleHeight * 0.2, z: 2 },
      { x: visibleWidth * 0.3, y: -visibleHeight * 0.2, z: 1.5 },
      { x: 0, y: visibleHeight * 0.4, z: 2.5 }
    ];
    return presetPositions.slice(0, count);
  } else {
    // 多張卡片：使用圓形分佈避免聚集
    const radius = Math.max(visibleWidth, visibleHeight) * 0.4;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = radius * (0.7 + Math.random() * 0.6); // 隨機半徑
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      const z = 1 + Math.random() * 2;
      positions.push({ x, y, z });
    }
    return positions;
  }
}

// === 新增：爆炸粒子系統 ===

// 創建多種爆炸粒子類型
function createExplosionParticles(position, count = 20) {
  const particles = [];
  
  for (let i = 0; i < count; i++) {
    const particleType = Math.random();
    let particle;
    
    if (particleType < 0.4) {
      // 40% 星星粒子
      particle = createStarParticle();
    } else if (particleType < 0.7) {
      // 30% 火花粒子
      particle = createSparkParticle();
    } else {
      // 30% 碎片粒子
      particle = createDebrisParticle();
    }
    
    // 設置爆炸的隨機方向和速度
    const angle = Math.random() * Math.PI * 2;
    const elevation = (Math.random() - 0.5) * Math.PI;
    const speed = 2 + Math.random() * 4; // 增加爆炸速度
    
    const velocity = {
      x: Math.cos(angle) * Math.cos(elevation) * speed,
      y: Math.sin(elevation) * speed,
      z: Math.sin(angle) * Math.cos(elevation) * speed
    };
    
    particle.position.copy(position);
    particle.userData = { velocity, life: 1.0, maxLife: 1.0 + Math.random() * 0.5 };
    particles.push(particle);
    scene.add(particle);
  }
  
  return particles;
}

// 星星形狀粒子
function createStarParticle() {
  const starShape = new THREE.Shape();
  const outerRadius = 0.04;
  const innerRadius = 0.02;
  const spikes = 5;
  
  for (let i = 0; i < spikes * 2; i++) {
    const angle = (i / (spikes * 2)) * Math.PI * 2;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    if (i === 0) starShape.moveTo(x, y);
    else starShape.lineTo(x, y);
  }
  starShape.closePath();
  
  const geometry = new THREE.ShapeGeometry(starShape);
  const material = new THREE.MeshBasicMaterial({
    color: 0xFFD700,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide
  });
  
  return new THREE.Mesh(geometry, material);
}

// 火花粒子
function createSparkParticle() {
  const geometry = new THREE.ConeGeometry(0.01, 0.08, 4);
  const material = new THREE.MeshBasicMaterial({
    color: 0xFF6B35, // 橙紅色火花
    transparent: true,
    opacity: 0.9 // 增加不透明度補償發光效果
  });
  
  const spark = new THREE.Mesh(geometry, material);
  
  // 為火花添加光暈效果
  const glowGeometry = new THREE.SphereGeometry(0.03, 6, 6);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xFF4500,
    transparent: true,
    opacity: 0.4,
    side: THREE.BackSide
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  spark.add(glow);
  
  return spark;
}

// 碎片粒子
function createDebrisParticle() {
  const geometry = new THREE.BoxGeometry(
    0.02 + Math.random() * 0.02,
    0.02 + Math.random() * 0.02,
    0.02 + Math.random() * 0.02
  );
  
  const colors = [0xFFD700, 0xFF6B35, 0xFF1493, 0x00CED1, 0x32CD32];
  const color = colors[Math.floor(Math.random() * colors.length)];
  
  const material = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.7
  });
  
  return new THREE.Mesh(geometry, material);
}

// 更新爆炸粒子動畫
function updateExplosionParticles(particles, deltaTime = 0.016) {
  particles.forEach((particle, index) => {
    if (!particle.userData) return;
    
    const { velocity, life, maxLife } = particle.userData;
    
    // 更新位置
    particle.position.x += velocity.x * deltaTime;
    particle.position.y += velocity.y * deltaTime;
    particle.position.z += velocity.z * deltaTime;
    
    // 模擬重力
    velocity.y -= 9.8 * deltaTime;
    
    // 阻力效果
    velocity.x *= 0.98;
    velocity.z *= 0.98;
    
    // 旋轉效果
    particle.rotation.x += velocity.x * deltaTime * 2;
    particle.rotation.y += velocity.y * deltaTime * 2;
    particle.rotation.z += velocity.z * deltaTime * 2;
    
    // 生命週期
    particle.userData.life -= deltaTime;
    const lifeRatio = particle.userData.life / maxLife;
    
    // 淡出效果
    particle.material.opacity = Math.max(0, lifeRatio * 0.8);
    particle.scale.setScalar(Math.max(0.1, lifeRatio));
    
    // 移除死亡粒子
    if (particle.userData.life <= 0) {
      scene.remove(particle);
      particle.geometry.dispose();
      particle.material.dispose();
      particles.splice(index, 1);
    }
  });
}

// === 螢幕震動效果系統 ===

// 震動狀態管理
let cameraShake = {
  intensity: 0,
  duration: 0,
  originalPosition: new THREE.Vector3(),
  isShaking: false
};

// 觸發螢幕震動
function triggerCameraShake(intensity = 0.1, duration = 0.5) {
  if (camera && !cameraShake.isShaking) {
    cameraShake.originalPosition.copy(camera.position);
  }
  
  cameraShake.intensity = Math.max(cameraShake.intensity, intensity);
  cameraShake.duration = Math.max(cameraShake.duration, duration);
  cameraShake.isShaking = true;
}

// 更新螢幕震動效果
function updateCameraShake(deltaTime) {
  if (!cameraShake.isShaking || !camera) return;
  
  if (cameraShake.duration <= 0) {
    // 震動結束，恢復原始位置
    camera.position.copy(cameraShake.originalPosition);
    cameraShake.isShaking = false;
    cameraShake.intensity = 0;
    return;
  }
  
  // 計算當前震動強度（隨時間衰減）
  const currentIntensity = cameraShake.intensity * (cameraShake.duration / 0.5);
  
  // 隨機震動偏移
  const shakeX = (Math.random() - 0.5) * currentIntensity;
  const shakeY = (Math.random() - 0.5) * currentIntensity;
  const shakeZ = (Math.random() - 0.5) * currentIntensity * 0.3; // Z軸震動較小
  
  // 應用震動到攝影機
  camera.position.x = cameraShake.originalPosition.x + shakeX;
  camera.position.y = cameraShake.originalPosition.y + shakeY;
  camera.position.z = cameraShake.originalPosition.z + shakeZ;
  
  // 衰減震動
  cameraShake.duration -= deltaTime;
}

// 大爆炸震動效果
function triggerMegaExplosion(position) {
  // 創建更多爆炸粒子
  const mainExplosion = createExplosionParticles(position, 40);
  
  // 觸發背景閃光
  triggerScreenFlash();
  
  // 創建衝擊波
  createShockwave(position);
  
  // 延遲第二波爆炸
  setTimeout(() => {
    const secondWave = createExplosionParticles(position, 25);
    triggerCameraShake(0.08, 0.3);
    createShockwave(position, 0.5, 0.3);
  }, 100);
  
  // 延遲第三波小爆炸
  setTimeout(() => {
    const thirdWave = createExplosionParticles(position, 15);
    triggerCameraShake(0.05, 0.2);
  }, 200);
  
  // 主要震動效果
  triggerCameraShake(0.15, 0.8);
  
  return mainExplosion;
}

// === 背景爆炸效果系統 ===

// 螢幕閃光效果
function triggerScreenFlash(intensity = 0.8, duration = 0.15) {
  // 創建閃光覆蓋層
  const flash = document.createElement('div');
  flash.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: radial-gradient(circle, rgba(255,255,255,${intensity}) 0%, rgba(255,215,0,${intensity * 0.5}) 100%);
    pointer-events: none;
    z-index: 9998;
    animation: flashOut ${duration}s ease-out forwards;
  `;
  
  // 添加閃光動畫 CSS
  if (!document.getElementById('flash-styles')) {
    const style = document.createElement('style');
    style.id = 'flash-styles';
    style.textContent = `
      @keyframes flashOut {
        0% { opacity: 1; }
        100% { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(flash);
  
  // 移除閃光元素
  setTimeout(() => {
    if (flash.parentNode) {
      flash.parentNode.removeChild(flash);
    }
  }, duration * 1000 + 50);
}

// 創建衝擊波效果
function createShockwave(position, maxRadius = 1.5, duration = 0.6) {
  const shockwaveGeometry = new THREE.RingGeometry(0, 0.1, 32, 1);
  const shockwaveMaterial = new THREE.MeshBasicMaterial({
    color: 0xFFD700,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide
  });
  
  const shockwave = new THREE.Mesh(shockwaveGeometry, shockwaveMaterial);
  shockwave.position.copy(position);
  
  // 隨機旋轉
  shockwave.rotation.x = Math.random() * Math.PI;
  shockwave.rotation.y = Math.random() * Math.PI;
  
  scene.add(shockwave);
  
  // 衝擊波擴散動畫
  new TWEEN.Tween(shockwave.scale)
    .to({ x: maxRadius * 10, y: maxRadius * 10, z: 1 }, duration * 1000)
    .easing(TWEEN.Easing.Cubic.Out)
    .start();
  
  // 衝擊波淡出
  new TWEEN.Tween(shockwaveMaterial)
    .to({ opacity: 0 }, duration * 1000)
    .easing(TWEEN.Easing.Cubic.Out)
    .onComplete(() => {
      scene.remove(shockwave);
      shockwaveGeometry.dispose();
      shockwaveMaterial.dispose();
    })
    .start();
  
  return shockwave;
}

// 創建放射狀背景動畫
function createRadialBurst(position, count = 12) {
  const bursts = [];
  
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const burstGeometry = new THREE.PlaneGeometry(0.1, 0.8);
    const burstMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFD700,
      transparent: true,
      opacity: 0.6
    });
    
    const burst = new THREE.Mesh(burstGeometry, burstMaterial);
    burst.position.copy(position);
    burst.rotation.z = angle;
    
    scene.add(burst);
    bursts.push(burst);
    
    // 放射動畫
    new TWEEN.Tween(burst.scale)
      .to({ x: 2, y: 5, z: 1 }, 400)
      .easing(TWEEN.Easing.Cubic.Out)
      .start();
    
    // 淡出動畫
    new TWEEN.Tween(burstMaterial)
      .to({ opacity: 0 }, 600)
      .easing(TWEEN.Easing.Cubic.Out)
      .onComplete(() => {
        scene.remove(burst);
        burstGeometry.dispose();
        burstMaterial.dispose();
      })
      .start();
  }
  
  return bursts;
}

// 彩虹色爆炸效果
function createColorBurst(position, colors = [0xFF1493, 0x00CED1, 0x32CD32, 0xFF6B35, 0x9370DB]) {
  const colorParticles = [];
  
  colors.forEach((color, index) => {
    for (let i = 0; i < 8; i++) {
      const particleGeometry = new THREE.SphereGeometry(0.02, 8, 8);
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.9 // 增加不透明度補償發光效果
      });
      
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.position.copy(position);
      
      // 為彩色粒子添加光暈效果
      const glowGeometry = new THREE.SphereGeometry(0.04, 6, 6);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      particle.add(glow);
      
      const angle = (index * 8 + i) * (Math.PI * 2) / (colors.length * 8);
      const speed = 1.5 + Math.random() * 1;
      
      scene.add(particle);
      colorParticles.push(particle);
      
      // 彩色粒子擴散
      new TWEEN.Tween(particle.position)
        .to({
          x: position.x + Math.cos(angle) * speed,
          y: position.y + Math.sin(angle) * speed * 0.5,
          z: position.z + (Math.random() - 0.5) * speed
        }, 800)
        .easing(TWEEN.Easing.Cubic.Out)
        .start();
      
      // 粒子旋轉
      new TWEEN.Tween(particle.rotation)
        .to({
          x: Math.random() * Math.PI * 2,
          y: Math.random() * Math.PI * 2,
          z: Math.random() * Math.PI * 2
        }, 800)
        .easing(TWEEN.Easing.Cubic.Out)
        .start();
      
      // 粒子淡出
      new TWEEN.Tween(particleMaterial)
        .to({ opacity: 0 }, 800)
        .easing(TWEEN.Easing.Cubic.Out)
        .onComplete(() => {
          scene.remove(particle);
          particleGeometry.dispose();
          particleMaterial.dispose();
        })
        .start();
    }
  });
  
  return colorParticles;
}

// === 原有光點粒子系統 ===

// 創建金色光點粒子 - 增強視覺效果
function createSparkleParticle() {
  const geometry = new THREE.SphereGeometry(0.03, 12, 12); // 稍大的球體，更高品質
  
  // moda 黃金色光點材質 - 增強發光效果
  const material = new THREE.MeshBasicMaterial({
    color: 0xFFD700,
    transparent: true,
    opacity: 0.95
  });
  
  const particle = new THREE.Mesh(geometry, material);
  particle.scale.set(0, 0, 0); // 初始不可見
  
  // 添加多層光暈效果補償發光
  const glowGeometry1 = new THREE.SphereGeometry(0.06, 8, 8);
  const glowMaterial1 = new THREE.MeshBasicMaterial({
    color: 0xFFAA00,
    transparent: true,
    opacity: 0.3,
    side: THREE.BackSide
  });
  const glow1 = new THREE.Mesh(glowGeometry1, glowMaterial1);
  particle.add(glow1);
  
  // 第二層光暈
  const glowGeometry2 = new THREE.SphereGeometry(0.09, 8, 8);
  const glowMaterial2 = new THREE.MeshBasicMaterial({
    color: 0xFFD700,
    transparent: true,
    opacity: 0.15,
    side: THREE.BackSide
  });
  const glow2 = new THREE.Mesh(glowGeometry2, glowMaterial2);
  particle.add(glow2);
  
  return particle;
}

// 創建光點軌跡效果
function createSparkleTrail(particle) {
  const trailGeometry = new THREE.BufferGeometry();
  const trailPositions = new Float32Array(30); // 10個點，每個3個座標
  trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
  
  const trailMaterial = new THREE.LineBasicMaterial({
    color: 0xFFD700,
    transparent: true,
    opacity: 0.6,
    linewidth: 2
  });
  
  const trail = new THREE.Line(trailGeometry, trailMaterial);
  trail.visible = false;
  
  return trail;
}

// 光點噴飛到卡片轉換動畫 - 增強爆炸效果
function animateSparkleToCard(webglCard, cssCard, finalPosition, gridScale, delay = 0, scatterPosition) {
  return new Promise((resolve) => {
    // 創建光點粒子
    const sparkle = createSparkleParticle();
    const trail = createSparkleTrail(sparkle);
    scene.add(sparkle);
    scene.add(trail);
    
    // 初始位置設在中心，添加隨機偏移增加自然感
    const initialOffset = {
      x: (Math.random() - 0.5) * 0.2,
      y: (Math.random() - 0.5) * 0.2,
      z: 0
    };
    sparkle.position.set(initialOffset.x, initialOffset.y, initialOffset.z);
    
    setTimeout(() => {
      // === 超級爆炸啟動序列 ===
      
      // 1. 觸發初始大爆炸
      const initialExplosion = triggerMegaExplosion(sparkle.position);
      explosionParticles.push(...initialExplosion);
      
      // 2. 創建放射狀背景效果
      createRadialBurst(sparkle.position, 16);
      
      // 3. 創建彩虹色爆炸
      createColorBurst(sparkle.position);
      
      // 階段1：光點爆發式噴出 - 添加重力效果
      sparkle.scale.set(1, 1, 1);
      trail.visible = true;
      
      // 計算拋物線軌跡的控制點（模擬重力）
      const midPoint = {
        x: (initialOffset.x + scatterPosition.x) / 2 + (Math.random() - 0.5) * 1.0,
        y: (initialOffset.y + scatterPosition.y) / 2 + Math.abs(scatterPosition.x) * 0.3, // 上拋效果
        z: (initialOffset.z + scatterPosition.z) / 2
      };
      
      // 分兩段動畫模擬拋物線
      // 第一段：上升階段
      new TWEEN.Tween(sparkle.position)
        .to(midPoint, 250)
        .easing(TWEEN.Easing.Cubic.Out)
        .onUpdate(() => updateSparkleTrail(trail, sparkle.position))
        .onComplete(() => {
          // 第二段：下降階段（受重力影響）
          new TWEEN.Tween(sparkle.position)
            .to(scatterPosition, 300)
            .easing(TWEEN.Easing.Cubic.In) // 加速下降
            .onUpdate(() => updateSparkleTrail(trail, sparkle.position))
            .onComplete(() => {
              // 階段2：短暫彈跳效果
              const bounceHeight = 0.1;
              new TWEEN.Tween(sparkle.position)
                .to({ 
                  x: scatterPosition.x, 
                  y: scatterPosition.y + bounceHeight, 
                  z: scatterPosition.z 
                }, 150)
                .easing(TWEEN.Easing.Bounce.Out)
                .onUpdate(() => updateSparkleTrail(trail, sparkle.position))
                .onComplete(() => {
                  // 回到散射位置
                  new TWEEN.Tween(sparkle.position)
                    .to(scatterPosition, 100)
                    .easing(TWEEN.Easing.Cubic.Out)
                    .onComplete(() => {
                      // 階段3：飛回最終位置並轉換
                      setTimeout(() => {
                        new TWEEN.Tween(sparkle.position)
                          .to(finalPosition, 500)
                          .easing(TWEEN.Easing.Back.InOut)
                          .onUpdate(() => updateSparkleTrail(trail, sparkle.position))
                          .onComplete(() => {
                            // === 最終爆炸與卡片顯現 ===
                            
                            // 1. 小型爆炸標記光點到達
                            const finalExplosion = createExplosionParticles(finalPosition, 15);
                            explosionParticles.push(...finalExplosion);
                            
                            // 2. 小型震動效果
                            triggerCameraShake(0.06, 0.3);
                            
                            // 3. 小型衝擊波
                            createShockwave(finalPosition, 0.8, 0.4);
                            
                            // 4. 螢幕閃光（較輕微）
                            triggerScreenFlash(0.4, 0.1);
                            
                            // 光點消失，卡片顯現
                            fadeOutSparkle(sparkle, trail);
                            revealCard(webglCard, cssCard, finalPosition, gridScale, resolve);
                          })
                          .start();
                      }, 80); // 短暫停留
                    })
                    .start();
                })
                .start();
            })
            .start();
        })
        .start();
        
      // 光點脈動效果
      new TWEEN.Tween(sparkle.scale)
        .to({ x: 1.2, y: 1.2, z: 1.2 }, 300)
        .easing(TWEEN.Easing.Sinusoidal.InOut)
        .repeat(Infinity)
        .yoyo(true)
        .start();
        
      // 光點閃爍效果
      new TWEEN.Tween(sparkle.material)
        .to({ opacity: 0.6 }, 250)
        .easing(TWEEN.Easing.Sinusoidal.InOut)
        .repeat(Infinity)
        .yoyo(true)
        .start();
        
    }, delay);
  });
}

// 更新光點軌跡
function updateSparkleTrail(trail, currentPosition) {
  const positions = trail.geometry.attributes.position.array;
  
  // 向前移動所有點
  for (let i = positions.length - 3; i >= 3; i -= 3) {
    positions[i] = positions[i - 3];
    positions[i + 1] = positions[i - 2];
    positions[i + 2] = positions[i - 1];
  }
  
  // 設置新的頭部位置
  positions[0] = currentPosition.x;
  positions[1] = currentPosition.y;
  positions[2] = currentPosition.z;
  
  trail.geometry.attributes.position.needsUpdate = true;
}

// 光點淡出效果
function fadeOutSparkle(sparkle, trail) {
  new TWEEN.Tween(sparkle.scale)
    .to({ x: 0, y: 0, z: 0 }, 200)
    .onComplete(() => {
      scene.remove(sparkle);
      scene.remove(trail);
      sparkle.geometry.dispose();
      sparkle.material.dispose();
      trail.geometry.dispose();
      trail.material.dispose();
    })
    .start();
}

// 卡片顯現動畫 - 增強版
function revealCard(webglCard, cssCard, finalPosition, gridScale, resolve) {
  // 設置卡片初始狀態
  webglCard.position.copy(finalPosition);
  webglCard.rotation.set(0, 0, 0);
  webglCard.scale.set(0.05, 0.05, 0.05); // 更小的起始尺寸
  
  // CSS3D 卡片同步
  if (cssCard) {
    cssCard.position.copy(webglCard.position);
    cssCard.rotation.copy(webglCard.rotation);
    cssCard.scale.set(0.0003, 0.0003, 0.0003);
  }
  
  scene.add(webglCard);
  if (cssCard) cssScene.add(cssCard);
  
  // 多階段卡片顯現動畫
  // 階段1：快速放大到稍微過大
  new TWEEN.Tween(webglCard.scale)
    .to({ x: gridScale * 1.2, y: gridScale * 1.2, z: gridScale * 1.2 }, 200)
    .easing(TWEEN.Easing.Cubic.Out)
    .onUpdate(() => {
      if (cssCard) {
        const s = webglCard.scale.x * 0.006;
        cssCard.scale.set(s, s, s);
      }
    })
    .onComplete(() => {
      // 階段2：回彈到正確大小
      new TWEEN.Tween(webglCard.scale)
        .to({ x: gridScale, y: gridScale, z: gridScale }, 150)
        .easing(TWEEN.Easing.Back.Out)
        .onUpdate(() => {
          if (cssCard) {
            const s = webglCard.scale.x * 0.006;
            cssCard.scale.set(s, s, s);
          }
        })
        .onComplete(() => {
          // 階段3：輕微脈動效果
          addCardPulseEffect(webglCard, cssCard, gridScale);
          resolve();
        })
        .start();
    })
    .start();
}

// 添加卡片脈動效果
function addCardPulseEffect(webglCard, cssCard, gridScale) {
  // 輕微的脈動動畫
  new TWEEN.Tween(webglCard.scale)
    .to({ 
      x: gridScale * 1.05, 
      y: gridScale * 1.05, 
      z: gridScale * 1.05 
    }, 800)
    .easing(TWEEN.Easing.Sinusoidal.InOut)
    .repeat(2) // 脈動2次
    .yoyo(true)
    .onUpdate(() => {
      if (cssCard) {
        const s = webglCard.scale.x * 0.006;
        cssCard.scale.set(s, s, s);
      }
    })
    .start();
}

// 同步 WebGL 和 CSS3D 卡牌動畫 (V3 - 加入防穿模)
function animateCardPair(webglCard, cssCard, finalPosition, gridScale, delay = 0, scatterPosition) {
  return new Promise((resolve) => {
    // 階段1：起始狀態 - 爆發式起點
    webglCard.position.set(0, 0, -1); // 更靠近中心，增強爆發感
    webglCard.rotation.set(0, 0, 0); // 修正：正面朝前 (前面是 +Z 面，索引 4)
    webglCard.scale.set(0.05, 0.05, 0.05); // 更小的起始尺寸，增強放大效果
    
    // CSS3D 卡片同步（如果存在）
    if (cssCard) {
      cssCard.position.copy(webglCard.position);
      cssCard.rotation.copy(webglCard.rotation);
      cssCard.scale.set(0.0003, 0.0003, 0.0003); // CSS3D 對應更小的縮放
    }
    
    // 階段2：飛舞狀態 - 使用預分配的分散位置避免穿模
    const { x: randomX, y: randomY, z: randomZ } = scatterPosition;
    
    setTimeout(() => {
      // 優化：使用單一更新函式減少回調次數
      const syncCSS = () => {
        if (cssCard) {
          cssCard.position.copy(webglCard.position);
          cssCard.rotation.copy(webglCard.rotation);
          const s = webglCard.scale.x * 0.006;
          cssCard.scale.set(s, s, s);
        }
      };

      // WebGL 卡片動畫 - 爆發式噴出效果
      new TWEEN.Tween(webglCard.position)
        .to({ x: randomX, y: randomY, z: randomZ }, 500) // 大幅縮短到 500ms
        .easing(TWEEN.Easing.Exponential.Out) // 使用爆發性 easing
        .onUpdate(syncCSS)
        .start();
        
      new TWEEN.Tween(webglCard.scale)
        .to({ x: 1, y: 1, z: 1 }, 500)
        .easing(TWEEN.Easing.Exponential.Out)
        .start();
        
      new TWEEN.Tween(webglCard.rotation)
        .to({ x: Math.random() * Math.PI, y: Math.random() * Math.PI, z: Math.random() * Math.PI }, 500)
        .easing(TWEEN.Easing.Exponential.Out)
        .onComplete(() => {
          // 階段3：快速飛到最終位置
          setTimeout(() => {
            // 快速歸位動畫
            new TWEEN.Tween(webglCard.position)
              .to(finalPosition, 800) // 進一步縮短時間
              .easing(TWEEN.Easing.Back.InOut) // 使用回彈效果
              .onUpdate(syncCSS)
              .start();
              
            new TWEEN.Tween(webglCard.rotation)
              .to({ x: 0, y: 0, z: 0 }, 800) // 正面朝前
              .easing(TWEEN.Easing.Back.InOut)
              .start();
              
            // 讓卡牌縮放到最終計算出的 gridScale
            new TWEEN.Tween(webglCard.scale)
              .to({ x: gridScale, y: gridScale, z: gridScale }, 800)
              .easing(TWEEN.Easing.Back.InOut)
              .onComplete(() => resolve()) // 在最後一個動畫完成時 resolve
              .start();
          }, 200); // 更短的間隔時間
        })
        .start();
    }, delay);
  });
}

// 原版動畫函數 (V3 - 加入防穿模)
function animateCard(card, finalPosition, gridScale, delay = 0, scatterPosition) {
  return new Promise((resolve) => {
    // 階段1：起始狀態 - 爆發式起點
    card.position.set(0, 0, -1); // 更靠近中心，增強爆發感
    card.rotation.set(0, 0, 0); // 修正：正面朝前 (前面是 +Z 面，索引 4)
    card.scale.set(0.05, 0.05, 0.05); // 更小的起始尺寸，增強放大效果
    
    // 階段2：飛舞狀態 - 使用預分配的分散位置避免穿模
    const { x: randomX, y: randomY, z: randomZ } = scatterPosition;
    
    setTimeout(() => {
      // 爆發式單卡動畫 - 快速噴出
      new TWEEN.Tween(card.position)
        .to({ x: randomX, y: randomY, z: randomZ }, 500)
        .easing(TWEEN.Easing.Exponential.Out)
        .start();
        
      new TWEEN.Tween(card.scale)
        .to({ x: 1, y: 1, z: 1 }, 500)
        .easing(TWEEN.Easing.Exponential.Out)
        .start();
        
      new TWEEN.Tween(card.rotation)
        .to({ x: Math.random() * Math.PI, y: Math.random() * Math.PI, z: Math.random() * Math.PI }, 500)
        .easing(TWEEN.Easing.Exponential.Out)
        .onComplete(() => {
          // 階段3：快速歸位
          setTimeout(() => {
            new TWEEN.Tween(card.position)
              .to(finalPosition, 800)
              .easing(TWEEN.Easing.Back.InOut)
              .start();
              
            new TWEEN.Tween(card.rotation)
              .to({ x: 0, y: 0, z: 0 }, 800) // 正面朝前
              .easing(TWEEN.Easing.Back.InOut)
              .start();
              
            // 讓卡牌縮放到最終計算出的 gridScale
            new TWEEN.Tween(card.scale)
              .to({ x: gridScale, y: gridScale, z: gridScale }, 800)
              .easing(TWEEN.Easing.Back.InOut)
              .onComplete(() => resolve()) // 在最後一個動畫完成時 resolve
              .start();
          }, 200);
        })
        .start();
    }, delay);
  });
}

// 顯示載入動畫
function showLoadingAnimation() {
  const overlay = document.getElementById('overlay');
  const loadingOverlay = document.getElementById('loadingOverlay');
  const loadingText = document.getElementById('loadingText');
  const tapHint = document.getElementById('tapHint');
  
  overlay.classList.add('show');
  loadingOverlay.classList.add('show');
  
  // 載入階段提示
  const loadingSteps = [
    '正在準備 3D 場景...',
    '載入 moda 品牌材質...',
    '初始化粒子系統...',
    '準備卡牌動畫...'
  ];
  
  let currentStep = 0;
  const stepInterval = setInterval(() => {
    if (currentStep < loadingSteps.length - 1) {
      currentStep++;
      loadingText.textContent = loadingSteps[currentStep];
    } else {
      clearInterval(stepInterval);
      // 載入完成，顯示點擊提示
      loadingText.textContent = '準備就緒！';
      setTimeout(() => {
        loadingText.style.display = 'none';
        tapHint.style.display = 'block';
        
        // 讓點擊提示更明顯
        tapHint.addEventListener('mouseenter', () => {
          tapHint.style.transform = 'scale(1.1)';
        });
        tapHint.addEventListener('mouseleave', () => {
          tapHint.style.transform = 'scale(1)';
        });
      }, 300); // 縮短等待時間，讓介面更快回應
    }
  }, 400); // 進一步加快載入步驟顯示，減少等待時間
  
  return { loadingOverlay, tapHint };
}

// 創建點擊漣漪效果
function createTapRipple(event, container) {
  const ripple = document.createElement('div');
  ripple.className = 'tap-ripple';
  
  const rect = container.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  ripple.style.left = x + 'px';
  ripple.style.top = y + 'px';
  ripple.style.width = '20px';
  ripple.style.height = '20px';
  
  container.appendChild(ripple);
  
  setTimeout(() => {
    ripple.remove();
  }, 600);
}

// 3D 卡牌雨動畫主函式
async function showCardShowerAnimation(winners) {
  return new Promise(async (resolve) => {
    // 顯示載入動畫
    const { loadingOverlay, tapHint } = showLoadingAnimation();
    
    // 確保 3D 場景已初始化
    if (!scene) {
      initThreeScene();
    }
    
    // 等待用戶點擊
    const waitForUserInteraction = () => {
      return new Promise((resolveClick) => {
        const handleClick = (event) => {
          createTapRipple(event, loadingOverlay);
          loadingOverlay.removeEventListener('click', handleClick);
          resolveClick();
        };
        loadingOverlay.addEventListener('click', handleClick);
      });
    };
    
    // 等待用戶點擊
    await waitForUserInteraction();
    
    // 隱藏載入動畫
    loadingOverlay.classList.remove('show');
    
    // 手動啟動動畫循環
    animate();
    
    // 創建 WebGL 卡牌（背景和效果）- 但不立即顯示
    cards = [];
    cssCards = [];
    
    winners.forEach(winnerName => {
      // WebGL 卡牌（用於背景效果）
      const webglCard = createWinnerCard(winnerName);
      
      // 確保卡片創建成功才添加到陣列（但不加到場景，等光點轉換後再顯示）
      if (webglCard) {
        cards.push(webglCard);
        
        // CSS3D 卡牌（用於清晰文字）- 僅在 CSS3DRenderer 可用時
        if (cssScene && cssRenderer) {
          const cssCard = createCSSCard(winnerName);
          if (cssCard) {
            cssCards.push(cssCard);
          }
        }
      } else {
        console.error('Failed to create card for winner:', winnerName);
      }
    });
    
    // [修改] 計算最終位置，接收回傳的物件
    const layout = calculateGridLayout(winners.length);
    const finalPositions = layout.positions;
    const gridScale = layout.scale; // 獲取網格縮放比例
    
    // 預先生成分散的飛舞位置，避免穿模
    const scatterPositions = generateScatteredPositions(cards.length);
    
    // 快速準備場景 - 進一步縮短延遲
    await new Promise(r => setTimeout(r, 100));
    
    // 新版：光點噴飛轉換動畫 - 物理感更強，避免卡片分離問題
    const animationPromises = cards.map((card, index) => {
      // 動態間隔：前幾張更快，營造爆發感
      const baseDelay = index < 3 ? 150 : 200;
      const delay = index * baseDelay; 
      const scatterPos = scatterPositions[index];
      
      if (cssCards.length > 0) {
        // 使用光點到卡片轉換動畫（CSS3D + WebGL 混合模式）
        const cssCard = cssCards[index];
        return animateSparkleToCard(card, cssCard, finalPositions[index], gridScale, delay, scatterPos);
      } else {
        // 使用光點到卡片轉換動畫（僅 WebGL 模式）
        return animateSparkleToCard(card, null, finalPositions[index], gridScale, delay, scatterPos);
      }
    });
    
    // 等待所有動畫完成
    await Promise.all(animationPromises);
    
    // 新動畫系統更快完成，進一步縮短等待時間
    await new Promise(r => setTimeout(r, 1000));
    
    // 淡出 overlay
    overlay.classList.add('fade-out');
    setTimeout(() => {
      overlay.classList.remove('show', 'fade-out');

      // 在所有事情都結束後，手動停止動畫循環並清理場景
      stopAnimation(); 
      cleanupThreeScene();
      resolve();
    }, 1000);
  });
}

// 視窗大小調整處理
function handleWindowResize() {
  if (camera && renderer) {
    // 更新攝影機長寬比
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    // 更新 WebGL 渲染器大小
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // 更新 CSS3D 渲染器大小
    if (cssRenderer) {
      cssRenderer.setSize(window.innerWidth, window.innerHeight);
    }

    // *** 新增的關鍵程式碼 ***
    // 如果場景中還有卡片，則重新計算並更新它們的位置
    if (cards.length > 0) {
      const layout = calculateGridLayout(cards.length);
      const finalPositions = layout.positions;
      const gridScale = layout.scale;

      cards.forEach((card, index) => {
        // 直接將卡片移動到新的最終位置，無需動畫
        card.position.copy(finalPositions[index]);
        card.scale.set(gridScale, gridScale, gridScale);
        
        // 如果使用 CSS3D，也要同步更新
        if (cssCards[index]) {
          const cssCard = cssCards[index];
          cssCard.position.copy(card.position);
          const s = card.scale.x * 0.006;
          cssCard.scale.set(s, s, s);
        }
      });
    }
  }
}

function loadHistory() {
  const stored = localStorage.getItem('drawHistory');
  if (stored) {
    try {
      historyList = JSON.parse(stored);
    } catch {
      historyList = [];
    }
  }
}

function saveHistory() {
  localStorage.setItem('drawHistory', JSON.stringify(historyList));
}

function populatePrizeOptions() {
  const select = document.getElementById('prizeFilter');
  const current = select.value;
  const prizes = Array.from(new Set(historyList.map(item => item.prize)));
  select.innerHTML = '<option value=\"全部\">全部</option>';
  prizes.forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  });
  if (prizes.includes(current) || current === '全部') {
    select.value = current;
  }
}

function getFilteredList(prizeName) {
  if (prizeName === '全部') return historyList;
  return historyList.filter(item => item.prize === prizeName);
}

function renderHistoryPage(list, page) {
  const container = document.getElementById('historyContainer');
  container.innerHTML = '';
  const start = (page - 1) * PAGE_SIZE;
  const pageItems = list.slice(start, start + PAGE_SIZE);

  if (pageItems.length === 0) {
    container.innerHTML = '<div class="alert alert-info">尚無此品項抽獎紀錄。</div>';
  } else {
    pageItems.forEach(record => {
      const card = document.createElement('div');
      card.className = 'card history-card';
      card.innerHTML = `
        <div class="card-body">
          <h5 class="card-title">品項：${record.prize}</h5>
          <h6 class="card-subtitle mb-2 text-muted">時間：${record.date}</h6>
          <p class="card-text">中獎者：${record.winners.join('、')}</p>
          <p class="card-text"><small class="text-secondary">亂數種子：${record.seed}</small></p>
          <p class="card-text"><small class="text-secondary">允許重複：${record.allowRepeat ? '是' : '否'}</small></p>
        </div>
      `;
      container.appendChild(card);
    });
  }
  renderPagination(list.length);
}

function renderPagination(totalItems) {
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  const pagContainer = document.getElementById('paginationContainer');
  pagContainer.innerHTML = '';
  if (totalPages <= 1) return;

  const prevLi = document.createElement('li');
  prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
  prevLi.innerHTML = `<button class="page-link">上一頁</button>`;
  prevLi.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      updateHistoryDisplay();
    }
  };
  pagContainer.appendChild(prevLi);

  for (let i = 1; i <= totalPages; i++) {
    const li = document.createElement('li');
    li.className = `page-item ${currentPage === i ? 'active' : ''}`;
    li.innerHTML = `<button class="page-link">${i}</button>`;
    li.onclick = () => {
      currentPage = i;
      updateHistoryDisplay();
    };
    pagContainer.appendChild(li);
  }

  const nextLi = document.createElement('li');
  nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
  nextLi.innerHTML = `<button class="page-link">下一頁</button>`;
  nextLi.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      updateHistoryDisplay();
    }
  };
  pagContainer.appendChild(nextLi);
}

function updateHistoryDisplay() {
  const selectedPrize = document.getElementById('prizeFilter').value;
  const filtered = getFilteredList(selectedPrize);
  renderHistoryPage(filtered, currentPage);
}

function updateParticipantCount(count) {
  document.getElementById('participantCount').textContent = '目前參與者 ' + count + ' 人';
}

function renderRemainingList(participants) {
  const remainingWrapper = document.getElementById('remainingWrapper');
  const remainingContainer = document.getElementById('remainingContainer');
  remainingContainer.innerHTML = '';
  if (participants.length === 0) {
    remainingContainer.innerHTML = '<div class="alert alert-info">無剩餘參與者。</div>';
  } else {
    const ul = document.createElement('ul');
    participants.forEach((p, idx) => {
      const li = document.createElement('li');
      li.textContent = p;
      li.style.animationDelay = `${idx * 0.1}s`;
      ul.appendChild(li);
    });
    remainingContainer.appendChild(ul);
  }
}

function handleAllowRepeatToggle() {
  const allowRepeat = document.getElementById('allowRepeatCheckbox').checked;
  const remainingWrapper = document.getElementById('remainingWrapper');
  if (allowRepeat) {
    remainingWrapper.style.display = 'none';
    document.getElementById('remainingContainer').innerHTML = '';
  } else {
    remainingWrapper.style.display = 'block';
    const participants = document.getElementById('nameList').value
      .split('\n').map(n => n.trim()).filter(n => n !== '');
    updateParticipantCount(participants.length);
    renderRemainingList(participants);
  }
  document.getElementById('repeatHelp').textContent = allowRepeat
    ? '允許同一參與者重複中獎，不會移除名單。'
    : '不允許同一參與者重複中獎，中獎者將從名單移除。';
}

// Show countdown overlay function
async function showCountdownOverlay() {
  const overlay = document.getElementById('overlay');
  const container = document.getElementById('countdownContainer');
  container.innerHTML = '';
  overlay.classList.add('show');

  for (let c = 3; c > 0; c--) {
    const div = document.createElement('div');
    div.className = 'countdown-number';
    div.textContent = c;
    container.appendChild(div);
    void div.offsetWidth;
    await new Promise(r => setTimeout(r, 1000));
    container.removeChild(div);
  }
  overlay.classList.add('fade-out');
  setTimeout(() => {
    overlay.classList.remove('show', 'fade-out');
  }, 1000);
}

function scrollToWinners() {
  const container = document.getElementById('winnersContainer');
  if (container) {
    setTimeout(() => {
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }
}

async function shuffleWithSHA256(array, seed) {
  const encoder = new TextEncoder();
  const data = encoder.encode(seed);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = hashArray[i % hashArray.length] % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Theme toggle functionality
function initializeTheme() {
  const themeToggle = document.getElementById('themeToggle');
  const body = document.body;
  const lightIcon = document.querySelector('.theme-icon-light');
  const darkIcon = document.querySelector('.theme-icon-dark');

  function applyTheme(theme) {
    if (theme === 'dark') {
      body.classList.add('dark');
      if (lightIcon) lightIcon.style.display = 'none';
      if (darkIcon) darkIcon.style.display = 'inline';
    } else {
      body.classList.remove('dark');
      if (lightIcon) lightIcon.style.display = 'inline';
      if (darkIcon) darkIcon.style.display = 'none';
    }
  }

  function toggleTheme() {
    const currentTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  }

  // Initialize theme based on localStorage or system preference
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (savedTheme) {
    applyTheme(savedTheme);
  } else if (prefersDark) {
    applyTheme('dark');
  } else {
    applyTheme('light'); // Default to light theme
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  loadHistory();
  populatePrizeOptions();
  updateHistoryDisplay();
  initializeTheme(); // Call theme initialization
  
  // 立即開始預載入 3D 資源
  preloadResources();
  
  // 加入視窗大小調整監聽器
  window.addEventListener('resize', handleWindowResize);

  // Set current year in footer
  const currentYearSpan = document.getElementById('currentYear');
  if (currentYearSpan) {
    currentYearSpan.textContent = new Date().getFullYear();
  }

  document.getElementById('prizeFilter').addEventListener('change', () => {
    currentPage = 1;
    updateHistoryDisplay();
  });

  document.getElementById('clearHistory').addEventListener('click', () => {
    if (confirm('確定要清除所有歷史紀錄嗎？')) {
      historyList = [];
      saveHistory();
      populatePrizeOptions();
      currentPage = 1;
      updateHistoryDisplay();
    }
  });

  document.getElementById('allowRepeatCheckbox').addEventListener('change', handleAllowRepeatToggle);

  document.getElementById('nameList').addEventListener('input', () => {
    const participants = document.getElementById('nameList').value
      .split('\n').map(n => n.trim()).filter(n => n !== '');
    updateParticipantCount(participants.length);
    if (!document.getElementById('allowRepeatCheckbox').checked) {
      renderRemainingList(participants);
    }
  });

  const initialParticipants = document.getElementById('nameList').value
    .split('\n').map(n => n.trim()).filter(n => n !== '');
  updateParticipantCount(initialParticipants.length);
  // Initial call to render remaining list if checkbox is unchecked
  if (!document.getElementById('allowRepeatCheckbox').checked) {
    renderRemainingList(initialParticipants);
  }


  document.getElementById('drawButton').addEventListener('click', async function () {
    // 防呆機制：檢查是否正在抽獎
    if (isDrawing) {
      console.log('抽獎進行中，請稍後再試');
      return;
    }
    
    // 設置抽獎狀態
    isDrawing = true;
    const drawButton = document.getElementById('drawButton');
    const originalText = drawButton.textContent;
    drawButton.disabled = true;
    drawButton.textContent = '抽獎中...';
    
    let winners = []; // 在 try 區塊外部宣告以便 finally 區塊使用
    
    try {
      // 清理之前的 3D 場景和卡片，避免重複抽獎時出現殘留
      cleanupThreeScene();
      
      // 清理之前的中獎者顯示區域
      const winnersContainer = document.getElementById('winnersContainer');
      winnersContainer.innerHTML = '';
      
      const textarea = document.getElementById('nameList');
    const seedInput = document.getElementById('seedInput').value.trim();
    const prizeInput = document.getElementById('prizeInput').value.trim() || '未命名品項';
    const countInput = document.getElementById('winnerCount').value.trim();
    const allowRepeat = document.getElementById('allowRepeatCheckbox').checked;
    const seedDisplayBlock = document.getElementById('seedDisplayBlock');
    const seedDisplay = document.getElementById('seedDisplay');

    const seed = seedInput || Date.now().toString();
    if (!seedInput) {
      seedDisplayBlock.style.display = 'block';
      seedDisplay.textContent = seed;
    } else {
      seedDisplayBlock.style.display = 'none';
      seedDisplay.textContent = '';
    }

    let participants = textarea.value
      .split('\n')
      .map(name => name.trim())
      .filter(name => name !== '');

    let winnerCount = parseInt(countInput, 10);
    if (isNaN(winnerCount) || winnerCount < 1) {
      alert('請輸入正確的得獎人數');
      return;
    }
    if (!allowRepeat && winnerCount > participants.length) {
      alert('得獎人數不得超過參與者總數，或請勾選允許重複中獎');
      return;
    }
    if (participants.length < 1) {
      alert('請至少輸入 1 位參與者');
      return;
    }

      // 獲取中獎者
      const shuffled = await shuffleWithSHA256(participants, seed);
      winners = shuffled.slice(0, winnerCount);

    // 顯示 3D 卡牌雨動畫
    await showCardShowerAnimation(winners);

    // Display winners
    winners.forEach((name, index) => {
      const col = document.createElement('div');
      col.className = 'col-12 col-sm-6 col-md-4';
      const card = document.createElement('div');
      card.className = 'card winner-card highlight-winner'; // Added highlight-winner class
      card.style.animationDelay = `${index * 0.2}s`;
      const cardBody = document.createElement('div');
      cardBody.className = 'card-body text-center';
      const title = document.createElement('h5');
      title.className = 'card-title';
      title.textContent = ` ${name} `; 
      const subtitle = document.createElement('p');
      subtitle.className = 'card-text text-muted';
      subtitle.textContent = '恭喜中獎！';
      cardBody.appendChild(title);
      cardBody.appendChild(subtitle);
      card.appendChild(cardBody);
      col.appendChild(card);
      winnersContainer.appendChild(col);
    });

    // Auto-scroll to winners
    scrollToWinners();

    // Trigger confetti
    // Ensure body is accessible here or re-fetch it.
    const currentBody = document.body; // Re-fetch body element to ensure it's available
    const isDarkMode = currentBody.classList.contains('dark');
    let confettiColors = isDarkMode ? ['#FFFFFF', '#e9ecef', '#adb5bd', '#38d980'] : ['#1a1a1a', '#3e4346', '#565e62', '#2ECC71'];
    // Add gold/silver for surprise effect
    confettiColors = [...confettiColors, '#FFD700', '#C0C0C0'];

    // Basic test call for confetti
    if (typeof confetti === 'function') {
      console.log('Confetti function is available. Attempting basic call.');
      try {
        confetti(); // Simplest possible call
      } catch (e) {
        console.error('Error during basic confetti call:', e);
      }
    } else {
      console.error('Confetti function is NOT available.');
    }

    // First burst - wider and more particles
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 400, // Significantly increased particle count
        spread: 300,        // Wider spread
        origin: { y: 0.5 }, // Slightly higher origin
        colors: confettiColors,
        shapes: ['circle', 'square', 'star'],
        startVelocity: 30, // Make them shoot up a bit more
        drift: 0, // Less sideways drift for the initial burst
        gravity: 0.8 // Slightly stronger gravity
      });

      // Second burst - more focused and with different shapes/colors if desired
      setTimeout(() => {
        confetti({
          particleCount: 200,
          spread: 120,
          origin: { y: 0.6 },
          colors: ['#FFD700', '#C0C0C0', isDarkMode ? '#38d980' : '#2ECC71'], // Emphasize gold, silver and accent
          shapes: ['star'], // Focus on stars for the second burst
          scalar: 1.2 // Slightly larger particles
        });
      }, 150); // Slight delay for the second burst
    } // Closing the if (typeof confetti === 'function') block

    // Brief background flash
    currentBody.classList.add('flash-background');
    setTimeout(() => {
      currentBody.classList.remove('flash-background');
    }, 300);


    if (!allowRepeat) {
      winners.forEach(w => {
        let idx;
        while ((idx = participants.indexOf(w)) !== -1) {
          participants.splice(idx, 1);
        }
      });
      textarea.value = participants.join('\n');
      updateParticipantCount(participants.length);
      renderRemainingList(participants);
    }

    const now = new Date();
    const nowStr = now.getFullYear() + '-' +
                   String(now.getMonth()+1).padStart(2,'0') + '-' +
                   String(now.getDate()).padStart(2,'0') + ' ' +
                   String(now.getHours()).padStart(2,'0') + ':' +
                   String(now.getMinutes()).padStart(2,'0') + ':' +
                   String(now.getSeconds()).padStart(2,'0');
    const newRecord = {
      prize: prizeInput,
      seed: seed,
      date: nowStr,
      winners: winners,
      allowRepeat: allowRepeat
    };
    historyList.unshift(newRecord);
    if (historyList.length > 10) { // Keep only last 10 records for simplicity, adjust as needed
      historyList.splice(10);
    }
      saveHistory();
      populatePrizeOptions();
      updateHistoryDisplay();
      
    } catch (error) {
      console.error('抽獎過程發生錯誤:', error);
      alert('抽獎過程發生錯誤，請重新嘗試');
    } finally {
      // 重置抽獎狀態
      isDrawing = false;
      drawButton.disabled = false;
      drawButton.textContent = winners && winners.length > 0 ? '再次抽獎' : '開始抽獎';
    }
  });
});
