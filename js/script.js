let historyList = [];

// 讀取 localStorage 初始化 historyList
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

// 儲存 historyList 至 localStorage
function saveHistory() {
  localStorage.setItem('drawHistory', JSON.stringify(historyList));
}

// 將 historyList 中所有品項產出選項
function populatePrizeOptions() {
  const select = document.getElementById('prizeFilter');
  const current = select.value;
  const prizes = Array.from(new Set(historyList.map(item => item.prize)));
  select.innerHTML = '<option value="全部">全部</option>';
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

// 根據傳入清單渲染歷史紀錄
function renderHistory(list) {
  const container = document.getElementById('historyContainer');
  container.innerHTML = '';
  if (list.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'alert alert-info';
    empty.textContent = '尚無此品項抽獎紀錄。';
    container.appendChild(empty);
    return;
  }
  list.forEach(record => {
    const card = document.createElement('div');
    card.className = 'card history-card';
    card.innerHTML = `
      <div class="card-body">
        <h5 class="card-title">品項：${record.prize}</h5>
        <h6 class="card-subtitle mb-2 text-muted">時間：${record.date}</h6>
        <p class="card-text">中獎者：${record.winners.join('、')}</p>
      </div>
    `;
    container.appendChild(card);
  });
}

// 篩選並渲染歷史紀錄
function filterAndRenderHistory(prizeName) {
  let filtered = [];
  if (prizeName === '全部') {
    filtered = historyList;
  } else {
    filtered = historyList.filter(item => item.prize === prizeName);
  }
  renderHistory(filtered);
}

document.addEventListener('DOMContentLoaded', () => {
  loadHistory();
  populatePrizeOptions();
  filterAndRenderHistory('全部');

  document.getElementById('prizeFilter').addEventListener('change', function() {
    filterAndRenderHistory(this.value);
  });

  document.getElementById('clearHistory').addEventListener('click', function() {
    if (confirm('確定要清除所有歷史紀錄嗎？')) {
      historyList = [];
      saveHistory();
      populatePrizeOptions();
      filterAndRenderHistory('全部');
    }
  });
});

document.getElementById('drawButton').addEventListener('click', async function () {
  // 取得輸入值
  const textarea = document.getElementById('nameList');
  const seedInput = document.getElementById('seedInput').value.trim();
  const prizeInput = document.getElementById('prizeInput').value.trim() || '未命名品項';
  const countInput = document.getElementById('winnerCount').value.trim();
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

  // 解析參與者名單
  const names = textarea.value
    .split('\n')
    .map(name => name.trim())
    .filter(name => name !== '');

  // 解析得獎人數並檢查
  let winnerCount = parseInt(countInput, 10);
  if (isNaN(winnerCount) || winnerCount < 1) {
    alert('請輸入正確的得獎人數');
    return;
  }
  if (winnerCount > names.length) {
    alert('得獎人數不得超過參與者總數');
    return;
  }
  if (names.length < 1) {
    alert('請至少輸入 1 位參與者');
    return;
  }

  // 洗牌並抽取
  const shuffled = await shuffleWithSHA256(names, seed);
  const winners = shuffled.slice(0, winnerCount);

  // 顯示倒數動畫
  const winnersContainer = document.getElementById('winnersContainer');
  winnersContainer.innerHTML = '';
  const countdownEl = document.createElement('div');
  countdownEl.className = 'col-12 text-center countdown';
  winnersContainer.appendChild(countdownEl);

  for (let c = 3; c > 0; c--) {
    countdownEl.textContent = `倒數 ${c}...`;
    countdownEl.classList.remove('countdown');
    void countdownEl.offsetWidth;
    countdownEl.classList.add('countdown');
    await new Promise(r => setTimeout(r, 800));
  }
  countdownEl.remove();

  // 觸發 confetti 慶祝效果
  confetti({
    particleCount: 150,
    spread: 100,
    origin: { y: 0.6 }
  });

  // 依序顯示中獎者卡片
  winners.forEach((name, index) => {
    const col = document.createElement('div');
    col.className = 'col-md-4';
    const card = document.createElement('div');
    card.className = 'card winner-card';
    card.style.animationDelay = `${index * 0.2}s`;
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body text-center';
    const title = document.createElement('h5');
    title.className = 'card-title';
    title.textContent = `🎉 ${name}`;
    const subtitle = document.createElement('p');
    subtitle.className = 'card-text text-muted';
    subtitle.textContent = '恭喜中獎！';
    cardBody.appendChild(title);
    cardBody.appendChild(subtitle);
    card.appendChild(cardBody);
    col.appendChild(card);
    winnersContainer.appendChild(col);
  });

  // 更新歷史紀錄
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
    winners: winners
  };
  historyList.unshift(newRecord);
  if (historyList.length > 10) {
    historyList.splice(10);
  }
  saveHistory();
  populatePrizeOptions();
  const selectedPrize = document.getElementById('prizeFilter').value;
  filterAndRenderHistory(selectedPrize);
});

// 使用 Web Crypto API 的 SHA-256 產生穩定雜湊
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
