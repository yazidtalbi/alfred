const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]);
for (const script of scripts) new vm.Script(script);
const elements = new Map();
function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
}
class Element {
  constructor(id, value = '') {
    this.id = id; this.value = value; this._html = ''; this.textContent = ''; this.style = { setProperty() {} };
    this.handlers = {}; this.dataset = {}; this.hidden = false;
    this.classList = { add() {}, remove() {}, toggle() {}, contains() { return false; } };
  }
  set innerHTML(value) { this._html = value; register(value); }
  get innerHTML() { return this._html; }
  addEventListener(type, handler) { (this.handlers[type] ||= []).push(handler); }
  setAttribute(name, value) { this[name] = value; }
  removeAttribute(name) { delete this[name]; }
  querySelectorAll() { return []; }
  focus() {} scrollIntoView() {} reportValidity() { return true; }
  dispatch(type, event = {}) { for (const handler of this.handlers[type] || []) handler(event); }
}
function register(markup) {
  for (const match of markup.matchAll(/<[a-z][^>]*\bid="[^"]+"[^>]*>/gi)) {
    const attr = attributes(match[0]); if (!elements.has(attr.id)) elements.set(attr.id, new Element(attr.id, attr.value || ''));
  }
  for (const match of markup.matchAll(/<select\b([^>]*)>([\s\S]*?)<\/select>/gi)) {
    const attr = attributes(match[1]); if (!attr.id) continue;
    const options = [...match[2].matchAll(/<option([^>]*)>/g)];
    const selected = options.find(option => /\bselected\b/.test(option[1])) || options[0];
    if (selected) elements.get(attr.id).value = attributes(selected[1]).value || '';
  }
}
register(html.split('<script>')[0]);
const get = id => { assert(elements.has(id), `Unknown element: ${id}`); return elements.get(id); };
const storage = new Map([['legacy-private-workspace', 'private sentinel']]);
const reads = [];
let networkRequests = 0;
const now = Date.parse('2024-06-15T12:00:00Z');
const context = {
  Date: class extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return now; } },
  Intl, URL, URLSearchParams, AbortController, console,
  localStorage: { getItem(key) { reads.push(key); return storage.get(key) || null; }, setItem(key, value) { storage.set(key, value); } },
  document: { getElementById: get, querySelectorAll: () => [], querySelector: () => new Element('selection'), addEventListener() {}, visibilityState: 'visible' },
  window: { addEventListener() {}, scrollTo() {} }, location: { hash: '' },
  setInterval() {}, setTimeout() { return 1; }, clearTimeout() {},
  fetch() { networkRequests++; return Promise.reject(new Error('Network disabled during tests')); },
};
vm.createContext(context);
vm.runInContext(scripts[0], context);
const readState = () => JSON.parse(storage.get('alfred-workspace-v1'));
let state = readState();
assert.deepEqual(reads, ['alfred-workspace-v1']);
assert.equal(storage.get('legacy-private-workspace'), 'private sentinel');
assert.equal(state.projects.length, 1);
assert.equal(state.projects[0].id, 'business');
for (const key of ['tasks', 'notes', 'entries', 'prospects', 'commercialDocuments', 'receivables', 'paymentReceipts', 'incomeLog']) assert.equal(state[key].length, 0, key);
for (const key of ['monthlyIncome', 'incomeHistory', 'incomeGoals']) assert.equal(Object.keys(state[key]).length, 0, key);
assert.equal(state.weatherConfig, undefined);
assert.equal(get('earned-stat').textContent, '$0.00');
assert.equal(networkRequests, 0, 'Fresh workspaces must not request weather for a preset location');
get('new-project-top').dispatch('click');
get('new-project-name').value = 'Example project'; get('new-client').value = 'Example client';
get('billing-model').value = 'hourly'; get('project-rate').value = '50'; get('project-currency').value = 'USD';
get('project-form').dispatch('submit', { preventDefault() {} });
state = readState(); assert.equal(state.projects.length, 2); assert.equal(state.projects[1].rate, 50);
const projectId = state.projects[1].id;
get('projects-list').dispatch('click', { target: { closest: selector => selector === '[data-manual-time]' ? { dataset: { manualTime: projectId } } : null } });
get('manual-day').value = '2024-06-01'; get('manual-start').value = '10:00'; get('manual-hours').value = '1'; get('manual-minutes').value = '30';
get('manual-note').value = 'Example session';
get('manual-time-form').dispatch('submit', { preventDefault() {} });
state = readState(); assert.equal(state.entries.length, 1); assert.equal(state.entries[0].ms, 90 * 60000); assert.equal(state.entries[0].source, 'manual');
assert.equal(get('hourly-earnings').textContent, '$75.00');
vm.runInContext(scripts[0], context);
state = readState(); assert.equal(state.projects.length, 2); assert.equal(state.entries.length, 1);
console.log('Passed: syntax, empty first run, storage isolation, no preset-location requests, project creation, manual time, hourly earnings, and reload persistence.');
