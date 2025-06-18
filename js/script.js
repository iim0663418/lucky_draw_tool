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
  
  // 創建攝影機
  camera = new THREE.PerspectiveCamera(
    45, // 縮小視角 (FOV)，類似長焦鏡頭，放大主體
    window.innerWidth / window.innerHeight, // 長寬比
    0.1, // 近裁剪面
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
  
  // 創建 CSS3D 場景和渲染器（用於清晰文字）
  if (typeof THREE.CSS3DRenderer !== 'undefined') {
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
    console.log('CSS3DRenderer loaded successfully');
  } else {
    console.info('CSS3DRenderer not available, using enhanced WebGL-only mode');
    cssScene = null;
    cssRenderer = null;
  }
  
  // 加入基本光照
  const ambientLight = new THREE.AmbientLight(0x404040, 0.6); // 環境光
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); // 平行光
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);
}

// 創建超高品質文字材質的函數 (SDF-like approach) - moda 黑白黃主題
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
  texture.flipY = false; // 避免上下翻轉
  
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
    side: THREE.FrontSide
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
        <div class="card-decoration">🏆</div>
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
  
  // Logo 圓形背景 - moda 黃色主題
  const logoCircle = cardElement.querySelector('.logo-circle');
  logoCircle.style.position = 'relative';
  logoCircle.style.width = '160px';
  logoCircle.style.height = '160px';
  logoCircle.style.background = 'radial-gradient(circle, #FFD700 0%, #FFA500 100%)';
  logoCircle.style.borderRadius = '50%';
  logoCircle.style.display = 'flex';
  logoCircle.style.flexDirection = 'column';
  logoCircle.style.alignItems = 'center';
  logoCircle.style.justifyContent = 'center';
  logoCircle.style.boxShadow = '0 8px 25px rgba(255,215,0,0.6), inset 0 2px 10px rgba(255,255,255,0.3)';
  logoCircle.style.border = '3px solid rgba(255,255,255,0.8)';
  
  // Logo 文字 - moda 黑色字體
  const logoText = cardElement.querySelector('.logo-text');
  logoText.style.color = '#1a1a1a';
  logoText.style.fontSize = '28px';
  logoText.style.fontWeight = 'bold';
  logoText.style.fontFamily = "'SF Pro Display', 'PingFang TC', 'Noto Sans TC', 'Microsoft JhengHei', sans-serif";
  logoText.style.textShadow = '1px 1px 2px rgba(255,255,255,0.3)';
  logoText.style.letterSpacing = '1px';
  
  // Logo 副標題
  const logoSubtitle = cardElement.querySelector('.logo-subtitle');
  logoSubtitle.style.color = 'rgba(26,26,26,0.8)';
  logoSubtitle.style.fontSize = '10px';
  logoSubtitle.style.fontWeight = 'bold';
  logoSubtitle.style.fontFamily = "'SF Pro Display', 'PingFang TC', 'Noto Sans TC', sans-serif";
  logoSubtitle.style.marginTop = '2px';
  logoSubtitle.style.letterSpacing = '2px';
  
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
  cardDecoration.style.fontSize = '24px';
  cardDecoration.style.opacity = '0.8';
  
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
  };
  img.onerror = function() {
    // 圖片載入失敗，使用精美的後備設計
    drawFallbackLogo(context);
  };
  
  // 載入實際 Logo
  img.src = 'https://yt3.googleusercontent.com/D9Q7NjE7vztVgb0c2-OwofJtZOdFjghZWLw0Yj17dW9X9oMrve4Xt-16vN4tOvAvxcRu43TR=s900-c-k-c0x00ffffff-no-rj';
  
  // 先設置預設內容
  drawFallbackLogo(context);
  
  const texture = new THREE.CanvasTexture(canvas);
  
  // 啟用 Mipmap 生成以獲得更好的渲染品質
  texture.generateMipmaps = true;
  
  // 使用最高品質的 Mipmap 篩選器
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.format = THREE.RGBAFormat;
  texture.flipY = false; // 避免上下翻轉
  
  return new THREE.MeshBasicMaterial({ 
    map: texture,
    transparent: true,
    alphaTest: 0.1,
    side: THREE.FrontSide
  });
}

// 創建 3D 卡牌的工廠函式 - 性能優化版本
function createWinnerCard(winnerName) {
  // 優化尺寸：在品質和性能間平衡
  const cardWidth = 2.0; // 稍微縮小以提升性能
  const cardHeight = 1.2;
  const cardDepth = 0.03; // 更薄的卡片減少幾何複雜度
  
  // 修正：使用最簡單的幾何體設定，避免面分離
  const geometry = new THREE.BoxGeometry(cardWidth, cardHeight, cardDepth);
  
  // 確保幾何體是一個整體，防止面分離
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  
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
  
  // THREE.js BoxGeometry 標準面順序映射
  const materials = [
    sideMaterial,   // 0: 右面 (+X)
    sideMaterial,   // 1: 左面 (-X) 
    sideMaterial,   // 2: 上面 (+Y)
    sideMaterial,   // 3: 下面 (-Y)
    frontMaterial,  // 4: 前面 (+Z) - 文字面
    backMaterial    // 5: 後面 (-Z) - Logo 面
  ];
  
  console.log(`Created materials for card: ${winnerName}`, {
    frontMaterial: frontMaterial.map ? 'with texture' : 'basic material',
    backMaterial: backMaterial.map ? 'with texture' : 'basic material'
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
  
  // 設置卡片屬性以提升渲染品質
  card.castShadow = false; // 優化性能
  card.receiveShadow = false;
  card.frustumCulled = true; // 啟用視錐體剔除
  
  return card;
}

// 動畫循環 (簡化版)
function animate() {
  // 這個 ID 會在 stopAnimation 被清除，所以這是循環的條件
  animationId = requestAnimationFrame(animate);

  // 如果有動畫庫（TWEEN.js），更新補間動畫
  if (typeof TWEEN !== 'undefined') {
    TWEEN.update();
  }

  // 渲染 WebGL 場景（背景和效果）
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }

  // 渲染 CSS3D 場景（清晰文字）
  if (cssRenderer && cssScene && camera) {
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
  
  // 清理卡牌
  cards.forEach(card => {
    if (card.geometry) card.geometry.dispose();
    if (card.material) {
      if (Array.isArray(card.material)) {
        card.material.forEach(mat => {
          if (mat.map) mat.map.dispose();
          mat.dispose();
        });
      } else {
        if (card.material.map) card.material.map.dispose();
        card.material.dispose();
      }
    }
    if (scene) scene.remove(card);
  });
  cards = [];
  
  // 清理 CSS3D 卡牌
  cssCards.forEach(cssCard => {
    if (cssScene) cssScene.remove(cssCard);
    if (cssCard.element && cssCard.element.parentNode) {
      cssCard.element.parentNode.removeChild(cssCard.element);
    }
  });
  cssCards = [];
  
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

// 同步 WebGL 和 CSS3D 卡牌動畫 (V3 - 加入防穿模)
function animateCardPair(webglCard, cssCard, finalPosition, gridScale, delay = 0, scatterPosition) {
  return new Promise((resolve) => {
    // 階段1：起始狀態 (都在中心後方)
    webglCard.position.set(0, 0, -2);
    webglCard.rotation.set(0, 0, 0); // 修正：正面朝前 (前面是 +Z 面，索引 4)
    webglCard.scale.set(0.1, 0.1, 0.1); // 很小
    
    // CSS3D 卡片同步（如果存在）
    if (cssCard) {
      cssCard.position.copy(webglCard.position);
      cssCard.rotation.copy(webglCard.rotation);
      cssCard.scale.set(0.0006, 0.0006, 0.0006); // CSS3D 需要更小的縮放
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

      // WebGL 卡片動畫 - 縮短時間提升流暢度
      new TWEEN.Tween(webglCard.position)
        .to({ x: randomX, y: randomY, z: randomZ }, 800)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(syncCSS)
        .start();
        
      new TWEEN.Tween(webglCard.scale)
        .to({ x: 1, y: 1, z: 1 }, 800)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start();
        
      new TWEEN.Tween(webglCard.rotation)
        .to({ x: Math.random() * Math.PI, y: Math.random() * Math.PI, z: Math.random() * Math.PI }, 800)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onComplete(() => {
          // 階段3：飛到最終位置並翻轉到正面 - 優化版本
          setTimeout(() => {
            // 使用更流暢的最終階段動畫
            new TWEEN.Tween(webglCard.position)
              .to(finalPosition, 1200) // 縮短時間
              .easing(TWEEN.Easing.Cubic.InOut) // 使用更平滑的 easing
              .onUpdate(syncCSS)
              .start();
              
            new TWEEN.Tween(webglCard.rotation)
              .to({ x: 0, y: 0, z: 0 }, 1200) // 正面朝前
              .easing(TWEEN.Easing.Cubic.InOut)
              .start();
              
            // 讓卡牌縮放到最終計算出的 gridScale
            new TWEEN.Tween(webglCard.scale)
              .to({ x: gridScale, y: gridScale, z: gridScale }, 1200)
              .easing(TWEEN.Easing.Cubic.InOut)
              .onComplete(() => resolve()) // 在最後一個動畫完成時 resolve
              .start();
          }, 300); // 縮短間隔時間
        })
        .start();
    }, delay);
  });
}

// 原版動畫函數 (V3 - 加入防穿模)
function animateCard(card, finalPosition, gridScale, delay = 0, scatterPosition) {
  return new Promise((resolve) => {
    // 階段1：起始狀態 (都在中心後方)
    card.position.set(0, 0, -2);
    card.rotation.set(0, 0, 0); // 修正：正面朝前 (前面是 +Z 面，索引 4)
    card.scale.set(0.1, 0.1, 0.1); // 很小
    
    // 階段2：飛舞狀態 - 使用預分配的分散位置避免穿模
    const { x: randomX, y: randomY, z: randomZ } = scatterPosition;
    
    setTimeout(() => {
      // 優化的單卡動畫 - 更流暢的設定
      new TWEEN.Tween(card.position)
        .to({ x: randomX, y: randomY, z: randomZ }, 800)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start();
        
      new TWEEN.Tween(card.scale)
        .to({ x: 1, y: 1, z: 1 }, 800)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start();
        
      new TWEEN.Tween(card.rotation)
        .to({ x: Math.random() * Math.PI, y: Math.random() * Math.PI, z: Math.random() * Math.PI }, 800)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onComplete(() => {
          // 階段3：飛到最終位置並翻轉到正面 - 優化版本
          setTimeout(() => {
            new TWEEN.Tween(card.position)
              .to(finalPosition, 1200)
              .easing(TWEEN.Easing.Cubic.InOut)
              .start();
              
            new TWEEN.Tween(card.rotation)
              .to({ x: 0, y: 0, z: 0 }, 1200) // 正面朝前
              .easing(TWEEN.Easing.Cubic.InOut)
              .start();
              
            // 讓卡牌縮放到最終計算出的 gridScale
            new TWEEN.Tween(card.scale)
              .to({ x: gridScale, y: gridScale, z: gridScale }, 1200)
              .easing(TWEEN.Easing.Cubic.InOut)
              .onComplete(() => resolve()) // 在最後一個動畫完成時 resolve
              .start();
          }, 300);
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
      }, 500);
    }
  }, 600); // 稍微加快載入步驟顯示
  
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
    
    // 創建 WebGL 卡牌（背景和效果）
    cards = [];
    cssCards = [];
    
    winners.forEach(winnerName => {
      // WebGL 卡牌（用於背景效果）
      const webglCard = createWinnerCard(winnerName);
      
      // 確保卡片創建成功才添加到場景
      if (webglCard) {
        cards.push(webglCard);
        scene.add(webglCard);
        
        // CSS3D 卡牌（用於清晰文字）- 僅在 CSS3DRenderer 可用時
        if (cssScene && cssRenderer) {
          const cssCard = createCSSCard(winnerName);
          if (cssCard) {
            cssCards.push(cssCard);
            cssScene.add(cssCard);
            
            // 同步初始位置
            cssCard.position.copy(webglCard.position);
            cssCard.rotation.copy(webglCard.rotation);
            cssCard.scale.copy(webglCard.scale);
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
    
    // 等待一小段時間讓場景準備完成
    await new Promise(r => setTimeout(r, 500));
    
    // 優化：錯開卡片出現時間，減少同時動畫數量
    const animationPromises = cards.map((card, index) => {
      const delay = index * 150; // 縮短間隔時間但保持錯開效果
      const scatterPos = scatterPositions[index];
      
      if (cssCards.length > 0) {
        // 使用 CSS3D + WebGL 混合模式
        const cssCard = cssCards[index];
        return animateCardPair(card, cssCard, finalPositions[index], gridScale, delay, scatterPos);
      } else {
        // 僅使用 WebGL 模式
        return animateCard(card, finalPositions[index], gridScale, delay, scatterPos);
      }
    });
    
    // 等待所有動畫完成
    await Promise.all(animationPromises);
    
    // 再等待 2 秒讓使用者欣賞最終結果
    await new Promise(r => setTimeout(r, 2000));
    
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
    const winners = shuffled.slice(0, winnerCount);

    // 顯示 3D 卡牌雨動畫
    await showCardShowerAnimation(winners);

    const winnersContainer = document.getElementById('winnersContainer');
    winnersContainer.innerHTML = '';

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
      title.textContent = `🏆 ${name} 🏆`; // Added trophy emojis
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
  });
});
