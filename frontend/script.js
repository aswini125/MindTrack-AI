/* ============================================================
   MindTrack AI – Frontend JavaScript
   Handles: Navigation, Form, Charts, Pomodoro, Gamification,
            AI Predictions, Smart Suggestions
   Backend: Flask at http://127.0.0.1:5000
   ============================================================ */

// ============================================================
// GLOBAL STATE
// ============================================================
const API_BASE = 'http://127.0.0.1:5000'; // Change if hosted elsewhere

let selectedMood   = '';      // Currently selected mood
let allLogs        = [];      // All logs fetched from backend
let screenChart    = null;    // Chart.js instance (screen time)
let moodChart      = null;    // Chart.js instance (mood)
let timerInterval  = null;    // Pomodoro interval
let timerRunning   = false;   // Is timer running?
let timerMode      = 'focus'; // 'focus' or 'break'
let timeLeft       = 25 * 60; // Seconds remaining
let totalTime      = 25 * 60; // Total seconds for current mode
let sessionsDone   = 0;       // Completed pomodoro sessions today
let totalPoints    = 0;       // Gamification points
let streakDays     = 0;       // Consecutive days logged

// ============================================================
// NAVIGATION — Show/Hide Sections
// ============================================================
function showSection(name) {
  // Hide all sections
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active-section'));
  // Show target section
  const target = document.getElementById(name);
  if (target) target.classList.add('active-section');

  // Update active nav link
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const activeLink = document.querySelector(`.nav-link[onclick*="${name}"]`);
  if (activeLink) activeLink.classList.add('active');

  // Load fresh data when switching to certain sections
  if (name === 'dashboard') loadDashboard();
  if (name === 'insights')  loadInsights();
}

// ============================================================
// MOOD SELECTION
// ============================================================
function selectMood(el) {
  // Remove 'selected' from all mood options
  document.querySelectorAll('.mood-option').forEach(m => m.classList.remove('selected'));
  // Select clicked option
  el.classList.add('selected');
  selectedMood = el.dataset.mood;

  // Update display text
  const moodEmoji = { Happy: '😊', Neutral: '😐', Stressed: '😰', Tired: '😴' };
  document.getElementById('mood-display').innerHTML =
    `<strong>${moodEmoji[selectedMood]} ${selectedMood}</strong> selected`;

  // Show real-time suggestion preview
  showSuggestionPreview();
}

// ============================================================
// SUGGESTION PREVIEW (while filling form)
// ============================================================
function showSuggestionPreview() {
  const ig   = parseInt(document.getElementById('instagram').value) || 0;
  const yt   = parseInt(document.getElementById('youtube').value)   || 0;
  const wa   = parseInt(document.getElementById('whatsapp').value)  || 0;
  const ot   = parseInt(document.getElementById('other').value)     || 0;
  const total = ig + yt + wa + ot;

  const suggestion = generateSuggestion(total, selectedMood);
  const preview    = document.getElementById('suggestion-preview');
  const text       = document.getElementById('suggestion-text');

  if (suggestion) {
    text.textContent = suggestion;
    preview.style.display = 'flex';
  }
}

// ============================================================
// GENERATE SMART SUGGESTION
// ============================================================
function generateSuggestion(totalMins, mood) {
  const hours = totalMins / 60;

  // High usage rules
  if (hours > 5)  return "📵 You've spent a lot of time on screens today. Consider a digital detox evening!";
  if (hours > 3 && mood === 'Stressed')  return "🧘 High screen time + stress detected. Try deep breathing or a short walk.";
  if (hours > 3 && mood === 'Tired')     return "😴 You seem tired and your screen time is high. Sleep early tonight!";
  if (hours > 3 && mood === 'Happy')     return "📚 Great energy! Channel it into studying or a creative project.";
  if (hours > 2 && mood === 'Neutral')   return "☕ Moderate usage. Take a 10-minute screen break and hydrate.";

  // Low usage rules
  if (hours < 1 && mood === 'Happy')     return "🌟 Amazing! Low screen time and happy mood — keep it up!";
  if (hours < 1 && mood === 'Stressed')  return "💬 Feeling stressed despite low screen time? Talk to someone you trust.";
  if (hours < 2)                         return "✅ Great screen discipline today! Reward yourself with a break.";

  return "💡 Stay mindful of your screen habits. Small steps lead to big changes!";
}

// ============================================================
// SUBMIT DAILY LOG
// ============================================================
async function submitData() {
  // Read values
  const instagram = parseInt(document.getElementById('instagram').value) || 0;
  const youtube   = parseInt(document.getElementById('youtube').value)   || 0;
  const whatsapp  = parseInt(document.getElementById('whatsapp').value)  || 0;
  const other     = parseInt(document.getElementById('other').value)     || 0;

  // Validation
  if (!selectedMood) {
    showToast('⚠️ Please select your mood first!');
    return;
  }
  if (instagram + youtube + whatsapp + other === 0) {
    showToast('⚠️ Enter at least some screen time data!');
    return;
  }

  const payload = { instagram, youtube, whatsapp, other, mood: selectedMood };

  try {
    const response = await fetch(`${API_BASE}/add_data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (response.ok) {
      const msgEl = document.getElementById('submit-message');
      msgEl.className = 'submit-message success';
      msgEl.textContent = `✅ ${result.message} | +${result.points_earned} points!`;
      msgEl.style.display = 'block';

      showToast(`🎉 Logged! +${result.points_earned} pts`);
      resetForm();
      loadDashboard();
      loadInsights();
    } else {
      showSubmitError(result.error || 'Something went wrong.');
    }
  } catch (err) {
    // Backend not running — show friendly error
    showSubmitError('Cannot connect to backend. Make sure Flask is running on port 5000.');
    console.error('Backend error:', err);
  }
}

function resetForm() {
  document.getElementById('instagram').value = '';
  document.getElementById('youtube').value   = '';
  document.getElementById('whatsapp').value  = '';
  document.getElementById('other').value     = '';
  document.querySelectorAll('.mood-option').forEach(m => m.classList.remove('selected'));
  document.getElementById('mood-display').innerHTML = '<span>No mood selected</span>';
  document.getElementById('suggestion-preview').style.display = 'none';
  selectedMood = '';
}

function showSubmitError(msg) {
  const msgEl = document.getElementById('submit-message');
  msgEl.className = 'submit-message error';
  msgEl.textContent = '❌ ' + msg;
  msgEl.style.display = 'block';
}

// ============================================================
// FETCH ALL LOGS FROM BACKEND
// ============================================================
async function fetchLogs() {
  try {
    const res  = await fetch(`${API_BASE}/get_data`);
    const data = await res.json();
    allLogs = data.logs || [];
    return allLogs;
  } catch (err) {
    console.warn('Could not fetch logs from backend:', err);
    allLogs = [];
    return [];
  }
}

// ============================================================
// DASHBOARD — Load All Data
// ============================================================
async function loadDashboard() {
  const logs = await fetchLogs();

  updateStats(logs);
  renderLogTable(logs);
  renderCharts(logs);
  renderPrediction(logs);
}

// ---------- Stats Row ----------
function updateStats(logs) {
  // Total screen time (latest entry)
  let totalTime = 0;
  let latestMood = '—';
  if (logs.length > 0) {
    const latest = logs[logs.length - 1];
    totalTime  = latest.total_minutes || 0;
    latestMood = latest.mood || '—';
  }

  // Points (sum all)
  totalPoints = logs.reduce((sum, l) => sum + (l.points || 0), 0);

  // Streak (consecutive unique days)
  streakDays = calculateStreak(logs);

  // Update DOM
  const hrs = (totalTime / 60).toFixed(1);
  document.getElementById('stat-total-time').textContent = hrs + ' hrs';
  document.getElementById('stat-streak').textContent     = streakDays;
  document.getElementById('stat-points').textContent     = totalPoints;
  document.getElementById('stat-mood').textContent       = latestMood;
  document.getElementById('nav-score').textContent       = totalPoints + ' pts';
}

// ---------- Streak Calculator ----------
function calculateStreak(logs) {
  if (!logs.length) return 0;
  // Extract unique dates (YYYY-MM-DD)
  const dates = [...new Set(logs.map(l => l.date.split('T')[0]))].sort().reverse();
  if (!dates.length) return 0;

  let streak = 1;
  for (let i = 0; i < dates.length - 1; i++) {
    const d1 = new Date(dates[i]);
    const d2 = new Date(dates[i + 1]);
    const diff = (d1 - d2) / (1000 * 60 * 60 * 24);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

// ---------- Log Table ----------
function renderLogTable(logs) {
  const tbody = document.getElementById('log-tbody');
  if (!logs.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-row">No data yet. Start logging!</td></tr>';
    return;
  }

  // Show last 10 entries, newest first
  const recent = [...logs].reverse().slice(0, 10);
  tbody.innerHTML = recent.map(log => {
    const date    = new Date(log.date).toLocaleDateString();
    const total   = (log.total_minutes / 60).toFixed(1) + 'h';
    const moodMap = { Happy: '😊', Neutral: '😐', Stressed: '😰', Tired: '😴' };
    const moodIcon = moodMap[log.mood] || '';
    return `
      <tr>
        <td>${date}</td>
        <td>${log.instagram} min</td>
        <td>${log.youtube} min</td>
        <td>${(log.whatsapp || 0) + (log.other || 0)} min</td>
        <td><strong>${total}</strong></td>
        <td>${moodIcon} ${log.mood}</td>
        <td>⚡ ${log.points}</td>
      </tr>`;
  }).join('');
}

// ============================================================
// CHARTS — Chart.js
// ============================================================
function renderCharts(logs) {
  renderScreenTimeChart(logs);
  renderMoodChart(logs);
}

// ---------- Screen Time Bar Chart ----------
function renderScreenTimeChart(logs) {
  const ctx = document.getElementById('screenTimeChart').getContext('2d');

  // Use last 7 logs
  const recent = logs.slice(-7);
  const labels = recent.map(l => new Date(l.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }));
  const values = recent.map(l => (l.total_minutes / 60).toFixed(2));

  if (screenChart) screenChart.destroy(); // Destroy old chart before redraw

  screenChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Screen Time (hrs)',
        data: values,
        backgroundColor: 'rgba(74, 144, 217, 0.18)',
        borderColor: 'rgba(74, 144, 217, 0.9)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.04)' },
          ticks: { font: { size: 11 } }
        },
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 } }
        }
      }
    }
  });
}

// ---------- Mood vs Screen Time Scatter/Line Chart ----------
function renderMoodChart(logs) {
  const ctx = document.getElementById('moodChart').getContext('2d');

  const moodScore = { Happy: 4, Neutral: 3, Tired: 2, Stressed: 1 };
  const recent    = logs.slice(-7);
  const labels    = recent.map(l => new Date(l.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }));
  const screenVals = recent.map(l => (l.total_minutes / 60).toFixed(2));
  const moodVals   = recent.map(l => moodScore[l.mood] || 0);

  if (moodChart) moodChart.destroy();

  moodChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Screen Time (hrs)',
          data: screenVals,
          borderColor: 'rgba(74, 144, 217, 0.9)',
          backgroundColor: 'rgba(74, 144, 217, 0.08)',
          tension: 0.4,
          fill: true,
          yAxisID: 'y',
          pointRadius: 5,
        },
        {
          label: 'Mood (1=Stressed, 4=Happy)',
          data: moodVals,
          borderColor: 'rgba(92, 200, 160, 0.9)',
          backgroundColor: 'transparent',
          tension: 0.4,
          fill: false,
          yAxisID: 'y1',
          pointRadius: 5,
          borderDash: [5, 3],
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { font: { size: 11 } } } },
      scales: {
        y:  {
          beginAtZero: true,
          position: 'left',
          grid: { color: 'rgba(0,0,0,0.04)' },
          ticks: { font: { size: 11 } }
        },
        y1: {
          beginAtZero: true,
          position: 'right',
          max: 5,
          grid: { drawOnChartArea: false },
          ticks: { font: { size: 11 } }
        },
        x:  { grid: { display: false }, ticks: { font: { size: 11 } } }
      }
    }
  });
}

// ============================================================
// AI HABIT PREDICTION
// ============================================================
function renderPrediction(logs) {
  const el = document.getElementById('prediction-text');
  if (logs.length < 3) {
    el.textContent = 'Log at least 3 days to unlock AI predictions!';
    return;
  }

  const recent3   = logs.slice(-3);
  const avg       = recent3.reduce((s, l) => s + l.total_minutes, 0) / 3;
  const avgHours  = (avg / 60).toFixed(1);
  const lastMood  = logs[logs.length - 1].mood;
  const trend     = logs[logs.length - 1].total_minutes > logs[logs.length - 2].total_minutes ? 'up' : 'down';

  let prediction = '';

  if (trend === 'up' && avg > 180) {
    prediction = `📈 Your screen time is trending upward (~${avgHours} hrs avg). You may overuse your phone tomorrow. Set a limit!`;
  } else if (trend === 'down') {
    prediction = `📉 Great progress! Your screen time is decreasing. Keep the momentum going tomorrow!`;
  } else if (lastMood === 'Stressed' && avg > 150) {
    prediction = `😰 Stress + high usage detected. Tomorrow, try capping social media to 30 minutes.`;
  } else if (lastMood === 'Tired') {
    prediction = `😴 You've been tired recently. Avoid screens 1 hour before bed tonight for better sleep.`;
  } else if (avg < 90) {
    prediction = `✨ Impressive! You're averaging only ${avgHours} hrs/day. You're building a healthy habit!`;
  } else {
    prediction = `🤖 Average screen time: ${avgHours} hrs/day. Try the Pomodoro technique to stay productive tomorrow!`;
  }

  el.textContent = prediction;
}

// ============================================================
// INSIGHTS — Load Gamification + Suggestions
// ============================================================
async function loadInsights() {
  const logs = await fetchLogs();
  renderGamification(logs);
  renderSuggestions(logs);
  renderAIInsights(logs);
}

// ---------- Gamification ----------
function renderGamification(logs) {
  const points = logs.reduce((s, l) => s + (l.points || 0), 0);
  const streak = calculateStreak(logs);

  // Score display
  document.getElementById('big-score').textContent   = points;
  document.getElementById('stat-points').textContent = points;

  // Level system: every 50 points = 1 level
  const level     = Math.floor(points / 50) + 1;
  const levelPct  = ((points % 50) / 50) * 100;
  const levelName = ['Beginner', 'Explorer', 'Focused', 'Mindful', 'Zen Master'][Math.min(level - 1, 4)];

  document.getElementById('level-bar').style.width = levelPct + '%';
  document.getElementById('level-label').textContent = `Level ${level} – ${levelName}`;

  // Badges
  const badges = document.querySelectorAll('.badge');
  if (logs.length  >= 1)  badges[0].classList.replace('locked', 'unlocked'); // First Log
  if (streak       >= 3)  badges[1].classList.replace('locked', 'unlocked'); // 3-day streak
  if (points       >= 100) badges[2].classList.replace('locked', 'unlocked'); // 100 pts
  const lowDays = logs.filter(l => l.total_minutes < 60).length;
  if (lowDays      >= 3)  badges[3].classList.replace('locked', 'unlocked'); // Low usage
  if (sessionsDone >= 5)  badges[4].classList.replace('locked', 'unlocked'); // 5 study sessions
}

// ---------- Smart Suggestions ----------
function renderSuggestions(logs) {
  const grid = document.getElementById('suggestions-grid');

  if (!logs.length) {
    grid.innerHTML = `<div class="suggestion-card s-default">
      <span class="s-icon">💡</span>
      <h4>Log your first day</h4>
      <p>Go to "Log Day" and add your screen time to unlock personalized suggestions.</p>
    </div>`;
    return;
  }

  const latest    = logs[logs.length - 1];
  const hours     = latest.total_minutes / 60;
  const mood      = latest.mood;
  const streak    = calculateStreak(logs);
  const avg7      = logs.slice(-7).reduce((s, l) => s + l.total_minutes, 0) / Math.min(logs.length, 7);
  const avgHours  = avg7 / 60;

  const cards = [];

  // Break suggestion
  if (hours > 4) {
    cards.push({ color: 's-red', icon: '📵', title: 'Take a Digital Detox', text: `You used screens for ${hours.toFixed(1)} hrs today. Step away, go for a walk, or read a book.` });
  } else if (hours > 2) {
    cards.push({ color: 's-orange', icon: '☕', title: 'Take a Short Break', text: 'You\'re midway through your screen budget. Stand up, stretch, and hydrate.' });
  }

  // Study suggestion
  if (mood === 'Happy' || mood === 'Neutral') {
    cards.push({ color: 's-blue', icon: '📚', title: 'Good Time to Study', text: 'Your mood is great! Open the Study Mode tab and do a focused Pomodoro session.' });
  }

  // Sleep suggestion
  if (mood === 'Tired' || hours > 4) {
    cards.push({ color: 's-blue', icon: '🌙', title: 'Sleep Early Tonight', text: 'High usage or fatigue detected. Aim for 8 hours of sleep for better focus tomorrow.' });
  }

  // Streak
  if (streak >= 3) {
    cards.push({ color: 's-green', icon: '🔥', title: `${streak}-Day Streak!`, text: 'You\'re on a roll! Keep logging daily to maintain your streak and earn bonus points.' });
  }

  // Avg improvement
  if (avgHours < 2) {
    cards.push({ color: 's-green', icon: '🌟', title: 'Excellent Week!', text: `Your 7-day average is only ${avgHours.toFixed(1)} hrs/day. You're in the top tier!` });
  }

  // Fallback
  if (!cards.length) {
    cards.push({ color: 's-default', icon: '💡', title: 'Stay Consistent', text: 'Keep logging daily. Patterns become clearer over time, and AI suggestions will improve.' });
  }

  grid.innerHTML = cards.map(c => `
    <div class="suggestion-card ${c.color}">
      <span class="s-icon">${c.icon}</span>
      <h4>${c.title}</h4>
      <p>${c.text}</p>
    </div>`).join('');
}

// ---------- AI Insights ----------
function renderAIInsights(logs) {
  const el = document.getElementById('ai-insights-content');

  if (logs.length < 3) {
    el.innerHTML = '<p class="empty-state-text">Add at least 3 days of data to unlock AI habit analysis.</p>';
    return;
  }

  const moodScore  = { Happy: 4, Neutral: 3, Tired: 2, Stressed: 1 };
  const avg        = logs.reduce((s, l) => s + l.total_minutes, 0) / logs.length;
  const moodAvg    = logs.reduce((s, l) => s + (moodScore[l.mood] || 2), 0) / logs.length;
  const peakDay    = logs.reduce((max, l) => l.total_minutes > max.total_minutes ? l : max, logs[0]);
  const instagramAvg = logs.reduce((s, l) => s + (l.instagram || 0), 0) / logs.length;
  const youtubeAvg   = logs.reduce((s, l) => s + (l.youtube || 0), 0) / logs.length;

  const insights = [
    `📱 Your average daily screen time is <strong>${(avg / 60).toFixed(1)} hours</strong>.`,
    `😊 Average mood score: <strong>${moodAvg.toFixed(1)}/4</strong> (${moodAvg > 3 ? 'mostly positive' : moodAvg > 2 ? 'neutral' : 'often stressed or tired'}).`,
    `📅 Peak usage day: <strong>${new Date(peakDay.date).toDateString()}</strong> with ${(peakDay.total_minutes/60).toFixed(1)} hrs.`,
    `📸 Instagram avg: <strong>${instagramAvg.toFixed(0)} min/day</strong>. ${instagramAvg > 60 ? 'Consider reducing reel time.' : 'Good control!'}`,
    `▶️ YouTube avg: <strong>${youtubeAvg.toFixed(0)} min/day</strong>. ${youtubeAvg > 90 ? 'Try replacing some watch time with reading.' : 'Reasonable usage.'}`,
    `🧠 Habit pattern: ${avg > 240 ? 'Heavy user — consider a structured detox plan.' : avg > 120 ? 'Moderate user — small daily limits can make a big difference.' : 'Light user — great digital discipline!'}`,
  ];

  el.innerHTML = insights.map(i => `
    <div class="ai-insight-item">
      <div class="ai-insight-dot"></div>
      <p>${i}</p>
    </div>`).join('');
}

// ============================================================
// POMODORO TIMER
// ============================================================
const MOTIVATIONAL = {
  focus: [
    '🌟 Stay Focused! You can do this!',
    '🧠 Deep work unlocks your potential.',
    '🚀 One session at a time. Keep going!',
    '💪 Block out distractions. Stay in flow.',
    '📚 Your future self thanks you!'
  ],
  break: [
    '☕ Great work! Enjoy your break.',
    '🌿 Stand up and stretch for a minute.',
    '💧 Hydrate! Drink some water.',
    '😊 You earned this rest. Relax.',
    '🎵 Quick — listen to your favourite song!'
  ]
};

function setMode(mode) {
  timerMode = mode;
  timeLeft  = mode === 'focus' ? 25 * 60 : 5 * 60;
  totalTime = timeLeft;

  document.getElementById('focus-tab').classList.toggle('active', mode === 'focus');
  document.getElementById('break-tab').classList.toggle('active', mode === 'break');

  updateTimerDisplay();
  updateRingProgress();
  setRandomMotivation();

  if (timerRunning) stopTimer();
  document.getElementById('start-btn').textContent = '▶ Start';
}

function toggleTimer() {
  if (timerRunning) {
    stopTimer();
    document.getElementById('start-btn').textContent = '▶ Resume';
  } else {
    startTimer();
    document.getElementById('start-btn').textContent = '⏸ Pause';
  }
}

function startTimer() {
  timerRunning = true;
  timerInterval = setInterval(() => {
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      handleTimerComplete();
      return;
    }
    timeLeft--;
    updateTimerDisplay();
    updateRingProgress();
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
}

function resetTimer() {
  stopTimer();
  timeLeft = timerMode === 'focus' ? 25 * 60 : 5 * 60;
  totalTime = timeLeft;
  updateTimerDisplay();
  updateRingProgress();
  document.getElementById('start-btn').textContent = '▶ Start';
  setRandomMotivation();
}

function handleTimerComplete() {
  if (timerMode === 'focus') {
    sessionsDone++;
    document.getElementById('session-count').textContent = sessionsDone;
    // Update XP bar
    const xpPct = Math.min((sessionsDone % 5) / 5 * 100, 100);
    document.getElementById('xp-bar').style.width = xpPct + '%';
    document.getElementById('xp-label').textContent = `${sessionsDone % 5} / 5 sessions for next reward`;
    showToast('🎉 Focus session complete! Take a break.');
    setMode('break');
  } else {
    showToast('☕ Break over! Ready for next session?');
    setMode('focus');
  }
}

function updateTimerDisplay() {
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  document.getElementById('timer-minutes').textContent = String(mins).padStart(2, '0');
  document.getElementById('timer-seconds').textContent = String(secs).padStart(2, '0');
}

function updateRingProgress() {
  const circumference = 2 * Math.PI * 85; // r=85
  const progress      = timeLeft / totalTime;
  const offset        = circumference * (1 - progress);
  const ring          = document.getElementById('ring-progress');
  ring.style.strokeDasharray  = circumference;
  ring.style.strokeDashoffset = offset;
}

function setRandomMotivation() {
  const msgs = MOTIVATIONAL[timerMode];
  const msg  = msgs[Math.floor(Math.random() * msgs.length)];
  document.getElementById('motivational-msg').textContent = msg;
}

// ============================================================
// TOAST NOTIFICATION
// ============================================================
function showToast(message, duration = 3000) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, duration);
}

// ============================================================
// EVENT LISTENERS — Live suggestion preview
// ============================================================
['instagram', 'youtube', 'whatsapp', 'other'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => {
    if (selectedMood) showSuggestionPreview();
  });
});

// ============================================================
// INITIALIZE APP
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // Load dashboard on start
  loadDashboard();

  // Initialize timer display
  updateTimerDisplay();
  updateRingProgress();
  setRandomMotivation();
});
