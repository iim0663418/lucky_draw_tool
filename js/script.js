const PAGE_SIZE = 5;
let historyList = [];
let currentPage = 1;

// 3D 場景相關變數
let scene, camera, renderer;
let cards = [];
let animationId;

// 初始化 3D 場景
function initThreeScene() {
  const canvas = document.getElementById('three-canvas');
  const overlay = document.getElementById('overlay');
  
  // 創建場景
  scene = new THREE.Scene();
  
  // 創建攝影機
  camera = new THREE.PerspectiveCamera(
    60, // 較小的視角以減少變形
    window.innerWidth / window.innerHeight, // 長寬比
    0.1, // 近裁剪面
    1000 // 遠裁剪面
  );
  camera.position.z = 3; // 靠近一些以獲得更清晰的效果
  
  // 創建渲染器
  renderer = new THREE.WebGLRenderer({ 
    canvas: canvas,
    alpha: true, // 透明背景
    antialias: true, // 抗鋸齒
    powerPreference: "high-performance" // 高效能
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 限制最大像素比避免過度渲染
  renderer.outputEncoding = THREE.sRGBEncoding; // 更好的顏色顯示
  
  // 設置 canvas 樣式
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  
  // 加入基本光照
  const ambientLight = new THREE.AmbientLight(0x404040, 0.6); // 環境光
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); // 平行光
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);
}

// 創建文字材質的函數
function createTextTexture(text, fontSize = 48, textColor = '#000000', bgColor = '#ffffff') {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  // 提高解析度以獲得更清晰的文字
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = 1024 * pixelRatio;
  canvas.height = 512 * pixelRatio;
  canvas.style.width = '1024px';
  canvas.style.height = '512px';
  
  // 縮放 context 以適應高解析度
  context.scale(pixelRatio, pixelRatio);
  
  // 設置背景
  context.fillStyle = bgColor;
  context.fillRect(0, 0, 1024, 512);
  
  // 啟用文字反鋸齒
  context.textRenderingOptimization = 'optimizeQuality';
  context.imageSmoothingEnabled = true;
  
  // 設置文字樣式
  context.fillStyle = textColor;
  context.font = `bold ${fontSize * 2}px 'Noto Sans TC', 'Microsoft JhengHei', sans-serif`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  
  // 繪製文字
  context.fillText(text, 512, 256);
  
  // 創建材質
  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.format = THREE.RGBAFormat;
  return new THREE.MeshBasicMaterial({ map: texture });
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
    // 圖片載入失敗，使用文字作為後備
    context.fillStyle = '#007bff';
    context.font = 'bold 72px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('moda', 512, 256);
  };
  
  // 載入實際 Logo
  img.src = 'https://yt3.googleusercontent.com/D9Q7NjE7vztVgb0c2-OwofJtZOdFjghZWLw0Yj17dW9X9oMrve4Xt-16vN4tOvAvxcRu43TR=s900-c-k-c0x00ffffff-no-rj';
  
  // 先設置預設內容
  context.fillStyle = '#007bff';
  context.font = 'bold 72px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('moda', 512, 256);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.format = THREE.RGBAFormat;
  return new THREE.MeshBasicMaterial({ map: texture });
}

// 創建 3D 卡牌的工廠函式
function createWinnerCard(winnerName) {
  // 創建卡牌幾何形狀 (薄薄的盒子) - 調整大小
  const cardWidth = 1.5;
  const cardHeight = 0.9;
  const cardDepth = 0.05;
  const geometry = new THREE.BoxGeometry(cardWidth, cardHeight, cardDepth);
  
  // 創建 6 面材質陣列
  const materials = [
    // 右側面 (索引 0)
    new THREE.MeshBasicMaterial({ color: 0x333333 }),
    // 左側面 (索引 1)  
    new THREE.MeshBasicMaterial({ color: 0x333333 }),
    // 上側面 (索引 2)
    new THREE.MeshBasicMaterial({ color: 0x333333 }),
    // 下側面 (索引 3)
    new THREE.MeshBasicMaterial({ color: 0x333333 }),
    // 正面 - 得獎者姓名 (索引 4)
    createTextTexture(winnerName, 48, '#ffffff', '#2ECC71'),
    // 背面 - Logo (索引 5)
    createLogoTexture()
  ];
  
  // 創建網格
  const card = new THREE.Mesh(geometry, materials);
  
  return card;
}

// 動畫循環
function animate() {
  animationId = requestAnimationFrame(animate);
  
  // 如果有動畫庫（TWEEN.js），更新補間動畫
  if (typeof TWEEN !== 'undefined') {
    TWEEN.update();
  }
  
  // 渲染場景
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
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
  // 停止動畫
  stopAnimation();
  
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
  
  // 清理渲染器
  if (renderer) {
    renderer.dispose();
    renderer = null;
  }
  
  // 清理場景和攝影機
  scene = null;
  camera = null;
}

// 計算最終網格佈局位置
function calculateGridLayout(cardCount) {
  const positions = [];
  const cardWidth = 2.0; // 考慮間距的卡牌寬度
  const cardHeight = 1.3; // 考慮間距的卡牌高度
  
  // 計算最佳的行列數
  const aspectRatio = window.innerWidth / window.innerHeight;
  let cols = Math.ceil(Math.sqrt(cardCount * aspectRatio));
  let rows = Math.ceil(cardCount / cols);
  
  // 調整以確保所有卡牌都能顯示
  while (cols * rows < cardCount) {
    if (cols <= rows) {
      cols++;
    } else {
      rows++;
    }
  }
  
  // 計算起始位置（居中）
  const totalWidth = (cols - 1) * cardWidth;
  const totalHeight = (rows - 1) * cardHeight;
  const startX = -totalWidth / 2;
  const startY = totalHeight / 2;
  
  // 生成位置陣列
  for (let i = 0; i < cardCount; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    
    positions.push({
      x: startX + col * cardWidth,
      y: startY - row * cardHeight,
      z: 0
    });
  }
  
  return positions;
}

// 卡牌動畫序列
function animateCard(card, finalPosition, delay = 0) {
  return new Promise((resolve) => {
    // 階段1：起始狀態 (都在中心後方)
    card.position.set(0, 0, -2);
    card.rotation.set(0, Math.PI, 0); // 背面朝前
    card.scale.set(0.1, 0.1, 0.1); // 很小
    
    // 階段2：飛舞狀態 (隨機散開)
    const randomX = (Math.random() - 0.5) * 8;
    const randomY = (Math.random() - 0.5) * 6;
    const randomZ = Math.random() * 3 + 1;
    
    setTimeout(() => {
      // 放大並飛到隨機位置
      new TWEEN.Tween(card.position)
        .to({ x: randomX, y: randomY, z: randomZ }, 1000)
        .easing(TWEEN.Easing.Cubic.Out)
        .start();
        
      new TWEEN.Tween(card.scale)
        .to({ x: 1, y: 1, z: 1 }, 1000)
        .easing(TWEEN.Easing.Cubic.Out)
        .start();
        
      new TWEEN.Tween(card.rotation)
        .to({ x: Math.random() * Math.PI, y: Math.random() * Math.PI, z: Math.random() * Math.PI }, 1000)
        .easing(TWEEN.Easing.Cubic.Out)
        .onComplete(() => {
          // 階段3：飛到最終位置並翻轉到正面
          setTimeout(() => {
            new TWEEN.Tween(card.position)
              .to(finalPosition, 1500)
              .easing(TWEEN.Easing.Cubic.InOut)
              .start();
              
            new TWEEN.Tween(card.rotation)
              .to({ x: 0, y: 0, z: 0 }, 1500) // 正面朝前
              .easing(TWEEN.Easing.Cubic.InOut)
              .onComplete(() => {
                resolve();
              })
              .start();
          }, 500);
        })
        .start();
    }, delay);
  });
}

// 3D 卡牌雨動畫主函式
async function showCardShowerAnimation(winners) {
  return new Promise(async (resolve) => {
    const overlay = document.getElementById('overlay');
    
    // 顯示 overlay
    overlay.classList.add('show');
    
    // 初始化 3D 場景
    initThreeScene();
    
    // 開始動畫循環
    animate();
    
    // 創建所有卡牌
    cards = [];
    winners.forEach(winnerName => {
      const card = createWinnerCard(winnerName);
      cards.push(card);
      scene.add(card);
    });
    
    // 計算最終位置
    const finalPositions = calculateGridLayout(winners.length);
    
    // 等待一小段時間讓場景準備完成
    await new Promise(r => setTimeout(r, 500));
    
    // 依序啟動每張卡牌的動畫
    const animationPromises = cards.map((card, index) => {
      return animateCard(card, finalPositions[index], index * 200); // 每張卡片間隔 200ms
    });
    
    // 等待所有動畫完成
    await Promise.all(animationPromises);
    
    // 再等待 2 秒讓使用者欣賞最終結果
    await new Promise(r => setTimeout(r, 2000));
    
    // 淡出 overlay
    overlay.classList.add('fade-out');
    setTimeout(() => {
      overlay.classList.remove('show', 'fade-out');
      // 清理 3D 場景
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
    
    // 更新渲染器大小
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
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
document.addEventListener('DOMContentLoaded', () => {
  loadHistory();
  populatePrizeOptions();
  updateHistoryDisplay();
  initializeTheme(); // Call theme initialization
  
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
