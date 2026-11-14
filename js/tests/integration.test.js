'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { boot } = require('./browser-harness');

test('loaded script order binds cards and both charts to the same initial snapshot', () => {
  const app = boot();
  const state = app.window.NasaTelemetry.getState();
  assert.equal(app.elements.get('val-radiation').textContent, state.radiation.toFixed(3));
  assert.equal(app.instances[0].data.datasets[0].data.at(-1), state.radiationReading);
  assert.equal(app.instances[1].data.datasets[0].data.at(-1), state.hydration);
  assert.equal(app.instances[1].data.datasets[1].data.at(-1), state.metabolism);
  assert.equal(app.instances[0].data.datasets[0].borderColor, '#f87171');
  assert.equal(app.instances[1].data.datasets[0].borderColor, '#38bdf8');
  assert.equal(app.instances[1].data.datasets[1].borderColor, '#818cf8');
  assert.ok(app.elements.get('protocols-container').children.length >= 2);
});

test('presets publish one atomic snapshot and manual controls rebase chart history', () => {
  const app = boot();
  let updates = 0;
  app.document.addEventListener('telemetry:update', () => updates++);
  app.change('sim-preset-select', 'solar-storm', 'change');
  assert.equal(updates, 1, 'no transient states while applying three sliders');
  assert.equal(app.window.NasaTelemetry.getState().radiationRate, 4.2);
  assert.equal(app.elements.get('slider-days').value, 240);
  assert.equal(app.elements.get('status-radiation').textContent, 'CRITICAL');
  assert.ok(app.instances[0].options.scales.y.max >= 1008);
  app.tick();
  const previousDose = app.window.NasaTelemetry.getState().radiation;
  app.tick(30);
  assert.ok(app.window.NasaTelemetry.getState().radiation > previousDose);
  app.change('slider-radiation', 0);
  assert.equal(app.instances[0].data.datasets[0].data.length, 1);
  assert.equal(app.instances[0].data.datasets[0].data[0], 0);
  app.change('slider-radiation', 0, 'change');
  assert.equal(updates, 4, 'change following input is idempotent');
});

test('stream history is bounded, synchronized and lifecycle restart keeps one timer', () => {
  const app = boot();
  let latestHistory;
  app.document.addEventListener('telemetry:update', event => { latestHistory = event.detail.history; });
  const arrays = app.instances.map(chart => [chart.data.labels, ...chart.data.datasets.map(dataset => dataset.data)]);
  for (let i = 0; i < 100; i++) app.tick();
  assert.equal(latestHistory.length, 15);
  for (const [index, chart] of app.instances.entries()) {
    assert.equal(chart.data.labels.length, 15);
    assert.equal(chart.data.labels, arrays[index][0], 'append and shift existing arrays');
    assert.equal(chart.lastUpdateMode, 'none');
    assert.ok(chart.options.scales.x.ticks.maxTicksLimit <= 6);
    assert.ok(chart.data.labels.every(label => /^T-\d+s$/.test(label)));
    assert.equal(chart.data.labels[0], 'T-14s');
    assert.equal(chart.data.labels.at(-1), 'T-0s');
    for (const [datasetIndex, dataset] of chart.data.datasets.entries()) {
      assert.equal(dataset.data.length, 15);
      assert.equal(dataset.data, arrays[index][datasetIndex + 1]);
      assert.equal(dataset.pointRadius, 2);
      assert.equal(dataset.pointHoverRadius, 4);
      assert.equal(dataset.tension, 0.4);
      assert.ok(Math.max(...dataset.data) - Math.min(...dataset.data) > 0.1, 'visible live variation');
    }
  }
  assert.equal(latestHistory[0].elapsedSeconds, 86, 'oldest telemetry samples were discarded');
  app.window.NasaTelemetry.init();
  assert.equal(app.timers.size, 1);
  app.window.dispatchEvent({ type: 'pagehide' });
  assert.equal(app.timers.size, 0);
  app.tick(30);
  app.window.dispatchEvent({ type: 'pageshow' });
  app.window.dispatchEvent({ type: 'pageshow' });
  assert.equal(app.timers.size, 1);
});

test('relative time labels respect delayed ticks and a preset clears existing chart arrays', () => {
  const app = boot();
  app.tick(2);
  app.tick(10);
  assert.deepEqual(Array.from(app.instances[0].data.labels), ['T-12s', 'T-10s', 'T-0s']);
  const labels = app.instances[0].data.labels;
  app.change('sim-preset-select', 'eva-high', 'change');
  assert.equal(app.instances[0].data.labels, labels);
  assert.deepEqual(Array.from(labels), ['T-0s']);
  for (let i = 0; i < 20; i++) app.tick();
  for (const chart of app.instances) {
    for (const dataset of chart.data.datasets) {
      assert.ok(dataset.data.every(value => value >= chart.options.scales.y.min && value <= chart.options.scales.y.max));
    }
  }
});

test('every zone supports hover, tap, keyboard and live tooltip updates', () => {
  const app = boot();
  for (const [id, zone] of app.elements) {
    if (!id.startsWith('zone-')) continue;
    assert.match(zone.dataset.load, /^\d+%$/);
    zone.dispatchEvent({ type: 'mouseenter', clientX: 500, clientY: 400 });
    assert.equal(app.elements.get('tooltip-zone-load').textContent, zone.dataset.load);
    zone.dispatchEvent({ type: 'click', clientX: 500, clientY: 400 });
    assert.ok(zone.classList.contains('is-active'));
    zone.dispatchEvent({ type: 'keydown', key: 'Enter' });
    assert.equal(app.elements.get('silhouette-tooltip').style.display, 'flex');
    app.change('slider-stress', app.elements.get('slider-stress').value === '90' ? 10 : 90);
    assert.equal(app.elements.get('tooltip-zone-load').textContent, zone.dataset.load);
    assert.equal(app.elements.get('tooltip-zone-status').textContent, zone.dataset.status);
  }
  const zone = app.elements.get('zone-head');
  app.window.innerWidth = 375;
  app.window.matchMedia = () => ({ matches: false });
  zone.dispatchEvent({ type: 'click', clientX: 0, clientY: 0 });
  const left = parseInt(app.elements.get('silhouette-tooltip').style.left, 10);
  assert.ok(left >= 10 && left <= 135);
  app.document.dispatchEvent({ type: 'pointerdown', target: app.elements.get('slider-days') });
  assert.equal(app.elements.get('silhouette-tooltip').style.display, 'none');
});

test('protocol acknowledgement survives ticks and recovery removes stale alerts', () => {
  const app = boot();
  app.change('sim-preset-select', 'solar-storm', 'change');
  const container = app.elements.get('protocols-container');
  const button = container.children[0].querySelector('.protocol-action-btn');
  button.dispatchEvent({ type: 'click' });
  assert.equal(button.disabled, true);
  app.tick();
  assert.equal(container.children[0].querySelector('.protocol-action-btn'), button);
  assert.equal(button.disabled, true);
  app.change('sim-preset-select', 'nominal', 'change');
  assert.equal(container.children.length, 2, 'routine card and bounded event log');
  assert.equal(container.children[0].querySelector('.protocol-title').textContent, 'ROUTINE MONITORING');
  const logs = container.children[1].querySelector('.protocol-desc').textContent.split(' • ');
  assert.ok(logs.length <= 8);
});

test('missing Chart.js, optional zones, tooltip and panels do not stop telemetry', () => {
  const app = boot({ charts: false, missing: ['zone-arms-left', 'zone-legs-right', 'protocols-container',
    'silhouette-tooltip', 'tooltip-zone-load', 'chart-radiation'] });
  const previous = app.window.NasaTelemetry.getState().radiation;
  app.tick(10);
  assert.ok(app.window.NasaTelemetry.getState().radiation > previous);
  app.elements.get('zone-head').dispatchEvent({ type: 'click' });
  assert.equal(app.instances.length, 0);
});
