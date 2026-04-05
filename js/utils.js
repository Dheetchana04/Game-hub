/**
 * Game Hub - Shared Utilities
 * Handles: theme toggle, score storage, sounds, confetti, achievements
 */

/* ── Theme ── */
function initTheme() {
  const saved = localStorage.getItem('gh_theme') || 'dark';
  if (saved === 'light') document.body.classList.add('light-mode');
  updateThemeBtn();
}

function toggleTheme() {
  document.body.classList.toggle('light-mode');
  const theme = document.body.classList.contains('light-mode') ? 'light' : 'dark';
  localStorage.setItem('gh_theme', theme);
  updateThemeBtn();
}

function updateThemeBtn() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  const isLight = document.body.classList.contains('light-mode');
  btn.innerHTML = isLight ? '🌙 <span>DARK</span>' : '☀️ <span>LIGHT</span>';
}

/* ── Score Storage ── */
const SCORE_KEYS = {
  tictactoe: 'gh_score_ttt',
  rps: 'gh_score_rps',
  memory: 'gh_score_mem',
  numguess: 'gh_score_num',
  mole: 'gh_score_mole',
  quiz: 'gh_score_quiz'
};

function getScore(game) {
  const raw = localStorage.getItem(SCORE_KEYS[game]);
  if (!raw) return { wins: 0, losses: 0, draws: 0, best: 0, total: 0 };
  return JSON.parse(raw);
}

function saveScore(game, update) {
  const current = getScore(game);
  const merged = { ...current, ...update };
  localStorage.setItem(SCORE_KEYS[game], JSON.stringify(merged));
  updateScoreBar();
  checkAchievements(game, merged);
}

function incrementScore(game, type) {
  const s = getScore(game);
  s[type] = (s[type] || 0) + 1;
  s.total = (s.total || 0) + 1;
  localStorage.setItem(SCORE_KEYS[game], JSON.stringify(s));
  updateScoreBar();
  checkAchievements(game, s);
  return s;
}

function updateScoreBar() {
  // Update total wins display in nav bar if present
  const el = document.getElementById('total-wins');
  if (!el) return;
  let totalWins = 0;
  Object.keys(SCORE_KEYS).forEach(g => {
    totalWins += (getScore(g).wins || 0);
  });
  el.textContent = totalWins;
}

/* ── Sound Effects ── */
let soundEnabled = localStorage.getItem('gh_sound') !== 'false';

function toggleSound() {
  soundEnabled = !soundEnabled;
  localStorage.setItem('gh_sound', soundEnabled);
  const btn = document.getElementById('sound-toggle');
  if (btn) btn.textContent = soundEnabled ? '🔊' : '🔇';
}

function playSound(type) {
  if (!soundEnabled) return;
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  const sounds = {
    click: { freq: 440, type: 'sine', dur: 0.1, vol: 0.1 },
    win: { freq: 880, type: 'triangle', dur: 0.5, vol: 0.15 },
    lose: { freq: 200, type: 'sawtooth', dur: 0.4, vol: 0.1 },
    draw: { freq: 330, type: 'square', dur: 0.3, vol: 0.08 },
    pop: { freq: 600, type: 'sine', dur: 0.08, vol: 0.12 },
    whack: { freq: 300, type: 'square', dur: 0.1, vol: 0.15 },
    flip: { freq: 520, type: 'triangle', dur: 0.15, vol: 0.08 },
    match: { freq: 740, type: 'sine', dur: 0.35, vol: 0.12 },
    correct: { freq: 660, type: 'sine', dur: 0.3, vol: 0.12 },
    wrong: { freq: 180, type: 'sawtooth', dur: 0.3, vol: 0.1 },
    tick: { freq: 800, type: 'sine', dur: 0.05, vol: 0.08 }
  };

  const s = sounds[type] || sounds.click;
  osc.type = s.type;
  osc.frequency.setValueAtTime(s.freq, ctx.currentTime);
  if (type === 'win') {
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.2);
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.4);
  }
  gain.gain.setValueAtTime(s.vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + s.dur);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + s.dur);
}

/* ── Confetti ── */
function launchConfetti(count = 60) {
  const colors = ['#6366f1','#22d3ee','#f472b6','#4ade80','#fb923c','#facc15'];
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const p = document.createElement('div');
      p.className = 'confetti-particle';
      p.style.left = Math.random() * 100 + 'vw';
      p.style.top = '-20px';
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      p.style.animationDuration = (1.5 + Math.random()) + 's';
      p.style.animationDelay = Math.random() * 0.5 + 's';
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 3000);
    }, i * 20);
  }
}

/* ── Achievements ── */
const ACHIEVEMENTS = {
  tictactoe: [
    { key: 'ttt_win1', label: '🎮 First Victory', desc: 'Win your first Tic Tac Toe game', check: s => s.wins >= 1 },
    { key: 'ttt_win5', label: '🏆 TTT Champion', desc: 'Win 5 Tic Tac Toe games', check: s => s.wins >= 5 },
  ],
  rps: [
    { key: 'rps_win1', label: '✊ Sharp Shooter', desc: 'Win your first RPS round', check: s => s.wins >= 1 },
    { key: 'rps_win10', label: '👑 RPS King', desc: 'Win 10 RPS rounds', check: s => s.wins >= 10 },
  ],
  memory: [
    { key: 'mem_win1', label: '🧠 Memory Awakened', desc: 'Complete the memory game', check: s => s.wins >= 1 },
    { key: 'mem_fast', label: '⚡ Speed Mind', desc: 'Complete memory in under 30s', check: s => s.best > 0 && s.best <= 30 },
  ],
  numguess: [
    { key: 'num_win1', label: '🔢 First Guess', desc: 'Guess your first number', check: s => s.wins >= 1 },
    { key: 'num_easy', label: '🎯 Sharp Mind', desc: 'Guess correctly in 3 or fewer tries', check: s => s.best <= 3 && s.best > 0 },
  ],
  mole: [
    { key: 'mole_50', label: '🔨 Mole Buster', desc: 'Score 50+ in Whack-a-Mole', check: s => s.best >= 50 },
    { key: 'mole_100', label: '💥 Mole Destroyer', desc: 'Score 100+ in Whack-a-Mole', check: s => s.best >= 100 },
  ],
  quiz: [
    { key: 'quiz_first', label: '📚 Scholar', desc: 'Complete your first quiz', check: s => s.total >= 1 },
    { key: 'quiz_perfect', label: '🌟 Perfectionist', desc: 'Get a perfect quiz score', check: s => s.best >= 10 },
  ]
};

function checkAchievements(game, scores) {
  const list = ACHIEVEMENTS[game] || [];
  const unlocked = JSON.parse(localStorage.getItem('gh_achievements') || '[]');
  list.forEach(ach => {
    if (!unlocked.includes(ach.key) && ach.check(scores)) {
      unlocked.push(ach.key);
      localStorage.setItem('gh_achievements', JSON.stringify(unlocked));
      showAchievement(ach);
    }
  });
}

function showAchievement(ach) {
  const toast = document.createElement('div');
  toast.className = 'achievement-toast';
  toast.innerHTML = `<div class="ach-title">🏅 ACHIEVEMENT UNLOCKED</div><div class="ach-text"><strong>${ach.label}</strong><br><small>${ach.desc}</small></div>`;
  document.body.appendChild(toast);
  playSound('win');
  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

/* ── Loading Screen ── */
function initLoadingScreen() {
  const ls = document.getElementById('loading-screen');
  if (!ls) return;
  setTimeout(() => ls.classList.add('hidden'), 1100);
}

/* ── Page Init ── */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initLoadingScreen();
  updateScoreBar();

  // Theme toggle button
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  // Sound toggle
  const soundBtn = document.getElementById('sound-toggle');
  if (soundBtn) {
    soundBtn.textContent = soundEnabled ? '🔊' : '🔇';
    soundBtn.addEventListener('click', toggleSound);
  }
});
