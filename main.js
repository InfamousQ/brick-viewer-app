// TEMPORARY: unpinned fetch from the catalog repo's main branch.
// The real pinning mechanism (bundle vs fetch) is still open, see docs/catalog-integration.md.
const CATALOG_URL = 'https://raw.githubusercontent.com/InfamousQ/brick-viewer-catalog/main/data/';

const statusEl = document.getElementById('status');
const listEl = document.getElementById('parts');
const colorsEl = document.getElementById('colors');
const filterEl = document.getElementById('filter');

// Fetches a catalog file and maps its rows to objects by column name.
async function rows(file) {
  const res = await fetch(CATALOG_URL + file);
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
  const data = await res.json();
  if (data.format !== 1) throw new Error(`${file}: unsupported format ${data.format}`);
  return data.rows.map(row => Object.fromEntries(data.columns.map((col, i) => [col, row[i]])));
}

function swatch(color) {
  const el = document.createElement('span');
  el.className = color.is_trans ? 'swatch trans' : 'swatch';
  el.style.setProperty('--c', '#' + color.rgb);
  el.title = color.name;
  return el;
}

async function main() {
  const [parts, colorRows, pairs] = await Promise.all([
    rows('parts.json'), rows('colors.json'), rows('part_colors.json'),
  ]);

  const colors = new Map(colorRows.map(c => [c.id, c]));
  const partColors = new Map();
  for (const { part_num, color_id } of pairs) {
    if (!partColors.has(part_num)) partColors.set(part_num, new Set());
    partColors.get(part_num).add(color_id);
  }

  // Filter offers only colors that some part comes in.
  const usedColorIds = new Set(pairs.map(p => p.color_id));
  for (const color of colorRows) {
    if (!usedColorIds.has(color.id)) continue;
    const label = document.createElement('label');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.value = color.id;
    label.append(box, swatch(color), color.name);
    colorsEl.append(label);
  }

  function render() {
    const selected = [...colorsEl.querySelectorAll('input:checked')].map(b => Number(b.value));
    const matchAll = filterEl.querySelector('input[name="match"]:checked').value === 'all';

    const shown = parts.filter(part => {
      if (selected.length === 0) return true;
      const available = partColors.get(part.part_num) ?? new Set();
      return matchAll ? selected.every(id => available.has(id)) : selected.some(id => available.has(id));
    });

    listEl.replaceChildren(...shown.map(part => {
      const li = document.createElement('li');
      const num = document.createElement('span');
      num.className = 'part-num';
      num.textContent = part.part_num;
      const name = document.createElement('span');
      name.className = 'name';
      name.textContent = part.name;
      const swatches = document.createElement('span');
      swatches.className = 'swatches';
      for (const id of partColors.get(part.part_num) ?? []) {
        // A pair may reference a color unknown to this catalog version; skip its swatch.
        if (colors.has(id)) swatches.append(swatch(colors.get(id)));
      }
      li.append(num, name, swatches);
      return li;
    }));
    statusEl.textContent = `${shown.length} parts`;
  }

  filterEl.addEventListener('change', render);
  render();
}

main().catch(err => {
  statusEl.textContent = `Failed to load catalog: ${err.message}`;
});
