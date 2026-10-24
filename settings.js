// App settings: settings.json if present (local development, gitignored), otherwise settings.default.json.
// The local file replaces the defaults as a whole, so it must contain every key.

async function fetchJson(file) {
  const res = await fetch(file);
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
  return res.json();
}

export async function loadSettings() {
  try {
    return await fetchJson('settings.json');
  } catch {
    return fetchJson('settings.default.json');
  }
}
