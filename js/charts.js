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
          borderColor: '#f87171',
          borderWidth: 2,
          backgroundColor: gradient,
          fill: true,
          tension: 0.35,
          pointBackgroundColor: '#f87171',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1.5,
          pointRadius: 4,
          pointHoverRadius: 6,
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
            font: {
              family: "'JetBrains Mono', monospace",
              size: 11,
              weight: 500
            }
          }
        },
        y: {
          min: 0,
          max: 0.8,
          grid: {
            color: 'rgba(148, 163, 184, 0.08)',
            tickColor: 'rgba(148, 163, 184, 0.16)'
          },
          ticks: {
            color: '#94a3b8',
            stepSize: 0.2,
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
          borderColor: '#38bdf8',
          borderWidth: 2,
          backgroundColor: gradientSky,
          fill: true,
          tension: 0.35,
          pointBackgroundColor: '#38bdf8',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1.5,
          pointRadius: 4,
          pointHoverRadius: 6,
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
          tension: 0.3,
          pointBackgroundColor: '#818cf8',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1,
          pointRadius: 3,
          pointHoverRadius: 5
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
            font: {
              family: "'JetBrains Mono', monospace",
              size: 11,
              weight: 500
            }
          }
        },
        y: {
          min: 60,
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
  const zones = Array.from(document.querySelectorAll('.heat-zone, .heat-zone-div'));

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
    updateTooltipContent(zone);
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
        if (tooltip) tooltip.style.display = 'none';
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
    if (!e.target.closest('.heat-zone, .heat-zone-div') && !e.target.closest('#silhouette-tooltip')) {
      if (tooltip) {
        tooltip.style.display = 'none';
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

/**
 * Dynamically update biometric zone status, load, and temperature
 * @param {string} zoneId - ID of the zone element (e.g. 'zone-head')
 * @param {string} status - 'NOMINAL', 'OPTIMAL', 'ELEVATED', 'WARNING', 'CRITICAL', etc.
 * @param {string} [load] - Load percentage (e.g. '45%')
 * @param {string} [temp] - Temperature (e.g. '37.2 °C')
 */
window.updateZoneStatus = function(zoneId, status, load, temp) {
  const el = document.getElementById(zoneId);
  if (!el) return;
  const upper = (status || 'NOMINAL').toUpperCase();
  el.setAttribute('data-status', upper);
  if (load) el.setAttribute('data-load', load);
  if (temp) el.setAttribute('data-temp', temp);

  // Sync state classes cleanly
  el.classList.remove('optimal', 'normal', 'status-nominal', 'zone-blue', 'zone-green',
                      'elevated', 'strain', 'warning', 'status-elevated', 'status-warning', 'zone-yellow', 'zone-orange',
                      'critical', 'alert', 'status-critical', 'zone-red');

  if (upper === 'NOMINAL' || upper === 'OPTIMAL' || upper === 'NORMAL') {
    el.classList.add('status-nominal', 'optimal');
  } else if (upper === 'ELEVATED' || upper === 'STRAIN' || upper === 'WARNING') {
    el.classList.add('status-warning', 'warning');
  } else if (upper === 'CRITICAL' || upper === 'ALERT') {
    el.classList.add('status-critical', 'critical');
  }
};