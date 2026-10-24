// Entry point: wires the catalog, the filter and the view together.
// Every control change produces a whole state object: state → filterParts → renderParts.
import { loadSettings } from './settings.js';
import { loadCatalog } from './catalog.js';
import { filterParts } from './filter.js';
import * as view from './view.js';

async function main() {
  const settings = await loadSettings();
  const catalog = await loadCatalog(settings.catalog);
  view.renderCategoryOptions(catalog.usedCategories);
  view.renderColorOptions(catalog.usedColors);

  const update = state => view.renderParts(filterParts(state, catalog), catalog);
  view.onStateChange(update);
  update(view.readState());
}

main().catch(err => view.showError(`Failed to load catalog: ${err.message}`));
