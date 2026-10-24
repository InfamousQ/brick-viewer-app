// Catalog data: fetches the catalog files and builds the lookup structures the filter and view use.

// File URLs come from settings (settings.default.json, or a local settings.json).
// TEMPORARY: the defaults are unpinned URLs on the catalog repo's main branch.
// The real pinning mechanism (bundle vs fetch) is still open, see docs/catalog-integration.md.

// Fetches a catalog file and maps its rows to objects by column name.
async function rows(urls, file) {
  if (!urls[file]) throw new Error(`settings: no URL for catalog file "${file}"`);
  const res = await fetch(urls[file]);
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
  const data = await res.json();
  if (data.format !== 1) throw new Error(`${file}: unsupported format ${data.format}`);
  return data.rows.map(row => Object.fromEntries(data.columns.map((col, i) => [col, row[i]])));
}

// urls: the "catalog" object from settings, catalog file name (without .json) → URL.
// Returns the loaded catalog:
// - parts: part rows in catalog order. Filter results are indices into this array.
// - partColors: aligned with parts; a Set of the color ids each part comes in.
// - colors: Map of color id to color row.
// - usedColors: color rows that at least one part comes in, in catalog order.
// - usedCategories: category rows that at least one part is in, with `count` (number of parts), sorted by name.
export async function loadCatalog(urls) {
  const [parts, colorRows, pairs, categoryRows] = await Promise.all([
    rows(urls, 'parts'), rows(urls, 'colors'), rows(urls, 'part_colors'), rows(urls, 'categories'),
  ]);

  const colorsByPart = new Map();
  for (const { part_num, color_id } of pairs) {
    if (!colorsByPart.has(part_num)) colorsByPart.set(part_num, new Set());
    colorsByPart.get(part_num).add(color_id);
  }
  const partColors = parts.map(part => colorsByPart.get(part.part_num) ?? new Set());

  const usedColorIds = new Set(pairs.map(p => p.color_id));

  const partsPerCategory = new Map();
  for (const part of parts) {
    partsPerCategory.set(part.category_id, (partsPerCategory.get(part.category_id) ?? 0) + 1);
  }
  const usedCategories = categoryRows
    .filter(c => partsPerCategory.has(c.id))
    .map(c => ({ ...c, count: partsPerCategory.get(c.id) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'en'));

  return {
    parts,
    partColors,
    colors: new Map(colorRows.map(c => [c.id, c])),
    usedColors: colorRows.filter(c => usedColorIds.has(c.id)),
    usedCategories,
  };
}
