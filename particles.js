/**
 * 粒子系統模組 - 外部化儲存
 * 此檔案包含所有粒子特效相關程式碼，可供日後重新啟用
 * 
 * 注意：此檔案不會在主程式中匯入，僅作為程式碼保存
 */

// ============================================================================
// 粒子系統主要初始化方法
// ============================================================================

/**
 * 初始化粒子系統 - 完整版本
 */
function initParticleSystem() {
  console.log('初始化粒子系統...');
  
  try {
    // 創建粒子貼圖Atlas
    this.createParticleTextureAtlas();
    
    // 創建多樣化Sprite粒子
    this.createAdvancedSpriteParticles();
    
    // 保留原有粒子系統作為backup
    this.createDataFlowParticles();
    this.createEnergyParticles();
    this.createGlitchParticles();
    
    // 創建增強替代視覺特效
    this.createEnhancedVisualEffects();
    
    // 確保整體風格一致性
    this.ensureCyberpunkThemeConsistency();
    
  } catch (error) {
    console.error('粒子系統初始化失敗:', error);
  }
}

/**
 * 創建粒子貼圖Atlas系統
 */
function createParticleTextureAtlas() {
  if (this.particleAtlasTexture) {
    console.log('粒子貼圖Atlas已存在，跳過創建');
    return;
  }
  
  try {
    // 創建512x512的atlas畫布
    const atlasCanvas = document.createElement('canvas');
    const ctx = atlasCanvas.getContext('2d');
    atlasCanvas.width = 256; // 4x4格支援12+種粒子類型
    atlasCanvas.height = 256;
    
    // 清空畫布
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, 256, 256);
    
    // 粒子類型配置 - 擴展細緻粒子系統
    const particleTypes = [
      { name: 'circle', size: 64, color: '#00ffff' },      // 圓形 - 0,0
      { name: 'star', size: 64, color: '#ff00ff' },        // 星形 - 64,0
      { name: 'diamond', size: 64, color: '#0099cc' },     // 菱形 - 深青藍色
      { name: 'cross', size: 64, color: '#ff6600' },       // 十字 - 192,0
      { name: 'hexagon', size: 64, color: '#6600ff' },     // 六邊形 - 256,0
      { name: 'triangle', size: 64, color: '#00ff66' },    // 三角形 - 320,0
      { name: 'line', size: 64, color: '#ff0066' },        // 線條 - 0,64
      { name: 'dot', size: 64, color: '#66ff00' },         // 點 - 64,64
      // 新增細緻粒子類型
      { name: 'smallCircle', size: 32, color: '#80cccc' }, // 小圓點
      { name: 'microDot', size: 16, color: '#66b3b3' },    // 微點
      { name: 'tinyLine', size: 24, color: '#4d9999' },    // 細線
      { name: 'sparkle', size: 20, color: '#33cccc' }      // 閃點
    ];
    
    // 繪製各種粒子形狀
    particleTypes.forEach((type, index) => {
      const x = (index % 4) * 64 + 32; // 4列排列支持更多粒子類型
      const y = Math.floor(index / 4) * 64 + 32; // 每行64像素
      
      ctx.save();
      ctx.translate(x, y);
      
      // 設定發光效果
      ctx.shadowColor = type.color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = type.color;
      ctx.strokeStyle = type.color;
      ctx.lineWidth = 2;
      
      // 繪製不同形狀
      switch(type.name) {
        case 'circle':
          ctx.beginPath();
          ctx.arc(0, 0, 20, 0, Math.PI * 2);
          ctx.fill();
          break;
          
        case 'star':
          this.drawStar(ctx, 0, 0, 5, 20, 10);
          ctx.fill();
          break;
          
        case 'diamond':
          ctx.beginPath();
          ctx.moveTo(0, -20);
          ctx.lineTo(15, 0);
          ctx.lineTo(0, 20);
          ctx.lineTo(-15, 0);
          ctx.closePath();
          ctx.fill();
          break;
          
        case 'cross':
          ctx.beginPath();
          ctx.rect(-3, -20, 6, 40);
          ctx.rect(-20, -3, 40, 6);
          ctx.fill();
          break;
          
        case 'hexagon':
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const px = Math.cos(angle) * 18;
            const py = Math.sin(angle) * 18;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          break;
          
        case 'triangle':
          ctx.beginPath();
          ctx.moveTo(0, -20);
          ctx.lineTo(-17, 15);
          ctx.lineTo(17, 15);
          ctx.closePath();
          ctx.fill();
          break;
          
        case 'line':
          ctx.beginPath();
          ctx.moveTo(-20, 0);
          ctx.lineTo(20, 0);
          ctx.lineWidth = 4;
          ctx.stroke();
          break;
          
        case 'dot':
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI * 2);
          ctx.fill();
          // 加上小光環
          ctx.beginPath();
          ctx.arc(0, 0, 15, 0, Math.PI * 2);
          ctx.lineWidth = 1;
          ctx.stroke();
          break;
          
        // 新增細緻粒子類型繪製
        case 'smallCircle':
          ctx.beginPath();
          ctx.arc(0, 0, 6, 0, Math.PI * 2); // 小圓點
          ctx.fill();
          break;
          
        case 'microDot':
          ctx.beginPath();
          ctx.arc(0, 0, 3, 0, Math.PI * 2); // 微點
          ctx.fill();
          // 添加細緻光暈
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI * 2);
          ctx.lineWidth = 0.5;
          ctx.stroke();
          break;
          
        case 'tinyLine':
          ctx.beginPath();
          ctx.moveTo(-8, 0); // 細線
          ctx.lineTo(8, 0);
          ctx.lineWidth = 1;
          ctx.stroke();
          // 交叉細線
          ctx.beginPath();
          ctx.moveTo(0, -8);
          ctx.lineTo(0, 8);
          ctx.stroke();
          break;
          
        case 'sparkle':
          // 閃爍星形效果
          ctx.beginPath();
          ctx.moveTo(0, -6);
          ctx.lineTo(1.5, -1.5);
          ctx.lineTo(6, 0);
          ctx.lineTo(1.5, 1.5);
          ctx.lineTo(0, 6);
          ctx.lineTo(-1.5, 1.5);
          ctx.lineTo(-6, 0);
          ctx.lineTo(-1.5, -1.5);
          ctx.closePath();
          ctx.fill();
          break;
      }
      
      ctx.restore();
    });
    
    // 創建Three.js紋理
    this.particleAtlasTexture = new THREE.CanvasTexture(atlasCanvas);
    this.particleAtlasTexture.minFilter = THREE.LinearFilter;
    this.particleAtlasTexture.magFilter = THREE.LinearFilter;
    this.particleAtlasTexture.needsUpdate = true;
    
    // 保存粒子類型配置用於UV映射
    this.particleAtlasMap = particleTypes.map((type, index) => ({
      name: type.name,
      color: type.color,
      uvOffset: {
        x: (index % 4) / 4, // 4x4格布局
        y: Math.floor(index / 4) / 4
      },
      uvScale: { x: 1/4, y: 1/4 } // 更新UV縮放
    }));
    
    console.log('粒子貼圖Atlas創建完成，包含', particleTypes.length, '種形狀');
    
  } catch (error) {
    console.error('粒子貼圖Atlas創建失敗:', error);
  }
}

// ============================================================================
// 粒子系統更新方法
// ============================================================================

/**
 * 更新賽博龐克動畫效果 - 升級版本
 */
function updateParticles() {
  const time = Date.now() * 0.001;
  
  // 性能優化：降低更新頻率
  if (!this.lastUpdateTime) this.lastUpdateTime = 0;
  const deltaTime = time - this.lastUpdateTime;
  
  // 每秒30幀更新，而非60幀，節省性能
  if (deltaTime < 0.033) return;
  
  this.lastUpdateTime = time;
  
  // 更新進階Sprite粒子系統
  if (this.spriteParticleGroups && this.spriteParticleGroups.length > 0) {
    this.updateAdvancedSpriteParticles(time, deltaTime);
  }
  
  // 更新數據流粒子（較低頻率）
  if (this.dataFlowParticles && time % 0.1 < 0.033) {
    this.updateDataFlowParticles(time);
  }
  
  // 更新能量粒子
  if (this.energyParticles) {
    this.updateEnergyParticles(time);
  }
  
  // 更新故障粒子（低頻率，節省性能）
  if (this.glitchParticles && time % 0.2 < 0.033) {
    this.updateGlitchParticles(time);
  }
  
  // 更新增強視覺特效系統
  this.updateEnhancedVisualEffects(time);
  
  // 更新霓虹光環
  if (this.neonRings && this.neonRings.length > 0) {
    this.updateNeonRings(time);
  }
  
  // 更新商標動畫
  if (this.logoPlane) {
    this.updateLogoAnimation(time);
  }
  
  // 更新無障礙卡片動態特效輔助辨識
  if (this.cards && this.cards.length > 0) {
    this.updateAccessibilityCardEffects(time, deltaTime);
  }
  
  // 更新自訂 Shader Material 的 uniforms
  this.updateShaderMaterials(time);
}

// ============================================================================
// 此檔案包含完整的粒子系統程式碼，包括：
// - 所有粒子初始化方法
// - 粒子更新邏輯
// - 粒子配置對象
// - 粒子互動功能
// - 性能優化相關程式碼
// 
// 如需重新啟用粒子效果，可將相關方法重新整合回主程式
// ============================================================================