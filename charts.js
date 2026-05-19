/**
 * NutriTrack - Charts Module
 * Wrappers around Chart.js for consistent chart rendering.
 */

const ChartDefaults = {
  fontFamily: "'Inter', 'Segoe UI', sans-serif",
  colors: {
    primary:   '#4f46e5',
    secondary: '#06b6d4',
    success:   '#10b981',
    warning:   '#f59e0b',
    danger:    '#ef4444',
    protein:   '#4f46e5',
    carbs:     '#f59e0b',
    fats:      '#ef4444',
    fiber:     '#10b981',
  },
};

function getThemeColors() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    grid:   isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    text:   isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#334155' : '#e2e8f0',
  };
}

function baseOptions(title) {
  const tc = getThemeColors();
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: tc.text,
          font: { family: ChartDefaults.fontFamily, size: 12 },
          padding: 16,
        },
      },
      title: title ? {
        display: true,
        text: title,
        color: tc.text,
        font: { family: ChartDefaults.fontFamily, size: 14, weight: '600' },
        padding: { bottom: 12 },
      } : { display: false },
      tooltip: {
        backgroundColor: 'rgba(15,23,42,0.9)',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { color: tc.grid },
        ticks: { color: tc.text, font: { family: ChartDefaults.fontFamily } },
      },
      y: {
        grid: { color: tc.grid },
        ticks: { color: tc.text, font: { family: ChartDefaults.fontFamily } },
      },
    },
  };
}

// Destroys an existing Chart instance on a canvas before creating a new one
function destroyChart(canvasId) {
  const existing = Chart.getChart(canvasId);
  if (existing) existing.destroy();
}

// ── Weight Line Chart ─────────────────────────────────────────────────────────

function renderWeightChart(canvasId, labels, data) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId).getContext('2d');
  const opts = baseOptions('Weight Trend');

  // Remove scale definitions that conflict with line chart (no pie scales)
  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Weight (kg)',
        data,
        borderColor: ChartDefaults.colors.primary,
        backgroundColor: 'rgba(79,70,229,0.10)',
        pointBackgroundColor: ChartDefaults.colors.primary,
        pointRadius: 5,
        pointHoverRadius: 7,
        fill: true,
        tension: 0.35,
      }],
    },
    options: {
      ...opts,
      plugins: {
        ...opts.plugins,
        tooltip: {
          ...opts.plugins.tooltip,
          callbacks: {
            label: (ctx) => ` ${ctx.raw} kg`,
          },
        },
      },
      scales: {
        x: opts.scales.x,
        y: {
          ...opts.scales.y,
          title: {
            display: true,
            text: 'kg',
            color: getThemeColors().text,
          },
        },
      },
    },
  });
}

// ── Macro Pie Chart ───────────────────────────────────────────────────────────

function renderMacroPieChart(canvasId, protein, carbs, fats) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId).getContext('2d');
  const tc = getThemeColors();

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Protein', 'Carbs', 'Fats'],
      datasets: [{
        data: [protein, carbs, fats],
        backgroundColor: [
          ChartDefaults.colors.protein,
          ChartDefaults.colors.carbs,
          ChartDefaults.colors.fats,
        ],
        borderColor: tc.border,
        borderWidth: 2,
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: tc.text,
            font: { family: ChartDefaults.fontFamily, size: 12 },
            padding: 16,
          },
        },
        tooltip: {
          ...baseOptions().plugins.tooltip,
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${ctx.raw}g`,
          },
        },
      },
      cutout: '60%',
    },
  });
}

// ── Calorie Bar Chart (by meal) ───────────────────────────────────────────────

function renderMealCaloriesBar(canvasId, mealTotals) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId).getContext('2d');
  const opts = baseOptions('Calories by Meal');
  const colors = [ChartDefaults.colors.primary, ChartDefaults.colors.secondary, ChartDefaults.colors.warning, ChartDefaults.colors.success];

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Breakfast', 'Lunch', 'Snacks', 'Dinner'],
      datasets: [{
        label: 'Calories (kcal)',
        data: [mealTotals.breakfast, mealTotals.lunch, mealTotals.snacks, mealTotals.dinner],
        backgroundColor: colors.map(c => c + 'cc'),
        borderColor: colors,
        borderWidth: 2,
        borderRadius: 6,
      }],
    },
    options: {
      ...opts,
      plugins: { ...opts.plugins, legend: { display: false } },
      scales: {
        x: opts.scales.x,
        y: {
          ...opts.scales.y,
          beginAtZero: true,
          title: { display: true, text: 'kcal', color: getThemeColors().text },
        },
      },
    },
  });
}

// ── Macro Bar Chart (stacked for each meal) ───────────────────────────────────

function renderMacroBarChart(canvasId, mealMacros) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId).getContext('2d');
  const opts = baseOptions('Macros by Meal (g)');

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Breakfast', 'Lunch', 'Snacks', 'Dinner'],
      datasets: [
        {
          label: 'Protein',
          data: mealMacros.map(m => m.protein),
          backgroundColor: ChartDefaults.colors.protein + 'cc',
          borderColor: ChartDefaults.colors.protein,
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: 'Carbs',
          data: mealMacros.map(m => m.carbs),
          backgroundColor: ChartDefaults.colors.carbs + 'cc',
          borderColor: ChartDefaults.colors.carbs,
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: 'Fats',
          data: mealMacros.map(m => m.fats),
          backgroundColor: ChartDefaults.colors.fats + 'cc',
          borderColor: ChartDefaults.colors.fats,
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    },
    options: {
      ...opts,
      scales: {
        x: { ...opts.scales.x, stacked: false },
        y: {
          ...opts.scales.y,
          beginAtZero: true,
          title: { display: true, text: 'grams', color: getThemeColors().text },
        },
      },
    },
  });
}

// ── Weekly Calorie Trend ──────────────────────────────────────────────────────

function renderCalorieTrendChart(canvasId, labels, calories, target) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId).getContext('2d');
  const opts = baseOptions('7-Day Calorie Trend');

  const datasets = [{
    label: 'Calories',
    data: calories,
    borderColor: ChartDefaults.colors.secondary,
    backgroundColor: 'rgba(6,182,212,0.10)',
    pointBackgroundColor: ChartDefaults.colors.secondary,
    fill: true,
    tension: 0.3,
    pointRadius: 5,
  }];

  if (target) {
    datasets.push({
      label: 'Target',
      data: Array(labels.length).fill(target),
      borderColor: ChartDefaults.colors.danger,
      borderDash: [6, 3],
      pointRadius: 0,
      fill: false,
    });
  }

  new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      ...opts,
      scales: {
        x: opts.scales.x,
        y: {
          ...opts.scales.y,
          beginAtZero: true,
          title: { display: true, text: 'kcal', color: getThemeColors().text },
        },
      },
    },
  });
}

window.Charts = {
  renderWeightChart,
  renderMacroPieChart,
  renderMealCaloriesBar,
  renderMacroBarChart,
  renderCalorieTrendChart,
};
