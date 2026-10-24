// Filtering: a pure function from filter state to matching parts.
// No DOM access, so it can move into a Web Worker if profiling ever shows filtering is slow.

// state: { categories: category ids, colors: color ids, match: 'any' | 'all' }
// A part matches if it is in any of the categories (or none are chosen) and its colors match.
// Returns the indices into catalog.parts of the matching parts, in catalog order.
export function filterParts(state, catalog) {
  const { colors, match } = state;
  const categories = new Set(state.categories);
  const matches = [];
  catalog.partColors.forEach((available, i) => {
    if (categories.size > 0 && !categories.has(catalog.parts[i].category_id)) return;
    if (colors.length === 0
      || (match === 'all' ? colors.every(id => available.has(id)) : colors.some(id => available.has(id)))) {
      matches.push(i);
    }
  });
  return matches;
}
