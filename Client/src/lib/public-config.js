export function getPublicConfig() {
  try {
    if (typeof document === 'undefined') return {};
    return JSON.parse(document.getElementById('public-config')?.textContent || '{}');
  } catch { return {}; }
}
