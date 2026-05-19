/**
 * NutriTrack - App Module
 * Shared utilities, navigation, theme, and common UI helpers.
 */

// ── Date Utilities ────────────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(isoDate) {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}

function formatDateLong(isoDate) {
  if (!isoDate) return '';
  return new Date(isoDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  });
}

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

function getLast30Days() {
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

// ── Nutrition Calculations ────────────────────────────────────────────────────

function calcNutrition(food, quantity) {
  // food has per-unit values; quantity is how many units
  const factor = quantity / 100; // normalized to per-100g basis
  return {
    calories: round2(food.calories * factor),
    protein: round2((food.protein || 0) * factor),
    carbs: round2((food.carbs || 0) * factor),
    fats: round2((food.fats || 0) * factor),
    fiber: round2((food.fiber || 0) * factor),
  };
}

function sumNutrition(items) {
  return items.reduce((acc, item) => {
    const n = item.nutrition || {};
    acc.calories += n.calories || 0;
    acc.protein += n.protein || 0;
    acc.carbs += n.carbs || 0;
    acc.fats += n.fats || 0;
    acc.fiber += n.fiber || 0;
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 });
}

function sumMealNutrition(meals) {
  const all = [
    ...( meals.breakfast || []),
    ...( meals.lunch || []),
    ...( meals.snacks || []),
    ...( meals.dinner || []),
  ];
  return sumNutrition(all);
}

function round2(n) { return Math.round(n * 100) / 100; }

// ── Toast Notifications ───────────────────────────────────────────────────────

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ── Modal Helpers ─────────────────────────────────────────────────────────────

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Close modal on backdrop click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-backdrop')) {
    e.target.closest('.modal').classList.remove('active');
    document.body.style.overflow = '';
  }
});

// ── Theme ─────────────────────────────────────────────────────────────────────

function initTheme() {
  const saved = localStorage.getItem('nutritrack-theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeToggle(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('nutritrack-theme', next);
  updateThemeToggle(next);
}

function updateThemeToggle(theme) {
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = theme === 'dark' ? '☀' : '☾';
}

// ── Active Nav Link ───────────────────────────────────────────────────────────

function setActiveNav() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    link.classList.toggle('active', href === page || (page === '' && href === 'index.html'));
  });
}

// ── Progress Bar ──────────────────────────────────────────────────────────────

function renderProgressBar(container, current, target, label) {
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  const color = pct >= 100 ? 'var(--danger)' : pct >= 80 ? 'var(--warning)' : 'var(--primary)';
  container.innerHTML = `
    <div class="progress-label">
      <span>${label}</span>
      <span>${round2(current)} / ${target} kcal</span>
    </div>
    <div class="progress-track">
      <div class="progress-fill" style="width:${pct}%; background:${color}"></div>
    </div>
    <div class="progress-pct">${round2(pct)}%</div>
  `;
}

// ── Number formatting ─────────────────────────────────────────────────────────

function fmtNum(n, decimals = 1) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return Number(n).toFixed(decimals);
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────

function confirmAction(message) {
  return window.confirm(message);
}

// ── CSV Export ────────────────────────────────────────────────────────────────

function downloadCSV(filename, rows, headers) {
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [headers.map(escape).join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Hamburger Nav Toggle ──────────────────────────────────────────────────────

function initNavToggle() {
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('nav-menu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => menu.classList.toggle('open'));
    // Close on link click
    menu.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', () => menu.classList.remove('open')));
  }
}

// ── Body / Health Calculations ────────────────────────────────────────────────

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light:     1.375,
  moderate:  1.55,
  very:      1.725,
  extreme:   1.9,
};

function calcAge(dob) {
  if (!dob) return null;
  const today = new Date();
  const birth = new Date(dob + 'T00:00:00');
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age > 0 ? age : null;
}

// Mifflin-St Jeor equation
function calcBMR(weightKg, heightCm, age, gender) {
  if (!weightKg || !heightCm || !age) return null;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(gender === 'female' ? base - 161 : base + 5);
}

function calcTDEE(bmr, activityLevel) {
  if (!bmr) return null;
  return Math.round(bmr * (ACTIVITY_MULTIPLIERS[activityLevel] || 1.55));
}

function calcCalorieTarget(tdee, goalType) {
  if (!tdee) return null;
  if (goalType === 'lose') return Math.max(1200, tdee - 500);
  if (goalType === 'gain') return tdee + 300;
  return tdee;
}

function calcBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  return round2(weightKg / Math.pow(heightCm / 100, 2));
}

function bmiCategory(bmi) {
  if (!bmi) return null;
  if (bmi < 18.5) return { label: 'Underweight', color: 'var(--secondary)' };
  if (bmi < 25)   return { label: 'Normal',      color: 'var(--success)'   };
  if (bmi < 30)   return { label: 'Overweight',  color: 'var(--warning)'   };
  return               { label: 'Obese',       color: 'var(--danger)'    };
}

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setActiveNav();
  initNavToggle();

  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
});

// Public API
window.App = {
  todayISO, formatDate, formatDateLong, getLast7Days, getLast30Days,
  calcNutrition, sumNutrition, sumMealNutrition, round2, fmtNum,
  showToast, openModal, closeModal,
  renderProgressBar,
  downloadCSV, downloadJSON,
  confirmAction,
  // Health calculations
  calcAge, calcBMR, calcTDEE, calcCalorieTarget, calcBMI, bmiCategory,
  timeGreeting, ACTIVITY_MULTIPLIERS,
};
