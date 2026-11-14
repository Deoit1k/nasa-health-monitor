/**
 * NASA BIOMEDICAL TELEMETRY CORE
 * UI Charts & Interactive Body Silhouette Tooltip
 * Uses Chart.js (CDN)
 */

document.addEventListener('DOMContentLoaded', () => {
  initCharts();
  initSilhouetteInteraction();
  initSimulationControls();
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

  // Global Chart.js defaults for NASA Space HUD
  Chart.defaults.color = '#88a7c4';
  Chart.defaults.font.family = "'Share Tech Mono', 'Rajdhani', monospace";
  Chart.defaults.font.size = 11;

  initRadiationChart();
  initHydrationChart();
}

/**
 * Chart 1: Radiation Exposure (mSv) - Red Neon Gradient
 */
function initRadiationChart() {
  const canvas = document.getElementById('chart-radiation');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  // Vertical Red Gradient Fill
  const gradient = ctx.createLinearGradient(0, 0, 0, 200);
  gradient.addColorStop(0, 'rgba(255, 42, 85, 0.45)');
  gradient.addColorStop(0.5, 'rgba(255, 42, 85, 0.15)');
  gradient.addColorStop(1, 'rgba(255, 42, 85, 0.0)');

  const labels = ['T-60m', 'T-50m', 'T-40m', 'T-30m', 'T-20m', 'T-10m', 'LIVE'];
  const data = [0.18, 0.22, 0.29, 0.35, 0.41, 0.48, 0.42];

  radiationChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Radiation (mSv/hr)',
          data: data,
          borderColor: '#ff2a55',
          borderWidth: 2,
          backgroundColor: gradient,
          fill: true,
          tension: 0.35,
          pointBackgroundColor: '#ff2a55',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1.5,
          pointRadius: 4,
          pointHoverRadius: 7,
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: '#ff2a55',
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1200,
        easing: 'easeOutQuart'
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(5, 11, 20, 0.95)',
          titleColor: '#00e5ff',
          bodyColor: '#ffffff',
          borderColor: '#ff2a55',
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
            color: 'rgba(0, 229, 255, 0.06)',
            tickColor: 'rgba(0, 229, 255, 0.2)'
          },
          ticks: {
            color: '#88a7c4'
          }
        },
        y: {
          min: 0,
          max: 0.8,
          grid: {
            color: 'rgba(0, 229, 255, 0.08)',
            tickColor: 'rgba(0, 229, 255, 0.2)'
          },
          ticks: {
            color: '#88a7c4',
            stepSize: 0.2,
            callback: (val) => val.toFixed(2)
          }
        }
      }
    }
  });
}

/**
 * Chart 2: Hydration & Metabolism (%) - Neon Cyan/Blue Gradient
 */
function initHydrationChart() {
  const canvas = document.getElementById('chart-hydration');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  // Vertical Neon Cyan Gradient Fill
  const gradientCyan = ctx.createLinearGradient(0, 0, 0, 200);
  gradientCyan.addColorStop(0, 'rgba(0, 229, 255, 0.40)');
  gradientCyan.addColorStop(0.5, 'rgba(0, 229, 255, 0.12)');
  gradientCyan.addColorStop(1, 'rgba(0, 229, 255, 0.0)');

  const labels = ['04:00', '06:00', '08:00', '10:00', '12:00', '14:00', 'NOW'];
  const hydrationData = [94, 91, 88, 86, 92, 90, 89];
  const metabolismData = [72, 75, 84, 88, 82, 78, 80];

  hydrationChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Hydration Level (%)',
          data: hydrationData,
          borderColor: '#00e5ff',
          borderWidth: 2.2,
          backgroundColor: gradientCyan,
          fill: true,
          tension: 0.35,
          pointBackgroundColor: '#00e5ff',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1.5,
          pointRadius: 4,
          pointHoverRadius: 7,
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: '#00e5ff',
        },
        {
          label: 'Metabolic Rate (%)',
          data: metabolismData,
          borderColor: '#0088ff',
          borderWidth: 1.8,
          borderDash: [4, 4],
          fill: false,
          tension: 0.3,
          pointBackgroundColor: '#0088ff',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1,
          pointRadius: 3,
          pointHoverRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1200,
        easing: 'easeOutQuart'
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(5, 11, 20, 0.95)',
          titleColor: '#00e5ff',
          bodyColor: '#ffffff',
          borderColor: '#00e5ff',
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
            color: 'rgba(0, 229, 255, 0.06)',
            tickColor: 'rgba(0, 229, 255, 0.2)'
          },
          ticks: {
            color: '#88a7c4'
          }
        },
        y: {
          min: 60,
          max: 100,
          grid: {
            color: 'rgba(0, 229, 255, 0.08)',
            tickColor: 'rgba(0, 229, 255, 0.2)'
          },
          ticks: {
            color: '#88a7c4',
            stepSize: 10,
            callback: (val) => `${val}%`
          }
        }
      }
    }
  });
}

/**
 * Interactive SVG Silhouette & Floating Tooltip (Strictly Left of Cursor)
 */
function initSilhouetteInteraction() {
  const tooltip = document.getElementById('silhouette-tooltip');
  const tooltipTitle = document.getElementById('tooltip-zone-title');
  const tooltipLoad = document.getElementById('tooltip-zone-load');
  const tooltipTemp = document.getElementById('tooltip-zone-temp');
  const tooltipStatus = document.getElementById('tooltip-zone-status');

  const zoneHead = document.getElementById('zone-head');
  const zoneChest = document.getElementById('zone-chest');
  const zoneAbdomen = document.getElementById('zone-abdomen');
  const zoneKnees = document.getElementById('zone-knees');

  const zones = [zoneHead, zoneChest, zoneAbdomen, zoneKnees].filter(Boolean);

  zones.forEach(zone => {
    zone.addEventListener('mouseenter', (e) => {
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

      tooltip.style.display = 'flex';
      positionTooltipLeft(e, tooltip);
    });

    zone.addEventListener('mousemove', (e) => {
      positionTooltipLeft(e, tooltip);
    });

    zone.addEventListener('mouseleave', () => {
      if (tooltip) tooltip.style.display = 'none';
    });
  });
}

/**
 * Position tooltip strictly to the LEFT of the mouse cursor
 */
function positionTooltipLeft(e, tooltip) {
  if (!tooltip) return;

  const offset = 18;
  const tooltipWidth = tooltip.offsetWidth || 230;
  const tooltipHeight = tooltip.offsetHeight || 130;

  // Calculate position strictly to the left of cursor
  let leftPos = e.clientX - tooltipWidth - offset;
  let topPos = e.clientY;

  // Viewport bounds protection
  if (leftPos < 10) {
    // If overflowing left edge of screen, keep within margin
    leftPos = 10;
  }

  // Vertical viewport clamping
  const halfHeight = tooltipHeight / 2;
  if (topPos - halfHeight < 10) {
    topPos = halfHeight + 10;
  } else if (topPos + halfHeight > window.innerHeight - 10) {
    topPos = window.innerHeight - halfHeight - 10;
  }

  tooltip.style.left = `${leftPos}px`;
  tooltip.style.top = `${topPos}px`;
}

/**
 * Simulation Controls UI Listeners & Presets
 */
function initSimulationControls() {
  const presetSelect = document.getElementById('sim-preset-select');
  const sliderRadiation = document.getElementById('slider-radiation');
  const sliderDays = document.getElementById('slider-days');
  const sliderStress = document.getElementById('slider-stress');

  const valDispRad = document.getElementById('disp-slider-radiation');
  const valDispDays = document.getElementById('disp-slider-days');
  const valDispStress = document.getElementById('disp-slider-stress');

  // Live value readouts
  if (sliderRadiation && valDispRad) {
    sliderRadiation.addEventListener('input', (e) => {
      valDispRad.textContent = `${e.target.value} mSv`;
    });
  }

  if (sliderDays && valDispDays) {
    sliderDays.addEventListener('input', (e) => {
      valDispDays.textContent = `${e.target.value} d`;
    });
  }

  if (sliderStress && valDispStress) {
    sliderStress.addEventListener('input', (e) => {
      valDispStress.textContent = `${e.target.value}%`;
    });
  }

  // Preset selector quick adjustments
  if (presetSelect) {
    const presets = {
      'nominal': { rad: 42, days: 120, stress: 24 },
      'eva-high': { rad: 165, days: 180, stress: 58 },
      'solar-storm': { rad: 420, days: 240, stress: 82 },
      'deep-space': { rad: 310, days: 680, stress: 72 },
      'reentry': { rad: 85, days: 420, stress: 65 }
    };

    presetSelect.addEventListener('change', (e) => {
      const p = presets[e.target.value];
      if (!p) return;

      if (sliderRadiation) {
        sliderRadiation.value = p.rad;
        if (valDispRad) valDispRad.textContent = `${p.rad} mSv`;
        sliderRadiation.dispatchEvent(new Event('input'));
      }
      if (sliderDays) {
        sliderDays.value = p.days;
        if (valDispDays) valDispDays.textContent = `${p.days} d`;
        sliderDays.dispatchEvent(new Event('input'));
      }
      if (sliderStress) {
        sliderStress.value = p.stress;
        if (valDispStress) valDispStress.textContent = `${p.stress}%`;
        sliderStress.dispatchEvent(new Event('input'));
      }
    });
  }
}
