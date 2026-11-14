/** Illustrative simulation alerts; acknowledgement never performs medical actions. */
(function () {
  'use strict';

  const ranks = { nominal: 0, elevated: 1, warning: 2, critical: 3 };
  function evaluateProtocols(state) {
    const protocols = [];
    function add(id, title, status, description) {
      if (status === 'NOMINAL') return;
      protocols.push({ id, title, severity: status.toLowerCase(), description });
    }
    add('radiation', 'RADIATION EXPOSURE ALERT', state.statuses.radiation,
      `Simulated dose ${state.radiation.toFixed(3)} mSv at ${state.radiationRate.toFixed(2)} mSv/day. `
      + 'Review shielding and dosimetry; suspend exposed activities during elevated flux.');
    add('heart', 'CARDIOVASCULAR LOAD', state.statuses.heartRate,
      `Heart rate ${state.heartRate.toFixed(0)} BPM. Reduce physical workload and review recovery telemetry.`);
    add('bone', 'MUSCULOSKELETAL MONITORING', state.statuses.boneMass,
      `Estimated bone density ${state.boneMass.toFixed(1)}% on mission day ${state.missionDays.toFixed(0)}. `
      + 'Review the resistance exercise schedule and mission countermeasures.');
    add('stress', 'COGNITIVE RECOVERY', state.statuses.stress,
      `Stress index ${state.stress.toFixed(0)}%. Schedule rest and review task load with mission support.`);
    const hydrationStatus = state.hydration < 70 ? 'CRITICAL' : state.hydration < 80 ? 'WARNING'
      : state.hydration < 88 ? 'ELEVATED' : 'NOMINAL';
    add('hydration', 'HYDRATION & METABOLIC RECOVERY', hydrationStatus,
      `Hydration ${state.hydration.toFixed(1)}%; metabolism ${state.metabolism.toFixed(1)}%. `
      + 'Review fluid balance and recovery requirements before further exertion.');
    const strainedZones = Object.entries(state.zones).filter(([, zone]) => zone.load >= 75);
    if (strainedZones.length) {
      add('thermal', 'REGIONAL LOAD ALERT', strainedZones.some(([, zone]) => zone.load >= 90) ? 'CRITICAL' : 'WARNING',
        `High simulated load: ${strainedZones.map(([id, zone]) => `${id.replace('zone-', '')} ${zone.load}%`).join(', ')}. `
        + 'Reduce local strain and inspect the affected sensor zones.');
    }
    protocols.sort((a, b) => ranks[b.severity] - ranks[a.severity]);
    if (!protocols.length) protocols.push({ id: 'routine', title: 'ROUTINE MONITORING', severity: 'nominal',
      description: 'Simulation indicators are within baseline bands. Continue scheduled monitoring and exercise.' });
    return protocols;
  }

  const cards = new Map();
  const logs = [];
  let previous = new Map();
  let logElement = null;

  function element(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function log(message) {
    logs.unshift(`${new Date().toISOString().slice(11, 19)} UTC — ${message}`);
    if (logs.length > 8) logs.pop();
    if (logElement) logElement.textContent = logs.join(' • ');
  }

  function renderProtocols(container, protocols) {
    const active = new Set(protocols.map(item => item.id));
    cards.forEach((card, id) => {
      if (!active.has(id)) { card.root.remove(); cards.delete(id); }
    });
    protocols.forEach(protocol => {
      let card = cards.get(protocol.id);
      if (!card) {
        const root = element('div', 'protocol-card');
        const head = element('div', 'protocol-card-head');
        const title = element('span', 'protocol-title', protocol.title);
        const badge = element('span', 'protocol-badge');
        const description = element('p', 'protocol-desc');
        const button = element('button', 'protocol-action-btn', 'ACKNOWLEDGE SIMULATION ALERT');
        button.type = 'button';
        head.append(title, badge);
        root.append(head, description, button);
        card = { root, badge, description, button, severity: null };
        cards.set(protocol.id, card);
        button.addEventListener('click', () => {
          button.disabled = true;
          button.textContent = 'ACKNOWLEDGED // SIMULATION ONLY';
          log(`Acknowledged: ${protocol.title}. Monitoring remains active.`);
        });
      }
      card.root.className = `protocol-card ${protocol.severity === 'critical' ? 'p-crit'
        : protocol.severity === 'nominal' ? 'p-nom' : 'p-warn'}`;
      card.badge.className = `protocol-badge status-${protocol.severity}`;
      card.badge.textContent = protocol.severity.toUpperCase();
      card.description.textContent = protocol.description;
      card.button.hidden = protocol.id === 'routine';
      if (card.severity !== protocol.severity) {
        card.button.disabled = false;
        card.button.textContent = 'ACKNOWLEDGE SIMULATION ALERT';
        card.severity = protocol.severity;
      }
      // Avoid replacing focused buttons on each telemetry tick.
      const currentIndex = Array.from(container.children).indexOf(card.root);
      const desiredIndex = protocols.indexOf(protocol);
      if (currentIndex !== desiredIndex) container.insertBefore(card.root, container.children[desiredIndex] || null);
    });
  }

  function init() {
    const container = document.getElementById('protocols-container');
    if (!container) return;
    container.replaceChildren();
    const logCard = element('div', 'protocol-card p-nom');
    logCard.append(element('span', 'protocol-title', 'SIMULATION EVENT LOG'));
    logElement = element('p', 'protocol-desc');
    logCard.append(logElement);
    container.append(logCard);
    log('Demonstration model; illustrative thresholds, not clinical or flight telemetry.');
    document.addEventListener('telemetry:update', event => {
      const protocols = evaluateProtocols(event.detail.state);
      const next = new Map(protocols.map(item => [item.id, item.severity]));
      protocols.forEach(item => {
        if (previous.get(item.id) !== item.severity) log(`${item.title}: ${item.severity.toUpperCase()}`);
      });
      previous.forEach((severity, id) => {
        if (!next.has(id)) log(`${id.toUpperCase()}: returned to baseline.`);
      });
      if (event.detail.reason === 'preset') log(`Scenario selected: ${event.detail.state.preset}.`);
      previous = next;
      renderProtocols(container, protocols);
    });
    // telemetry.js registers its ready handler first; replay its initial snapshot.
    const state = window.NasaTelemetry?.getState();
    if (state) {
      const protocols = evaluateProtocols(state);
      previous = new Map(protocols.map(item => [item.id, item.severity]));
      renderProtocols(container, protocols);
    }
  }

  window.NasaProtocols = Object.freeze({ evaluateProtocols });
  document.addEventListener('DOMContentLoaded', init);
})();
