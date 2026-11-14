/**
 * Demonstration telemetry model, not a clinical model or NASA flight data.
 * Rates, coefficients and alert bands are illustrative simulation parameters.
 * Radiation slider units: one step = 0.01 mSv/day. Dose = rate * mission days.
 * One wall-clock second = one mission second; controls rebase the scenario.
 */
(function () {
  'use strict';

  const presets = Object.freeze({
    nominal: Object.freeze({ radiation: 42, days: 120, stress: 24, physicalLoad: 0.2 }),
    'eva-high': Object.freeze({ radiation: 165, days: 180, stress: 58, physicalLoad: 0.9 }),
    'solar-storm': Object.freeze({ radiation: 420, days: 240, stress: 82, physicalLoad: 0.35 }),
    'deep-space': Object.freeze({ radiation: 310, days: 680, stress: 72, physicalLoad: 0.25 }),
    reentry: Object.freeze({ radiation: 85, days: 420, stress: 65, physicalLoad: 0.8 })
  });
  const statusNames = ['NOMINAL', 'ELEVATED', 'WARNING', 'CRITICAL'];
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  function number(value, fallback, min, max) {
    const numeric = value === '' || value == null ? NaN : Number(value);
    return clamp(Number.isFinite(numeric) ? numeric : fallback, min, max);
  }
  function band(value, elevated, warning, critical) {
    return statusNames[value >= critical ? 3 : value >= warning ? 2 : value >= elevated ? 1 : 0];
  }

  // Smooth seeded noise: reproducible sensor drift, without independent jumps each tick.
  function sensorNoise(seconds, seed) {
    const position = seconds / 3;
    const index = Math.floor(position);
    const fraction = position - index;
    const blend = fraction * fraction * (3 - 2 * fraction);
    const random = step => {
      const value = Math.sin(step * 127.1 + seed * 311.7) * 43758.5453;
      return (value - Math.floor(value)) * 2 - 1;
    };
    return random(index) * (1 - blend) + random(index + 1) * blend;
  }

  function calculateBiometrics(inputs = {}, elapsedSeconds = 0) {
    const preset = Object.prototype.hasOwnProperty.call(presets, inputs.preset) ? inputs.preset : 'nominal';
    const defaults = presets[preset];
    const radiationRate = number(inputs.radiation, defaults.radiation, 0, 500) / 100;
    const days = number(inputs.days, defaults.days, 1, 1000);
    const elapsed = number(elapsedSeconds, 0, 0, Number.MAX_SAFE_INTEGER);
    const missionDays = days + elapsed / 86400;
    const physicalLoad = number(inputs.physicalLoad, defaults.physicalLoad, 0, 1);
    const isolation = Math.min(12, missionDays / 60);
    const wave = Math.sin(elapsed / 8) * 1.2 + Math.sin(elapsed / 23) * 0.5;
    const stress = clamp(number(inputs.stress, defaults.stress, 0, 100)
      + physicalLoad * 10 + isolation + radiationRate * 2 + wave, 0, 100);
    const heartRate = clamp(60 + physicalLoad * 42 + stress * 0.24 + wave, 45, 190);
    const radiation = radiationRate * missionDays;
    // Sensor readout may fluctuate (< 1%); true accumulated dose never decreases.
    const radiationReading = radiation * (1 + Math.min(1, elapsed / 3)
      * (0.006 * Math.sin(elapsed / 3.5) + 0.002 * sensorNoise(elapsed, 1)));
    // Moderate exercise mitigates loss; very high load adds short-term strain.
    const exerciseBenefit = Math.min(physicalLoad, 0.5) * 0.018;
    const boneMass = clamp(100 - missionDays * (0.025 - exerciseBenefit)
      - Math.max(0, physicalLoad - 0.6) * 2, 50, 100);
    const hydration = clamp(98 - physicalLoad * 19 - stress * 0.1
      - Math.min(6, missionDays / 200) + 1.1 * Math.sin(elapsed / 3.8)
      + 0.15 * sensorNoise(elapsed, 2), 40, 100);
    const metabolism = clamp(59 + physicalLoad * 30 + stress * 0.15
      + 1.3 * Math.sin(elapsed / 4.7) + 0.18 * sensorNoise(elapsed, 3), 0, 100);
    const boneStrain = (100 - boneMass) * 2;
    const radiationStrain = Math.min(30, radiation / 25 + radiationRate * 2);
    const loads = {
      'zone-head': stress * 0.75 + radiationStrain * 0.5,
      'zone-chest': (heartRate - 50) * 0.85 + physicalLoad * 10,
      'zone-abdomen': (100 - hydration) * 1.8 + radiationStrain,
      'zone-knees': boneStrain + physicalLoad * 58,
      'zone-arms-left': physicalLoad * 65 + stress * 0.12 + boneStrain * 0.2,
      'zone-arms-right': physicalLoad * 68 + stress * 0.12 + boneStrain * 0.2,
      'zone-hips-left': boneStrain + physicalLoad * 40,
      'zone-hips-right': boneStrain + physicalLoad * 43,
      'zone-legs-left': boneStrain * 0.8 + physicalLoad * 55,
      'zone-legs-right': boneStrain * 0.8 + physicalLoad * 58
    };
    const zones = {};
    Object.entries(loads).forEach(([id, rawLoad]) => {
      const load = Math.round(clamp(rawLoad, 0, 100));
      zones[id] = { load, temperature: 36.3 + load * 0.025, status: band(load, 50, 75, 90) };
    });
    return {
      preset, days, missionDays, elapsedSeconds: elapsed, physicalLoad,
      heartRate, radiationRate, radiation, radiationReading, boneMass, stress, hydration, metabolism, zones,
      statuses: {
        heartRate: band(heartRate, 100, 120, 145),
        radiation: statusNames[Math.max(statusNames.indexOf(band(radiation, 100, 250, 500)),
          statusNames.indexOf(band(radiationRate, 1, 2, 4)))],
        boneMass: band(100 - boneMass, 5, 10, 20),
        stress: band(stress, 40, 65, 85)
      }
    };
  }

  let initialized = false;
  let timer = null;
  let origin = 0;
  let inputs = {};
  let state = null;
  let history = [];
  let lastStress = null;
  const get = id => document.getElementById(id);

  function setText(id, value) {
    const element = get(id);
    if (element) element.textContent = value;
  }

  function setStatus(element, status, text = status) {
    if (!element) return;
    statusNames.forEach(name => element.classList.remove(`status-${name.toLowerCase()}`));
    element.classList.add(`status-${status.toLowerCase()}`);
    element.textContent = text;
  }

  function renderState() {
    const metrics = [
      ['heart-rate', state.heartRate.toFixed(0), state.statuses.heartRate, state.heartRate / 190 * 100],
      ['radiation', state.radiation.toFixed(3), state.statuses.radiation, state.radiation / 500 * 100],
      ['bone-mass', state.boneMass.toFixed(1), state.statuses.boneMass, state.boneMass],
      ['stress', state.stress.toFixed(0), state.statuses.stress, state.stress]
    ];
    metrics.forEach(([id, value, status, percent]) => {
      setText(`val-${id}`, value);
      const nominal = id === 'bone-mass' ? 'STABLE' : id === 'stress' ? 'LOW' : 'NOMINAL';
      setStatus(get(`status-${id}`), status, status === 'NOMINAL' ? nominal : status);
      const card = get(`val-${id}`)?.closest('.vital-card');
      const bar = card?.querySelector('.vital-bar-fill');
      if (bar) {
        bar.style.width = `${clamp(percent, 0, 100)}%`;
        bar.classList.toggle('warn', status === 'WARNING' || status === 'CRITICAL');
      }
      // The static mockup used a rate unit; this card reports accumulated dose.
      if (id === 'radiation') {
        const unit = card?.querySelector('.vital-unit');
        if (unit) unit.textContent = 'mSv';
      }
    });
    Object.entries(state.zones).forEach(([id, zone]) => {
      const element = get(id);
      if (!element) return;
      element.dataset.load = `${zone.load}%`;
      element.dataset.temp = `${zone.temperature.toFixed(1)} °C`;
      element.dataset.status = zone.status;
      element.setAttribute('aria-label', `${element.dataset.zoneName || id}: ${zone.load}%, ${zone.status}`);
    });
  }

  function publish(reason) {
    state = calculateBiometrics(inputs, Math.max(0, (Date.now() - origin) / 1000));
    history.push({ elapsedSeconds: state.elapsedSeconds, radiation: state.radiationReading,
      hydration: state.hydration, metabolism: state.metabolism });
    if (history.length > 15) history.shift();
    renderState();
    document.dispatchEvent(new CustomEvent('telemetry:update', {
      detail: { state, history: history.slice(), reason }
    }));
  }

  function readControls(reason) {
    const selected = get('sim-preset-select')?.value;
    const preset = Object.prototype.hasOwnProperty.call(presets, selected) ? selected : 'nominal';
    const defaults = presets[preset];
    inputs = { preset,
      radiation: number(get('slider-radiation')?.value, defaults.radiation, 0, 500),
      days: number(get('slider-days')?.value, defaults.days, 1, 1000),
      stress: number(get('slider-stress')?.value, defaults.stress, 0, 100) };
    setText('disp-slider-radiation', `${(inputs.radiation / 100).toFixed(2)} mSv/d`);
    setText('disp-slider-days', `${inputs.days} d`);
    setText('disp-slider-stress', `${inputs.stress}%`);
    // A change after an input event must not reset the running scenario twice.
    if (reason !== 'init' && state && state.preset === inputs.preset
        && state.days === inputs.days && state.radiationRate === inputs.radiation / 100
        && lastStress === inputs.stress) return;
    lastStress = inputs.stress;
    origin = Date.now();
    history = [];
    publish(reason);
  }

  function stop() {
    if (timer !== null) window.clearInterval(timer);
    timer = null;
  }

  function start() {
    if (!initialized || timer !== null) return;
    timer = window.setInterval(() => publish('tick'), 1000);
  }

  function init() {
    if (initialized) return;
    initialized = true;
    ['slider-radiation', 'slider-days', 'slider-stress'].forEach(id => {
      const slider = get(id);
      if (!slider) return;
      ['input', 'change'].forEach(type => slider.addEventListener(type, () => readControls('input')));
    });
    const selector = get('sim-preset-select');
    if (selector) {
      ['input', 'change'].forEach(type => selector.addEventListener(type, () => {
        const selected = presets[selector.value];
        if (!selected) return;
        ['radiation', 'days', 'stress'].forEach(key => {
          const slider = get(`slider-${key}`);
          if (slider) slider.value = selected[key];
        });
        readControls('preset');
      }));
    }
    readControls('init');
    start();
    window.addEventListener('pagehide', stop);
    window.addEventListener('pageshow', () => {
      if (timer === null) { publish('tick'); start(); }
    });
  }

  window.NasaTelemetry = Object.freeze({ presets, calculateBiometrics, init, start, stop,
    getState: () => state && JSON.parse(JSON.stringify(state)) });
  document.addEventListener('DOMContentLoaded', init);
})();
