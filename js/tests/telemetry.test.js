'use strict';

// Run with: node --test js/tests/*.test.js (no installed dependencies).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadModel() {
  const context = vm.createContext({ window: {}, document: { addEventListener() {} } });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../telemetry.js'), 'utf8'), context);
  return context.window.NasaTelemetry;
}

test('accumulated dose uses mSv/day and actual elapsed seconds', () => {
  const model = loadModel();
  assert.ok(model, 'telemetry API is available');
  const input = { preset: 'nominal', radiation: 42, days: 120, stress: 24 };
  const initial = model.calculateBiometrics(input);
  const later = model.calculateBiometrics(input, 86400);
  assert.equal(initial.radiationRate, 0.42);
  assert.ok(Math.abs(initial.radiation - 50.4) < 1e-9);
  assert.ok(Math.abs(later.radiation - initial.radiation - 0.42) < 1e-9);
  assert.ok(later.boneMass < initial.boneMass);
});

test('duration, radiation, stress and physical load change consistent biometrics', () => {
  const model = loadModel();
  assert.ok(model, 'telemetry API is available');
  const base = { preset: 'nominal', radiation: 42, days: 120, stress: 24 };
  const normal = model.calculateBiometrics(base);
  const long = model.calculateBiometrics({ ...base, days: 680 });
  const stressed = model.calculateBiometrics({ ...base, stress: 90 });
  const eva = model.calculateBiometrics({ ...base, preset: 'eva-high' });
  const storm = model.calculateBiometrics({ ...base, radiation: 420 });
  assert.ok(long.boneMass < normal.boneMass);
  assert.ok(long.radiation > normal.radiation);
  assert.ok(stressed.heartRate > normal.heartRate);
  assert.ok(stressed.stress > normal.stress);
  assert.ok(eva.heartRate > normal.heartRate);
  assert.ok(eva.hydration < normal.hydration);
  assert.ok(eva.metabolism > normal.metabolism);
  assert.equal(storm.statuses.radiation, 'CRITICAL');
  assert.equal(Object.keys(normal.zones).length, 10);
  assert.ok(eva.zones['zone-arms-left'].load > normal.zones['zone-arms-left'].load);
});

test('model sanitizes invalid inputs, bounds percentages and remains deterministic', () => {
  const model = loadModel();
  assert.ok(model, 'telemetry API is available');
  for (const preset of Object.keys(model.presets)) {
    for (const input of [{}, { radiation: -1, days: -50, stress: -10 },
      { radiation: Infinity, days: NaN, stress: 'invalid' },
      { radiation: 99999, days: 99999, stress: 99999 }]) {
      const state = model.calculateBiometrics({ ...input, preset }, 1000);
      for (const key of ['heartRate', 'radiation', 'boneMass', 'stress', 'hydration', 'metabolism']) {
        assert.ok(Number.isFinite(state[key]), key);
      }
      for (const key of ['boneMass', 'stress', 'hydration', 'metabolism']) {
        assert.ok(state[key] >= 0 && state[key] <= 100, key);
      }
      for (const zone of Object.values(state.zones)) {
        assert.ok(zone.load >= 0 && zone.load <= 100);
        assert.ok(Number.isFinite(zone.temperature));
      }
    }
  }
  assert.deepEqual(model.calculateBiometrics({}), model.calculateBiometrics({}));
  assert.equal(model.calculateBiometrics({ radiation: 0 }).radiation, 0);
});

test('protocol rules prioritize hazards and clear when baseline is restored', () => {
  const context = vm.createContext({ window: {}, document: { addEventListener() {} } });
  for (const file of ['telemetry.js', 'protocols.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
  }
  assert.ok(context.window.NasaProtocols, 'protocol API is available');
  const model = context.window.NasaTelemetry;
  const engine = context.window.NasaProtocols;
  const storm = model.calculateBiometrics({ preset: 'solar-storm', radiation: 420, days: 240, stress: 82 });
  const protocols = engine.evaluateProtocols(storm);
  assert.equal(protocols[0].id, 'radiation');
  assert.equal(protocols[0].severity, 'critical');
  assert.ok(protocols.some(item => item.id === 'stress'));
  const extended = model.calculateBiometrics({ preset: 'deep-space' });
  assert.ok(engine.evaluateProtocols(extended).some(item => item.id === 'bone'));
  const baseline = engine.evaluateProtocols(model.calculateBiometrics({ radiation: 0, days: 1, stress: 0 }));
  assert.equal(baseline.length, 1);
  assert.equal(baseline[0].id, 'routine');
});

test('sensor microvariation stays bounded while accumulated dose remains monotonic', () => {
  const model = loadModel();
  for (const [preset, defaults] of Object.entries(model.presets)) {
    const inputs = { preset, ...defaults };
    const samples = Array.from({ length: 120 }, (_, second) => model.calculateBiometrics(inputs, second));
    for (const [index, state] of samples.entries()) {
      assert.ok(Number.isFinite(state.radiationReading));
      assert.ok(Math.abs(state.radiationReading - state.radiation) <= state.radiation * 0.01);
      if (index) assert.ok(state.radiation >= samples[index - 1].radiation);
    }
    for (const key of ['radiationReading', 'hydration', 'metabolism']) {
      const values = samples.map(state => state[key]);
      assert.ok(Math.max(...values) - Math.min(...values) > 0.1, `${preset}: ${key}`);
    }
    assert.deepEqual(model.calculateBiometrics(inputs, 8.5), model.calculateBiometrics(inputs, 8.5));
  }
  assert.equal(model.calculateBiometrics({ radiation: 0 }, 30).radiationReading, 0);
});
