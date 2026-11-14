'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

class Events {
  constructor() { this.listeners = new Map(); }
  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(listener);
  }
  dispatchEvent(event) {
    event.target ||= this;
    event.stopPropagation ||= () => {};
    event.preventDefault ||= () => {};
    for (const listener of this.listeners.get(event.type) || []) listener(event);
  }
}

class Element extends Events {
  constructor(id = '', className = '') {
    super();
    this.id = id;
    this.className = className;
    this.children = [];
    this.dataset = {};
    this.style = {};
    this.attributes = {};
    this.value = '';
    this.textContent = '';
    this.classList = {
      contains: name => this.className.split(' ').includes(name),
      add: name => { if (!this.classList.contains(name)) this.className += ` ${name}`; },
      remove: name => { this.className = this.className.split(' ').filter(item => item !== name).join(' '); },
      toggle: (name, force) => force ? this.classList.add(name) : this.classList.remove(name)
    };
  }
  append(...nodes) { nodes.forEach(node => this.insertBefore(node, null)); }
  insertBefore(node, reference) {
    node.remove();
    const index = reference ? this.children.indexOf(reference) : this.children.length;
    this.children.splice(index, 0, node);
    node.parentElement = this;
  }
  remove() {
    if (this.parentElement) {
      const list = this.parentElement.children;
      list.splice(list.indexOf(this), 1);
      this.parentElement = null;
    }
  }
  replaceChildren(...nodes) {
    [...this.children].forEach(node => node.remove());
    this.append(...nodes);
  }
  matches(selector) {
    return selector.startsWith('#') ? this.id === selector.slice(1)
      : selector.startsWith('.') ? this.classList.contains(selector.slice(1)) : false;
  }
  closest(selector) { return this.matches(selector) ? this : this.parentElement?.closest(selector) || null; }
  querySelectorAll(selector) {
    return this.children.flatMap(child => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]);
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  getAttribute(name) {
    if (name.startsWith('data-')) return this.dataset[name.slice(5).replace(/-([a-z])/g, (_, x) => x.toUpperCase())];
    return this.attributes[name];
  }
  setAttribute(name, value) { this.attributes[name] = value; }
  getBoundingClientRect() { return { left: 100, top: 100, right: 140, width: 40, height: 40 }; }
  getContext() { return { createLinearGradient: () => ({ addColorStop() {} }) }; }
}

function boot({ charts = true, missing = [] } = {}) {
  const document = new Events();
  const elements = new Map();
  const add = (id, classes = '') => {
    const node = new Element(id, classes);
    elements.set(id, node);
    return node;
  };
  const html = fs.readFileSync(path.join(__dirname, '../../index.html'), 'utf8');
  for (const match of html.matchAll(/id="([^"]+)"/g)) add(match[1]);
  document.getElementById = id => elements.get(id) || null;
  document.querySelectorAll = selector => [...elements.values()].filter(node => node.matches(selector));
  document.createElement = () => new Element();
  elements.forEach((node, id) => {
    if (id.startsWith('zone-')) {
      node.className = 'heat-zone';
      node.dataset.zoneName = id.toUpperCase();
    }
  });
  for (const name of ['heart-rate', 'radiation', 'bone-mass', 'stress']) {
    const card = new Element('', 'vital-card');
    card.append(elements.get(`val-${name}`), new Element('', 'vital-unit'), new Element('', 'vital-bar-fill'));
    elements.get(`status-${name}`).className = 'vital-status-pill status-nominal';
  }
  for (const [id, value] of Object.entries({ 'sim-preset-select': 'nominal', 'slider-radiation': '42',
    'slider-days': '120', 'slider-stress': '24' })) elements.get(id).value = value;
  missing.forEach(id => elements.delete(id));
  const window = new Events();
  window.innerWidth = 1280;
  window.innerHeight = 900;
  window.matchMedia = () => ({ matches: true });
  const timers = new Map();
  let timerId = 0;
  let now = 1000000;
  window.setInterval = callback => { timers.set(++timerId, callback); return timerId; };
  window.clearInterval = id => timers.delete(id);
  class Clock extends Date { static now() { return now; } }
  const instances = [];
  class Chart {
    static defaults = { font: {} };
    constructor(context, config) {
      this.data = config.data;
      this.options = config.options;
      this.updates = 0;
      instances.push(this);
    }
    update() { this.updates++; }
  }
  const context = vm.createContext({ document, window, console, Date: Clock,
    Event: class { constructor(type) { this.type = type; } },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
    ...(charts ? { Chart } : {}) });
  for (const file of ['charts.js', 'telemetry.js', 'protocols.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context, { filename: file });
  }
  document.dispatchEvent({ type: 'DOMContentLoaded' });
  return { document, window, elements, instances, timers,
    tick(seconds = 1) { now += seconds * 1000; [...timers.values()].forEach(callback => callback()); },
    change(id, value, type = 'input') {
      const element = elements.get(id);
      element.value = String(value);
      element.dispatchEvent({ type });
    }
  };
}

module.exports = { boot };
