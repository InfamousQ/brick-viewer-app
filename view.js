// View: all DOM reading and writing. Turns the filter controls into a state object and renders results.

// Rows rendered at a time. Building tens of thousands of list items at once freezes the page.
const PAGE_SIZE = 200;

const statusEl = document.getElementById('status');
const listEl = document.getElementById('parts');
const moreEl = document.getElementById('more');
const categoriesEl = document.getElementById('categories');
const colorsEl = document.getElementById('colors');
const filterEl = document.getElementById('filter');

// What renderParts last showed, so "Show more" can append the next page.
let current = { matches: [], catalog: null, shown: 0 };

function swatch(color) {
  const el = document.createElement('span');
  el.className = color.is_trans ? 'swatch trans' : 'swatch';
  el.style.setProperty('--c', '#' + color.rgb);
  el.title = color.name;
  return el;
}

function partItem(index, catalog) {
  const part = catalog.parts[index];
  const li = document.createElement('li');
  const num = document.createElement('span');
  num.className = 'part-num';
  num.textContent = part.part_num;
  const name = document.createElement('span');
  name.className = 'name';
  name.textContent = part.name;
  const swatches = document.createElement('span');
  swatches.className = 'swatches';
  for (const id of catalog.partColors[index]) {
    // A pair may reference a color unknown to this catalog version; skip its swatch.
    if (catalog.colors.has(id)) swatches.append(swatch(catalog.colors.get(id)));
  }
  li.append(num, name, swatches);
  return li;
}

function appendPage() {
  const { matches, catalog, shown } = current;
  const next = matches.slice(shown, shown + PAGE_SIZE);
  listEl.append(...next.map(i => partItem(i, catalog)));
  current.shown += next.length;

  const total = matches.length;
  statusEl.textContent = current.shown < total ? `Showing ${current.shown} of ${total} parts` : `${total} parts`;
  moreEl.hidden = current.shown >= total;
}

export function renderCategoryOptions(categories) {
  for (const category of categories) {
    const label = document.createElement('label');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.value = category.id;
    const count = document.createElement('span');
    count.className = 'count';
    count.textContent = category.count;
    label.append(box, category.name, count);
    categoriesEl.append(label);
  }
}

export function renderColorOptions(colors) {
  for (const color of colors) {
    const label = document.createElement('label');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.value = color.id;
    label.append(box, swatch(color), color.name);
    colorsEl.append(label);
  }
}

// The current filter state, read from the controls. See filterParts for its shape.
export function readState() {
  return {
    categories: [...categoriesEl.querySelectorAll('input:checked')].map(box => Number(box.value)),
    colors: [...colorsEl.querySelectorAll('input:checked')].map(box => Number(box.value)),
    match: filterEl.querySelector('input[name="match"]:checked').value,
  };
}

// Calls callback with the new state whenever a filter control changes.
export function onStateChange(callback) {
  filterEl.addEventListener('change', () => callback(readState()));
}

// Replaces the list with the first page of matches (indices into catalog.parts).
export function renderParts(matches, catalog) {
  current = { matches, catalog, shown: 0 };
  listEl.replaceChildren();
  appendPage();
}

export function showError(message) {
  statusEl.textContent = message;
  moreEl.hidden = true;
}

moreEl.addEventListener('click', appendPage);
