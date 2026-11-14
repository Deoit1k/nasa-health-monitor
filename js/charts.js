/**
 * NASA BIOMEDICAL TELEMETRY CORE
 * UI Charts & Interactive Body Silhouette Tooltip
 * Uses Chart.js (CDN)
 */

document.addEventListener('DOMContentLoaded', () => {
  initCharts();
  initSilhouetteInteraction();
  initEcgSparkline();
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

  // If telemetry state is already initialized, populate initial curves immediately
  if (window.NasaTelemetry && typeof window.NasaTelemetry.getState === 'function') {
    const currentState = window.NasaTelemetry.getState();
    if (currentState) {
      document.dispatchEvent(new CustomEvent('telemetry:update', {
        detail: {
          state: currentState,
          history: [{
            elapsedSeconds: currentState.elapsedSeconds || 0,
            radiation: currentState.radiationReading || currentState.radiation || 0.42,
            hydration: currentState.hydration || 88,
            metabolism: currentState.metabolism || 72
          }],
          reason: 'init'
        }
      }));
    }
  }
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
  gradient.addColorStop(0, 'rgba(248, 113, 113, 0.28)');
  gradient.addColorStop(0.5, 'rgba(248, 113, 113, 0.10)');
  gradient.addColorStop(1, 'rgba(248, 113, 113, 0.0)');

  const labels = ['T-60s', 'T-50s', 'T-40s', 'T-30s', 'T-20s', 'T-10s', 'LIVE'];
  const data = [0.38, 0.39, 0.40, 0.41, 0.42, 0.42, 0.42];

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
          pointRadius: 2.5,
          pointHoverRadius: 5,
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
            label: (context) => `RAD DOSE: ${Number(context.parsed.y).toFixed(3)} mSv`
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
            callback: (val) => Number(val).toFixed(2)
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
  gradientSky.addColorStop(0, 'rgba(56, 189, 248, 0.28)');
  gradientSky.addColorStop(0.5, 'rgba(56, 189, 248, 0.08)');
  gradientSky.addColorStop(1, 'rgba(56, 189, 248, 0.0)');

  const labels = ['T-60s', 'T-50s', 'T-40s', 'T-30s', 'T-20s', 'T-10s', 'LIVE'];
  const hydrationData = [92, 91, 90, 89, 89, 88, 88];
  const metabolismData = [68, 69, 70, 71, 71, 72, 72];

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
          pointRadius: 2.5,
          pointHoverRadius: 5,
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
  const zones = Array.from(document.querySelectorAll('.heat-zone, .heat-zone-div'));
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
    if (!e.target.closest('.heat-zone, .heat-zone-div') && !e.target.closest('#silhouette-tooltip')) {
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

  // Sync ECG Sparkline with current heart rate and status
  if (state && typeof state.heartRate === 'number') {
    updateEcgState(state.heartRate, state.statuses?.heartRate || 'NOMINAL');
  }
});

/**
 * Live Continuous Scrolling ECG Waveform Sparkline
 */
let currentBpm = 72;
let currentHeartStatus = 'NOMINAL';

function updateEcgState(bpm, status) {
  if (typeof bpm === 'number' && !isNaN(bpm)) {
    currentBpm = bpm;
  }
  if (status) {
    currentHeartStatus = status;
  }
}

function initEcgSparkline() {
  const canvas = document.getElementById('ecg-sparkline');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let animationFrameId = null;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = rect.width || 220;
    const h = rect.height || 26;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }

  window.addEventListener('resize', resize);
  resize();

  // ECG P-QRS-T voltage model: phase in [0, 1)
  function ecgVoltage(phase) {
    // Baseline is 0
    // P wave: atrial depolarization
    if (phase > 0.12 && phase < 0.22) {
      const p = (phase - 0.17) / 0.05;
      return 0.18 * Math.exp(-p * p * 3.5);
    }
    // PR segment slight delay: 0.22 - 0.32
    // Q dip
    if (phase >= 0.32 && phase < 0.35) {
      return -0.15 * Math.sin(((phase - 0.32) / 0.03) * Math.PI);
    }
    // R peak: sharp ventricular depolarization
    if (phase >= 0.35 && phase < 0.40) {
      const r = (phase - 0.375) / 0.025;
      return 1.0 * Math.exp(-r * r * 4.5);
    }
    // S dip
    if (phase >= 0.40 && phase < 0.44) {
      return -0.28 * Math.sin(((phase - 0.40) / 0.04) * Math.PI);
    }
    // ST segment
    // T wave: ventricular repolarization
    if (phase > 0.50 && phase < 0.68) {
      const t = (phase - 0.59) / 0.09;
      return 0.28 * Math.exp(-t * t * 3.0);
    }
    // Baseline with micro-vibrations
    return 0;
  }

  let phaseAccumulator = 0;
  let lastTime = performance.now();

  function draw(now) {
    const dt = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;

    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 220;
    const height = rect.height || 26;
    const midY = height * 0.52;
    const amp = height * 0.42;

    // Advance cardiac phase based on current BPM (beats per second)
    const beatsPerSec = Math.max(0.5, currentBpm / 60);
    phaseAccumulator += dt * beatsPerSec;

    // Select stroke color based on status threshold
    let strokeColor = '#00ffaa'; // emerald cyan neon
    let glowColor = 'rgba(0, 255, 170, 0.45)';

    if (currentHeartStatus === 'CRITICAL' || currentBpm >= 140 || currentBpm <= 45) {
      strokeColor = '#ff3355'; // vivid crimson
      glowColor = 'rgba(255, 51, 85, 0.55)';
    } else if (currentHeartStatus === 'WARNING' || currentHeartStatus === 'ELEVATED' || currentBpm >= 105) {
      strokeColor = '#ffaa00'; // vivid amber
      glowColor = 'rgba(255, 170, 0, 0.55)';
    }

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Subtle faint cardiac grid guides
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(width, midY);
    ctx.stroke();

    // Render continuous moving trace across full width
    // Lead pulse beam sweeps across or scrolls
    // 1.8 beats span the canvas width
    const beatsOnScreen = 1.6;
    ctx.beginPath();
    ctx.lineWidth = 1.75;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowBlur = 6;
    ctx.shadowColor = glowColor;

    for (let x = 0; x <= width; x += 1.5) {
      const xRatio = x / width;
      // Phase at this x coordinate
      const phase = (phaseAccumulator + (xRatio * beatsOnScreen)) % 1.0;
      const v = ecgVoltage(phase);
      const y = midY - v * amp;

      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    // Trailing glow gradient stroke
    const grad = ctx.createLinearGradient(0, 0, width, 0);
    grad.addColorStop(0, 'rgba(0, 255, 170, 0.2)');
    grad.addColorStop(0.3, strokeColor);
    grad.addColorStop(1, strokeColor);

    ctx.strokeStyle = (strokeColor === '#00ffaa') ? grad : strokeColor;
    ctx.stroke();

    // Leading glowing scan point at right edge
    const leadPhase = (phaseAccumulator + beatsOnScreen) % 1.0;
    const leadY = midY - ecgVoltage(leadPhase) * amp;
    ctx.beginPath();
    ctx.arc(width - 2, leadY, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 8;
    ctx.shadowColor = strokeColor;
    ctx.fill();

    animationFrameId = requestAnimationFrame(draw);
  }

  animationFrameId = requestAnimationFrame(draw);
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
