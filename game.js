// ============================================
// LEVELS DATA - 15 classic Sokoban levels
// Legend: # wall, . target, $ box, @ player, + player on target, * box on target
// ============================================
const LEVELS = [
  { name:"初学者", map:[
    "  ####  ",
    "  #  #  ",
    "  #$ #  ",
    "###  ###",
    "#  $.  #",
    "#  #####",
    "# @#    ",
    "#  #    ",
    "####    "
  ]},
  { name:"两步棋", map:[
    "######  ",
    "#    #  ",
    "# ##.###",
    "# # .  #",
    "#  $   #",
    "### $###",
    "  # @#  ",
    "  ####  "
  ]},
  { name:"三箱记", map:[
    "  ####  ",
    "###  #  ",
    "#    #  ",
    "# # .###",
    "# $$.. #",
    "## $#  #",
    " # @ ###",
    " #  ##  ",
    " ####   "
  ]},
  { name:"回字形", map:[
    " #####  ",
    " #   ## ",
    "## #$ ##",
    "#  $.  #",
    "# .$.# #",
    "#  #@  #",
    "##   ###",
    " #####  "
  ]},
  { name:"窄道", map:[
    "########",
    "#      #",
    "# #### #",
    "# #..# #",
    "# #..# #",
    "#  $$  #",
    "## $$ ##",
    " # @  # ",
    " ###### "
  ]},
  { name:"对称", map:[
    "  ######",
    "  #   .#",
    "###$$#.#",
    "#  $ #.#",
    "#   $..#",
    "#  # ###",
    "## #   #",
    " #@    #",
    " #######"
  ]},
  { name:"十字路", map:[
    "  ####  ",
    "  #  #  ",
    "  #  #  ",
    "###  ###",
    "#  ..  #",
    "# #..# #",
    "#  $$  #",
    "###$$###",
    "  # @#  ",
    "  ####  "
  ]},
  { name:"迷宫", map:[
    " ########",
    " #  #   #",
    "## $  # #",
    "#  #$#  #",
    "#  . .$ #",
    "# ##.#@##",
    "#    .#  ",
    "########ˇ"
  ]},
  { name:"螺旋", map:[
    " ####    ",
    " #  #### ",
    " # $ $ # ",
    "## #.# ##",
    "#  #.#  #",
    "#  ...  #",
    "# $$$ # #",
    "## @ ## #",
    " ##    ##",
    "  ###### "
  ]},
  { name:"双通道", map:[
    "#####    ",
    "#   ##   ",
    "# $  #   ",
    "# $# ####",
    "#  # #..#",
    "## #$#..#",
    " # $  ..#",
    " # @ ####",
    " #####   "
  ]},
  { name:"方块阵", map:[
    "  #######",
    "  #  #  #",
    "  #  $  #",
    "### #$###",
    "#  ..  # ",
    "# $..# # ",
    "## $#  # ",
    " #@ #### ",
    " ####    "
  ]},
  { name:"蜿蜒路", map:[
    "  ###### ",
    "  #    # ",
    " ## ## ##",
    " # $$$  #",
    "## # #  #",
    "# ...  ##",
    "# .## ## ",
    "#  @#  # ",
    "##   $ # ",
    " ####### "
  ]},
  { name:"五星", map:[
    "  ####   ",
    "  #  ### ",
    "###$.  # ",
    "# $  # ##",
    "# .#.$. #",
    "## # $  #",
    " # @.###",
    " ###    ",
  ]},
  { name:"阶梯", map:[
    " ######  ",
    " #    #  ",
    "##.## ## ",
    "# .$$  # ",
    "## .$ # #",
    "#  . $  #",
    "#  ###$##",
    "##  @ #  ",
    " ######  "
  ]},
  { name:"终极挑战", map:[
    " ########",
    " #   #  #",
    "## $ $  #",
    "# $##  ##",
    "#  .$.## ",
    "## #...# ",
    "#  ##$# # ",
    "#  $ $  # ",
    "#  @#  ## ",
    "########  "
  ]}
];

// ============================================
// AUDIO ENGINE (Web Audio API)
// ============================================
class AudioEngine {
  constructor() { this.ctx = null; }

  init() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  tone(freq, dur, type='square', vol=0.15) {
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = type; osc.frequency.value = freq;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(g).connect(this.ctx.destination);
      osc.start(t); osc.stop(t + dur);
    } catch(e) {}
  }

  move()  { this.tone(200, 0.08, 'square', 0.06); }
  push()  { this.tone(150, 0.12, 'square', 0.08); }
  land()  { this.tone(523, 0.1, 'sine', 0.15); setTimeout(()=>this.tone(659,0.1,'sine',0.15),80); setTimeout(()=>this.tone(784,0.15,'sine',0.15),160); }

  win() {
    [523,587,659,784,880,1047].forEach((n,i) => setTimeout(()=>this.tone(n,0.2,'sine',0.12), i*120));
  }
}

// ============================================
// GAME
// ============================================
class SokobanGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.c = this.canvas.getContext('2d');
    this.audio = new AudioEngine();

    this.level = 0;
    this.steps = 0;
    this.history = [];
    this.paused = false;
    this.won = false;
    this.grid = [];     // 2d: 'wall' | 'floor' | 'box'
    this.targets = [];  // [{x,y}]
    this.px = 0; this.py = 0;
    this.tile = 40;
    this.cols = 0; this.rows = 0;

    this.loadProgress();
    this.bindEvents();
    this.loadLevel(this.level);
  }

  // --- Save/Load ---
  loadProgress() {
    try {
      const d = JSON.parse(localStorage.getItem('sokoban_save') || '{}');
      this.cleared = new Set(d.cleared || []);
      this.level = d.last || 0;
    } catch(e) { this.cleared = new Set(); this.level = 0; }
  }
  saveProgress() {
    localStorage.setItem('sokoban_save', JSON.stringify({ cleared:[...this.cleared], last:this.level }));
  }
  isUnlocked(i) { return i === 0 || this.cleared.has(i-1); }

  // --- Level ---
  loadLevel(i) {
    if (i < 0 || i >= LEVELS.length) return;
    this.level = i;
    this.steps = 0;
    this.history = [];
    this.won = false;
    this.paused = false;

    const lv = LEVELS[i];
    this.rows = lv.map.length;
    this.cols = Math.max(...lv.map.map(r => r.length));
    this.grid = [];
    this.targets = [];

    for (let y = 0; y < this.rows; y++) {
      this.grid[y] = [];
      for (let x = 0; x < this.cols; x++) {
        const ch = (lv.map[y] || '')[x] || ' ';
        if (ch === '#') { this.grid[y][x] = 'wall'; }
        else if (ch === '.') { this.grid[y][x] = 'floor'; this.targets.push({x,y}); }
        else if (ch === '$') { this.grid[y][x] = 'box'; }
        else if (ch === '@') { this.grid[y][x] = 'floor'; this.px = x; this.py = y; }
        else if (ch === '+') { this.grid[y][x] = 'floor'; this.px = x; this.py = y; this.targets.push({x,y}); }
        else if (ch === '*') { this.grid[y][x] = 'box'; this.targets.push({x,y}); }
        else { this.grid[y][x] = 'floor'; }
      }
    }

    document.getElementById('lvl-num').textContent = i + 1;
    document.getElementById('step-count').textContent = '0';
    document.getElementById('win-overlay').classList.add('hidden');
    document.getElementById('pause-overlay').classList.add('hidden');
    this.saveProgress();
    this.resize();
  }

  // --- Resize ---
  resize() {
    const area = document.getElementById('game-area');
    const maxW = area.clientWidth - 16;
    const maxH = area.clientHeight - 16;
    if (!this.cols || !this.rows) return;
    this.tile = Math.floor(Math.min(maxW / this.cols, maxH / this.rows));
    this.tile = Math.max(16, Math.min(this.tile, 64));
    this.canvas.width = this.cols * this.tile;
    this.canvas.height = this.rows * this.tile;
    this.render();
  }

  // --- Input ---
  bindEvents() {
    // Keyboard
    document.addEventListener('keydown', e => {
      this.audio.init();
      const map = { ArrowUp:[0,-1], ArrowDown:[0,1], ArrowLeft:[-1,0], ArrowRight:[1,0],
                     w:[0,-1], W:[0,-1], s:[0,1], S:[0,1], a:[-1,0], A:[-1,0], d:[1,0], D:[1,0] };
      if (map[e.key]) { this.move(...map[e.key]); e.preventDefault(); return; }
      if (e.key === 'z' || e.key === 'Z') { this.undo(); e.preventDefault(); }
      if (e.key === 'r' || e.key === 'R') { this.resetLevel(); e.preventDefault(); }
      if (e.key === 'Escape') { this.togglePause(); e.preventDefault(); }
    });

    // Touch swipe on canvas
    let sx, sy;
    this.canvas.addEventListener('touchstart', e => { this.audio.init(); sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, {passive:true});
    this.canvas.addEventListener('touchend', e => {
      if (sx == null) return;
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
      if (Math.abs(dx) > Math.abs(dy)) this.move(dx > 0 ? 1 : -1, 0);
      else this.move(0, dy > 0 ? 1 : -1);
      sx = sy = null;
    }, {passive:true});

    // D-pad buttons
    const dpad = {
      'd-up':[0,-1], 'd-down':[0,1], 'd-left':[-1,0], 'd-right':[1,0]
    };
    for (const [id, dir] of Object.entries(dpad)) {
      const el = document.getElementById(id);
      const handler = e => { e.preventDefault(); this.audio.init(); this.move(...dir); };
      el.addEventListener('touchstart', handler, {passive:false});
      el.addEventListener('mousedown', handler);
    }

    // Buttons
    document.getElementById('btn-undo').onclick = () => this.undo();
    document.getElementById('btn-reset').onclick = () => this.resetLevel();
    document.getElementById('btn-levels').onclick = () => this.showLevelSelect();
    document.getElementById('btn-pause').onclick = () => this.togglePause();
    document.getElementById('btn-lvl-back').onclick = () => this.hideLevelSelect();
    document.getElementById('btn-replay').onclick = () => this.resetLevel();
    document.getElementById('btn-next').onclick = () => this.nextLevel();
    document.getElementById('pause-overlay').onclick = () => this.togglePause();

    window.addEventListener('resize', () => this.resize());
  }

  // --- Game Logic ---
  cell(x, y) {
    if (y < 0 || y >= this.rows || x < 0 || x >= this.cols) return 'wall';
    return this.grid[y][x];
  }
  isTarget(x, y) { return this.targets.some(t => t.x === x && t.y === y); }

  move(dx, dy) {
    if (this.paused || this.won) return;
    this.audio.init();
    const nx = this.px + dx, ny = this.py + dy;
    const nc = this.cell(nx, ny);
    if (nc === 'wall') return;

    if (nc === 'box') {
      const bx = nx + dx, by = ny + dy;
      if (this.cell(bx, by) === 'wall' || this.cell(bx, by) === 'box') return;
      this.history.push({ px:this.px, py:this.py, bf:{x:nx,y:ny}, bt:{x:bx,y:by} });
      this.grid[by][bx] = 'box';
      this.grid[ny][nx] = 'floor';
      const nowOn = this.isTarget(bx, by);
      if (nowOn) this.audio.land(); else this.audio.push();
    } else {
      this.history.push({ px:this.px, py:this.py, bf:null, bt:null });
      this.audio.move();
    }

    this.px = nx; this.py = ny;
    this.steps++;
    document.getElementById('step-count').textContent = this.steps;
    this.render();
    this.checkWin();
  }

  undo() {
    if (this.paused || this.won || !this.history.length) return;
    const s = this.history.pop();
    if (s.bf && s.bt) {
      this.grid[s.bt.y][s.bt.x] = 'floor';
      this.grid[s.bf.y][s.bf.x] = 'box';
    }
    this.px = s.px; this.py = s.py;
    this.steps--;
    document.getElementById('step-count').textContent = this.steps;
    this.render();
  }

  resetLevel() {
    document.getElementById('win-overlay').classList.add('hidden');
    this.loadLevel(this.level);
  }

  checkWin() {
    if (this.targets.every(t => this.grid[t.y][t.x] === 'box')) {
      this.won = true;
      this.cleared.add(this.level);
      this.saveProgress();
      this.audio.win();
      setTimeout(() => {
        const boxCount = this.targets.length;
        const stars = this.steps <= boxCount * 8 ? '⭐⭐⭐' : this.steps <= boxCount * 15 ? '⭐⭐' : '⭐';
        document.getElementById('win-stars').textContent = stars;
        document.getElementById('win-msg').textContent = `用了 ${this.steps} 步完成！`;
        document.getElementById('win-overlay').classList.remove('hidden');
      }, 400);
    }
  }

  nextLevel() {
    if (this.level + 1 < LEVELS.length) {
      document.getElementById('win-overlay').classList.add('hidden');
      this.loadLevel(this.level + 1);
    }
  }

  togglePause() {
    if (this.won) return;
    this.paused = !this.paused;
    document.getElementById('pause-overlay').classList.toggle('hidden', !this.paused);
  }

  // --- Level Select ---
  showLevelSelect() {
    const g = document.getElementById('level-grid');
    g.innerHTML = '';
    for (let i = 0; i < LEVELS.length; i++) {
      const b = document.createElement('button');
      b.className = 'level-btn';
      b.textContent = i + 1;
      const unlocked = this.isUnlocked(i);
      const cleared = this.cleared.has(i);
      if (cleared) b.classList.add('cleared','unlocked');
      else if (unlocked) b.classList.add('unlocked');
      else b.classList.add('locked');
      if (i === this.level) b.classList.add('current');
      if (unlocked) { const idx = i; b.onclick = () => { this.hideLevelSelect(); this.loadLevel(idx); }; }
      b.title = LEVELS[i].name;
      g.appendChild(b);
    }
    document.getElementById('level-overlay').classList.remove('hidden');
  }
  hideLevelSelect() { document.getElementById('level-overlay').classList.add('hidden'); }

  // --- Rendering ---
  render() {
    const c = this.c, t = this.tile;
    c.clearRect(0, 0, this.canvas.width, this.canvas.height);
    c.fillStyle = '#1a1a2e';
    c.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const pad = Math.max(1, t * 0.06);

    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const px = x * t, py = y * t;
        const cell = this.grid[y][x];
        const onT = this.isTarget(x, y);

        if (cell === 'wall') {
          this.drawWall(px, py, t);
        } else {
          // Floor
          c.fillStyle = '#0f1b33';
          c.fillRect(px, py, t, t);
          c.strokeStyle = '#162040';
          c.lineWidth = 0.5;
          c.strokeRect(px, py, t, t);
        }

        // Target marker
        if (onT && cell !== 'box') {
          c.save();
          c.fillStyle = 'rgba(233,69,96,0.5)';
          c.beginPath();
          c.arc(px + t/2, py + t/2, t * 0.18, 0, Math.PI * 2);
          c.fill();
          c.strokeStyle = '#e94560';
          c.lineWidth = 1.5;
          c.stroke();
          c.restore();
        }

        // Box
        if (cell === 'box') {
          const onTarget = onT;
          const m = pad + 1;
          // Shadow
          c.fillStyle = 'rgba(0,0,0,0.3)';
          c.fillRect(px + m + 2, py + m + 2, t - m*2, t - m*2);
          // Box body
          c.fillStyle = onTarget ? '#4ade80' : '#f59e0b';
          c.fillRect(px + m, py + m, t - m*2, t - m*2);
          // Highlight
          c.fillStyle = onTarget ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.2)';
          c.fillRect(px + m, py + m, t - m*2, (t - m*2) * 0.3);
          // Cross on box
          c.strokeStyle = onTarget ? '#166534' : '#92400e';
          c.lineWidth = Math.max(1, t * 0.05);
          c.beginPath();
          c.moveTo(px + m + 3, py + m + 3);
          c.lineTo(px + t - m - 3, py + t - m - 3);
          c.moveTo(px + t - m - 3, py + m + 3);
          c.lineTo(px + m + 3, py + t - m - 3);
          c.stroke();
        }
      }
    }

    // Player
    this.drawPlayer(this.px * t, this.py * t, t);
  }

  drawWall(px, py, t) {
    const c = this.c;
    c.fillStyle = '#2c3e6b';
    c.fillRect(px, py, t, t);
    c.fillStyle = '#1e2d52';
    c.fillRect(px+2, py+2, t-4, t-4);
    c.strokeStyle = '#344e80';
    c.lineWidth = 0.5;
    // Brick pattern
    if (t >= 20) {
      c.beginPath();
      c.moveTo(px + t/2, py+1); c.lineTo(px + t/2, py + t/2);
      c.moveTo(px+1, py + t/2); c.lineTo(px + t-1, py + t/2);
      c.moveTo(px + t*0.25, py+t/2); c.lineTo(px + t*0.25, py+t-1);
      c.moveTo(px + t*0.75, py+t/2); c.lineTo(px + t*0.75, py+t-1);
      c.stroke();
    }
  }

  drawPlayer(px, py, t) {
    const c = this.c;
    const cx = px + t/2, cy = py + t/2, r = t * 0.35;
    // Body circle
    c.fillStyle = '#3b82f6';
    c.beginPath();
    c.arc(cx, cy, r, 0, Math.PI * 2);
    c.fill();
    // Highlight
    c.fillStyle = 'rgba(255,255,255,0.25)';
    c.beginPath();
    c.arc(cx - r*0.2, cy - r*0.2, r*0.65, 0, Math.PI * 2);
    c.fill();
    // Eyes
    const eyeR = Math.max(1.5, t * 0.06);
    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(cx - r*0.3, cy - r*0.15, eyeR, 0, Math.PI*2);
    c.arc(cx + r*0.3, cy - r*0.15, eyeR, 0, Math.PI*2);
    c.fill();
    // Pupils
    c.fillStyle = '#1e293b';
    c.beginPath();
    c.arc(cx - r*0.25, cy - r*0.1, eyeR*0.6, 0, Math.PI*2);
    c.arc(cx + r*0.35, cy - r*0.1, eyeR*0.6, 0, Math.PI*2);
    c.fill();
    // Mouth
    c.strokeStyle = '#fff';
    c.lineWidth = Math.max(1, t*0.03);
    c.beginPath();
    c.arc(cx, cy + r*0.15, r*0.25, 0.1 * Math.PI, 0.9 * Math.PI);
    c.stroke();
    // Player on target indicator
    if (this.isTarget(this.px, this.py)) {
      c.strokeStyle = '#e94560';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(cx, cy, r + 3, 0, Math.PI * 2);
      c.stroke();
    }
  }
}

// Start game
const game = new SokobanGame();
