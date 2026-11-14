/**
 * NASA BIOMEDICAL TELEMETRY CORE
 * UI Charts & Interactive Body Silhouette Tooltip
 * Uses Chart.js (CDN)
 */

document.addEventListener('DOMContentLoaded', () => {
  initCharts();
  initSilhouetteInteraction();
});

let radiationChartInstance = null;
let hydrationChartInstance = null;

/**
 * Initialize NASA HUD Chart.js instances
 */
function initCharts() {
  if (typeof Chart === 'undefined') {
    console.warn('[HUD Charts] Chart.js CDN not loaded yet.');
    return;
  }

  // Global Chart.js defaults for Refined Dark Space HUD
  Chart.defaults.color = '#94a3b8';
  Chart.defaults.font.family = "'JetBrains Mono', 'Inter', monospace";
  Chart.defaults.font.size = 11;
  Chart.defaults.font.weight = 500;

  initRadiationChart();
  initHydrationChart();
}

/**
 * Chart 1: Radiation Exposure (mSv) - Refined Red Gradient
 */
function initRadiationChart() {
  const canvas = document.getElementById('chart-radiation');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  // Vertical Soft Red Gradient Fill
  const gradient = ctx.createLinearGradient(0, 0, 0, 200);
  gradient.addColorStop(0, 'rgba(248, 113, 113, 0.22)');
  gradient.addColorStop(0.5, 'rgba(248, 113, 113, 0.08)');
  gradient.addColorStop(1, 'rgba(248, 113, 113, 0.0)');

  const labels = [];
  const data = [];

  radiationChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Radiation sensor dose (mSv)',
          data: data,
          borderColor: '#f87171',
          borderWidth: 2,
          backgroundColor: gradient,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#f87171',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1.5,
          pointRadius: 2,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: '#f87171',
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: '#0f1623',
          titleColor: '#f87171',
          bodyColor: '#f1f5f9',
          borderColor: 'rgba(248, 113, 113, 0.4)',
          borderWidth: 1,
          padding: 10,
          displayColors: false,
          callbacks: {
            label: (context) => `RAD DOSE: ${context.parsed.y.toFixed(2)} mSv`
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(148, 163, 184, 0.08)',
            tickColor: 'rgba(148, 163, 184, 0.16)'
          },
          ticks: {
            color: '#94a3b8',
            maxTicksLimit: 6,
            maxRotation: 0,
            font: {
              family: "'JetBrains Mono', monospace",
              size: 11,
              weight: 500
            }
          }
        },
        y: {
          min: 0,
          suggestedMax: 1,
          grid: {
            color: 'rgba(148, 163, 184, 0.08)',
            tickColor: 'rgba(148, 163, 184, 0.16)'
          },
          ticks: {
            color: '#94a3b8',
            font: {
              family: "'JetBrains Mono', monospace",
              size: 11,
              weight: 500
            },
            callback: (val) => val.toFixed(2)
          }
        }
      }
    }
  });
}

/**
 * Chart 2: Hydration & Metabolism (%) - Calm Cosmic Sky Blue & Indigo
 */
function initHydrationChart() {
  const canvas = document.getElementById('chart-hydration');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  // Vertical Calm Sky Blue Gradient Fill
  const gradientSky = ctx.createLinearGradient(0, 0, 0, 200);
  gradientSky.addColorStop(0, 'rgba(56, 189, 248, 0.20)');
  gradientSky.addColorStop(0.5, 'rgba(56, 189, 248, 0.06)');
  gradientSky.addColorStop(1, 'rgba(56, 189, 248, 0.0)');

  const labels = [];
  const hydrationData = [];
  const metabolismData = [];

  hydrationChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Hydration Level (%)',
          data: hydrationData,
          borderColor: '#38bdf8',
          borderWidth: 2,
          backgroundColor: gradientSky,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#38bdf8',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1.5,
          pointRadius: 2,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: '#38bdf8',
        },
        {
          label: 'Metabolic Rate (%)',
          data: metabolismData,
          borderColor: '#818cf8',
          borderWidth: 1.8,
          borderDash: [4, 4],
          fill: false,
          tension: 0.4,
          pointBackgroundColor: '#818cf8',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1,
          pointRadius: 2,
          pointHoverRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: '#0f1623',
          titleColor: '#38bdf8',
          bodyColor: '#f1f5f9',
          borderColor: 'rgba(56, 189, 248, 0.4)',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: (context) => `${context.dataset.label}: ${context.parsed.y}%`
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(148, 163, 184, 0.08)',
            tickColor: 'rgba(148, 163, 184, 0.16)'
          },
          ticks: {
            color: '#94a3b8',
            maxTicksLimit: 6,
            maxRotation: 0,
            font: {
              family: "'JetBrains Mono', monospace",
              size: 11,
              weight: 500
            }
          }
        },
        y: {
          min: 0,
          max: 100,
          grid: {
            color: 'rgba(148, 163, 184, 0.08)',
            tickColor: 'rgba(148, 163, 184, 0.16)'
          },
          ticks: {
            color: '#94a3b8',
            stepSize: 10,
            font: {
              family: "'JetBrains Mono', monospace",
              size: 11,
              weight: 500
            },
            callback: (val) => `${val}%`
          }
        }
      }
    }
  });
}

/**
 * Interactive SVG Silhouette & Floating Tooltip
 * Supports both Desktop Hover and Mobile Touchscreen Tap
 */
function initSilhouetteInteraction() {
  const tooltip = document.getElementById('silhouette-tooltip');
  const tooltipTitle = document.getElementById('tooltip-zone-title');
  const tooltipLoad = document.getElementById('tooltip-zone-load');
  const tooltipTemp = document.getElementById('tooltip-zone-temp');
  const tooltipStatus = document.getElementById('tooltip-zone-status');

  // Select all interactive heat zones (both mandatory core zones and expanded limbs/hips/legs)
  const zones = Array.from(document.querySelectorAll('.heat-zone'));
  let displayedZone = null;

  // Keep open hover/tap/keyboard tooltips synchronized without changing interaction behavior.
  document.addEventListener('telemetry:update', () => {
    if (displayedZone && tooltip && tooltip.style.display === 'flex') updateTooltipContent(displayedZone);
  });

  function updateTooltipContent(zone) {
    const name = zone.getAttribute('data-zone-name') || 'BIOMETRIC ZONE';
    const load = zone.getAttribute('data-load') || '0%';
    const temp = zone.getAttribute('data-temp') || '36.6 °C';
    const status = zone.getAttribute('data-status') || 'NOMINAL';

    if (tooltipTitle) tooltipTitle.textContent = name;
    if (tooltipLoad) tooltipLoad.textContent = load;
    if (tooltipTemp) tooltipTemp.textContent = temp;
    if (tooltipStatus) {
      tooltipStatus.textContent = status;
      tooltipStatus.className = 'tooltip-badge';
      if (status === 'NOMINAL') tooltipStatus.classList.add('status-nominal');
      else if (status === 'ELEVATED') tooltipStatus.classList.add('status-elevated');
      else if (status === 'WARNING') tooltipStatus.classList.add('status-warning');
      else if (status === 'CRITICAL') tooltipStatus.classList.add('status-critical');
      else tooltipStatus.classList.add('status-nominal');
    }
  }

  function showAndPosition(zone, clientX, clientY) {
    displayedZone = zone;
    updateTooltipContent(zone);
    if (tooltip) tooltip.setAttribute('aria-hidden', 'false');
    if (tooltip) {
      tooltip.style.display = 'flex';
      positionTooltip(clientX, clientY, tooltip, zone);
    }
  }

  zones.forEach(zone => {
    // Desktop Hover Events
    zone.addEventListener('mouseenter', (e) => {
      showAndPosition(zone, e.clientX, e.clientY);
    });

    zone.addEventListener('mousemove', (e) => {
      if (tooltip && tooltip.style.display === 'flex') {
        positionTooltip(e.clientX, e.clientY, tooltip, zone);
      }
    });

    zone.addEventListener('mouseleave', () => {
      // On mouse leave, hide tooltip when hover is supported
      if (window.matchMedia('(hover: hover)').matches) {
        if (tooltip) {
          tooltip.style.display = 'none';
          tooltip.setAttribute('aria-hidden', 'true');
        }
        zone.classList.remove('is-active');
      }
    });

    // Mobile / Touchscreen Click & Tap Events
    zone.addEventListener('click', (e) => {
      e.stopPropagation();
      zones.forEach(z => z.classList.remove('is-active'));
      zone.classList.add('is-active');

      const rect = zone.getBoundingClientRect();
      const x = (e.clientX && e.clientX > 0) ? e.clientX : (rect.left + rect.width / 2);
      const y = (e.clientY && e.clientY > 0) ? e.clientY : (rect.top + rect.height / 2);

      showAndPosition(zone, x, y);
    });

    // Keyboard accessibility (Enter / Space)
    zone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        zones.forEach(z => z.classList.remove('is-active'));
        zone.classList.add('is-active');
        const rect = zone.getBoundingClientRect();
        showAndPosition(zone, rect.left + rect.width / 2, rect.top + rect.height / 2);
      }
    });
  });

  // Tap or click outside to dismiss tooltip on mobile or desktop
  document.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('.heat-zone') && !e.target.closest('#silhouette-tooltip')) {
      if (tooltip) {
        tooltip.style.display = 'none';
        tooltip.setAttribute('aria-hidden', 'true');
      }
      zones.forEach(z => z.classList.remove('is-active'));
    }
  });
}

/**
 * Position tooltip strictly within screen boundaries
 * Desktop: strictly to the left of the cursor
 * Mobile (<= 768px): to the left if space permits, clamped safely between 10px and screen width so it never overflows
 */
function positionTooltip(clientX, clientY, tooltip, zone) {
  if (!tooltip) return;

  const offset = 18;
  const tooltipWidth = tooltip.offsetWidth || 230;
  const tooltipHeight = tooltip.offsetHeight || 130;
  const halfHeight = tooltipHeight / 2;
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  const maxLeft = Math.max(10, screenWidth - tooltipWidth - 10);
  let leftPos = clientX - tooltipWidth - offset;
  let topPos = clientY;

  if (screenWidth <= 768) {
    // If placing to the left overflows the screen left boundary on mobile
    if (leftPos < 10) {
      if (zone) {
        const rect = zone.getBoundingClientRect();
        const rightPos = rect.right + offset;
        if (rightPos + tooltipWidth <= screenWidth - 10) {
          leftPos = rightPos;
        } else {
          // Center within viewport bounds with safe margins
          leftPos = Math.max(10, Math.min(maxLeft, (screenWidth - tooltipWidth) / 2));
        }
      } else {
        leftPos = Math.max(10, Math.min(maxLeft, (screenWidth - tooltipWidth) / 2));
      }
    }
  } else {
    // Desktop: strictly to the left of cursor, protected by left edge
    if (leftPos < 10) {
      leftPos = 10;
    }
  }

  // Ensure left position is strictly clamped inside [10, maxLeft]
  if (leftPos < 10) leftPos = 10;
  if (leftPos > maxLeft) leftPos = maxLeft;

  // Vertical viewport clamping
  if (topPos - halfHeight < 10) {
    topPos = halfHeight + 10;
  } else if (topPos + halfHeight > screenHeight - 10) {
    topPos = screenHeight - halfHeight - 10;
  }

  tooltip.style.left = `${Math.round(leftPos)}px`;
  tooltip.style.top = `${Math.round(topPos)}px`;
}

// Backward-compatibility alias
const positionTooltipLeft = positionTooltip;

/**
 * Consume bounded telemetry history; keep chart styling and input handling separate.
 */
function appendChartSample(chart, sample, values, history, reset) {
  if (reset) {
    chart.data.labels.length = 0;
    chart.data.datasets.forEach(dataset => { dataset.data.length = 0; });
  }
  chart.data.labels.push('T-0s');
  chart.data.datasets.forEach((dataset, index) => dataset.data.push(values[index]));
  while (chart.data.labels.length > 15) {
    chart.data.labels.shift();
    chart.data.datasets.forEach(dataset => dataset.data.shift());
  }
  const visibleSamples = history.slice(-chart.data.labels.length);
  visibleSamples.forEach((point, index) => {
    chart.data.labels[index] = `T-${Math.round(sample.elapsedSeconds - point.elapsedSeconds)}s`;
  });
}

document.addEventListener('telemetry:update', event => {
  const { history, state, reason } = event.detail;
  const sample = history[history.length - 1];
  if (!sample) return;
  const reset = reason !== 'tick';
  if (radiationChartInstance) {
    const chart = radiationChartInstance;
    appendChartSample(chart, sample, [sample.radiation], history, reset);
    // Focus on the current dose so sub-percent sensor drift remains visible.
    const padding = Math.max(0.01, state.radiation * 0.015);
    chart.options.scales.y.min = Math.max(0, Math.min(state.radiation - padding, ...chart.data.datasets[0].data));
    chart.options.scales.y.max = Math.max(state.radiation + padding, ...chart.data.datasets[0].data);
    chart.update('none');
  }
  if (hydrationChartInstance) {
    const chart = hydrationChartInstance;
    appendChartSample(chart, sample, [sample.hydration, sample.metabolism], history, reset);
    const values = chart.data.datasets.flatMap(dataset => dataset.data);
    chart.options.scales.y.min = Math.max(0, Math.floor((Math.min(...values) - 5) / 10) * 10);
    chart.options.scales.y.max = Math.min(100, Math.ceil((Math.max(...values) + 5) / 10) * 10);
    chart.update('none');
  }
});
