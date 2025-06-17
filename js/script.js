// Three.js animation will be available as window.threeJSAnimation
console.log('Main script loaded');

const PAGE_SIZE = 5;
let historyList = [];
let currentPage = 1;

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

// Show countdown overlay function with optimized resource preloading
async function showCountdownOverlay() {
  const overlay = document.getElementById('overlay');
  const container = document.getElementById('countdownContainer');
  container.innerHTML = '';
  overlay.classList.add('show');

  // 創建載入進度指示器
  const progressContainer = document.createElement('div');
  progressContainer.className = 'preload-progress';
  progressContainer.style.cssText = `
    position: absolute;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    color: white;
    font-size: 14px;
    text-align: center;
    opacity: 0.8;
  `;
  container.appendChild(progressContainer);

  // 預載入資源的 Promise 陣列
  const preloadPromises = [];
  let loadedCount = 0;
  const totalResources = 3; // 預計載入的資源數量

  // 更新載入進度
  const updateProgress = (message) => {
    loadedCount++;
    progressContainer.textContent = `${message} (${loadedCount}/${totalResources})`;
    console.log(`Preload progress: ${message} (${loadedCount}/${totalResources})`);
  };

  // 在倒數期間開始預載入資源
  if (window.threeJSAnimation) {
    // 1. 預載入 MODA SVG 紋理
    preloadPromises.push(
      new Promise(resolve => {
        try {
          window.threeJSAnimation.createModaSvgTexture();
          updateProgress('MODA 背景已載入');
          resolve();
        } catch (error) {
          console.warn('MODA texture preload failed:', error);
          updateProgress('MODA 背景載入失敗');
          resolve();
        }
      })
    );

    // 2. 預初始化 Three.js 場景（如果尚未初始化）
    preloadPromises.push(
      new Promise(resolve => {
        try {
          if (!window.threeJSAnimation.scene) {
            // 提前初始化場景元件
            const container = document.getElementById('threeContainer');
            if (container) {
              window.threeJSAnimation.preInitializeScene(container);
              updateProgress('3D 場景已初始化');
            }
          } else {
            updateProgress('3D 場景已就緒');
          }
          resolve();
        } catch (error) {
          console.warn('Scene preload failed:', error);
          updateProgress('3D 場景初始化失敗');
          resolve();
        }
      })
    );

    // 3. 預載入音效資源（即使已靜音，確保快取準備完成）
    preloadPromises.push(
      new Promise(resolve => {
        try {
          if (window.threeJSAnimation.initAudioSystem) {
            window.threeJSAnimation.initAudioSystem();
          }
          updateProgress('音效系統已準備');
          resolve();
        } catch (error) {
          console.warn('Audio preload failed:', error);
          updateProgress('音效系統準備失敗');
          resolve();
        }
      })
    );
  } else {
    // 如果 Three.js 動畫不可用，顯示簡單的載入訊息
    progressContainer.textContent = '準備中...';
  }

  // 倒數計時與資源載入並行執行
  for (let c = 3; c > 0; c--) {
    const div = document.createElement('div');
    div.className = 'countdown-number';
    div.textContent = c;
    container.appendChild(div);
    void div.offsetWidth;
    
    // 在最後一秒等待所有預載入完成
    if (c === 1) {
      const timeoutPromise = new Promise(r => setTimeout(r, 800));
      await Promise.race([
        Promise.all(preloadPromises),
        timeoutPromise // 最多等待 800ms，避免載入延遲過久
      ]);
      
      if (loadedCount < totalResources) {
        progressContainer.textContent = `載入完成 (${loadedCount}/${totalResources}) - 開始動畫`;
      } else {
        progressContainer.textContent = '所有資源載入完成！';
      }
      
      await new Promise(r => setTimeout(r, 200)); // 剩餘時間
    } else {
      await new Promise(r => setTimeout(r, 1000));
    }
    
    container.removeChild(div);
  }
  
  overlay.classList.add('fade-out');
  setTimeout(() => {
    overlay.classList.remove('show', 'fade-out');
  }, 1000);

  console.log('Countdown completed with resource preloading');
  console.log('Final loading statistics:', {
    resourcesLoaded: loadedCount,
    totalResources: totalResources,
    loadingSuccess: loadedCount === totalResources,
    threeJSReady: !!window.threeJSAnimation?.scene
  });
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


  // Debug function to check Three.js availability
  window.debugThreeJS = function() {
    console.log('=== Three.js Debug Information ===');
    console.log('window.THREE available:', !!window.THREE);
    console.log('window.threeJSAnimation available:', !!window.threeJSAnimation);
    if (window.threeJSAnimation) {
      console.log('threeJSAnimation methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(window.threeJSAnimation)));
    } else {
      console.log('threeJSAnimation is not available');
    }
    console.log('=====================================');
  };

  // Call debug function immediately
  window.debugThreeJS();

  // Try to ensure Three.js animation is available
  function ensureThreeJSAnimation() {
    return new Promise((resolve) => {
      // If already available, resolve immediately
      if (window.threeJSAnimation && window.threeJSLoadedSuccessfully) {
        console.log('Three.js animation already available');
        resolve(true);
        return;
      }

      // If loading failed, resolve false immediately
      if (window.threeJSLoadedSuccessfully === false) {
        console.warn('Three.js animation loading previously failed');
        resolve(false);
        return;
      }

      // Wait a bit for modules to load
      setTimeout(() => {
        if (window.threeJSAnimation && window.threeJSLoadedSuccessfully) {
          console.log('Three.js animation became available after delay');
          resolve(true);
        } else {
          console.warn('Three.js animation still not available after waiting');
          console.log('Load success flag:', window.threeJSLoadedSuccessfully);
          resolve(false);
        }
      }, 200); // Give a bit more time for module loading
    });
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

    // Show overlay countdown
    await showCountdownOverlay();

    const shuffled = await shuffleWithSHA256(participants, seed);
    const winners = shuffled.slice(0, winnerCount);

    // Get winners container
    const winnersContainer = document.getElementById('winnersContainer');
    
    // Try to ensure Three.js animation is available
    const threeJSAvailable = await ensureThreeJSAnimation();
    
    // Debug - check Three.js availability again before using
    console.log('=== Draw Button Clicked - Three.js Check ===');
    console.log('window.threeJSAnimation available:', !!window.threeJSAnimation);
    console.log('window.threeJSAnimation type:', typeof window.threeJSAnimation);
    if (window.threeJSAnimation) {
      console.log('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(window.threeJSAnimation)));
    }
    console.log('===========================================');

    // Check if Three.js animation is available
    if (threeJSAvailable && window.threeJSAnimation) {
      console.log('Three.js animation available, starting animation...');
      
      // Hide winnersContainer and disable page interactions during animation
      winnersContainer.style.display = 'none';
      document.body.style.pointerEvents = 'none';
      
      // 添加緊急解鎖機制 - 如果用戶點擊任何地方，恢復交互
      const emergencyUnlock = () => {
        document.body.style.pointerEvents = 'auto';
        document.removeEventListener('click', emergencyUnlock, true);
        console.log('Emergency unlock activated - page interactions restored');
      };
      document.addEventListener('click', emergencyUnlock, true);
      
      // Start Three.js animation first
      await new Promise((resolve) => {
        window.threeJSAnimation.startAnimation(winners, () => {
          // Re-enable page interactions
          document.body.style.pointerEvents = 'auto';
          
          // Show winnersContainer and display traditional winners
          winnersContainer.style.display = 'flex';
          winnersContainer.style.flexWrap = 'wrap';
          winnersContainer.style.justifyContent = 'center';
          winnersContainer.style.gap = '20px';
          winnersContainer.innerHTML = '';

          winners.forEach((name, index) => {
            const card = document.createElement('div');
            card.className = 'card winner-card highlight-winner';
            card.style.animationDelay = `${index * 0.2}s`;
            card.style.minWidth = '200px';
            card.style.maxWidth = '250px';
            card.style.flex = '0 0 auto';
            const cardBody = document.createElement('div');
            cardBody.className = 'card-body text-center';
            const title = document.createElement('h5');
            title.className = 'card-title';
            title.textContent = `🏆 ${name} 🏆`;
            const subtitle = document.createElement('p');
            subtitle.className = 'card-text text-muted';
            subtitle.textContent = '恭喜中獎！';
            cardBody.appendChild(title);
            cardBody.appendChild(subtitle);
            card.appendChild(cardBody);
            winnersContainer.appendChild(card);
          });

          // Auto-scroll to winners
          scrollToWinners();
          
          resolve();
        });
      });
    } else {
      console.warn('Three.js animation not available, showing traditional winners directly');
      console.log('Possible reasons:');
      console.log('1. Module script failed to load');
      console.log('2. Three.js CDN is blocked');
      console.log('3. Browser does not support ES modules');
      console.log('4. JavaScript error in module script');
      
      // Show traditional winners directly
      winnersContainer.innerHTML = '';

      winners.forEach((name, index) => {
        const col = document.createElement('div');
        col.className = 'col-12 col-sm-6 col-md-4';
        const card = document.createElement('div');
        card.className = 'card winner-card highlight-winner';
        card.style.animationDelay = `${index * 0.2}s`;
        const cardBody = document.createElement('div');
        cardBody.className = 'card-body text-center';
        const title = document.createElement('h5');
        title.className = 'card-title';
        title.textContent = `🏆 ${name} 🏆`;
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
    }

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

// Three.js animation instance will be available as window.threeJSAnimation after module loads
