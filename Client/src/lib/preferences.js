const CHOICE_KEY = 'arr-privacy-choice';
const OPTIONAL_KEYS = ['arr-theme', 'arr-notif-last-seen'];

export function browserStorage() {
  try { return typeof window === 'undefined' ? undefined : window.localStorage; }
  catch { return undefined; }
}

export function readPreferences(storage = browserStorage()) {
  try {
    const choice = JSON.parse(storage?.getItem(CHOICE_KEY) || 'null');
    return choice?.version === 1 && typeof choice.optional === 'boolean' ? choice.optional : null;
  } catch { return null; }
}

export function savePreferences(storage, optional) {
  try {
    if (!optional) OPTIONAL_KEYS.forEach(key => storage?.removeItem(key));
    storage?.setItem(CHOICE_KEY, JSON.stringify({ version: 1, optional: optional === true }));
  } catch { /* Storage can be disabled. The UI remains usable without persistence. */ }
}

export function readOptional(storage, key) {
  if (!OPTIONAL_KEYS.includes(key) || readPreferences(storage) !== true) return null;
  try { return storage?.getItem(key) ?? null; } catch { return null; }
}

export function writeOptional(storage, key, value) {
  if (!OPTIONAL_KEYS.includes(key) || readPreferences(storage) !== true) return;
  try { storage?.setItem(key, value); } catch { /* Optional preference only. */ }
}
