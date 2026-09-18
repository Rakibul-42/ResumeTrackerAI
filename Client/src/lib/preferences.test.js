import { test } from 'node:test';
import assert from 'node:assert/strict';

// Catch accidental preference writes before permission and overly broad cleanup.
const storage = () => {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
};
test('optional persistence is off until chosen, and revocation removes only optional app data', async () => {
  const module = await import('./preferences.js');
  const local = storage();
  assert.equal(module.readPreferences(local), null);
  module.writeOptional(local, 'arr-theme', 'light');
  assert.equal(local.getItem('arr-theme'), null);
  local.setItem('unrelated-key', 'keep');
  module.savePreferences(local, true);
  module.writeOptional(local, 'arr-theme', 'light');
  assert.equal(module.readOptional(local, 'arr-theme'), 'light');
  module.savePreferences(local, false);
  assert.equal(local.getItem('arr-theme'), null);
  assert.equal(module.readPreferences(local), false);
  assert.equal(local.getItem('unrelated-key'), 'keep');
});
test('malformed, outdated, or inaccessible browser storage is treated as no permission', async () => {
  const module = await import('./preferences.js');
  const local = storage();
  for (const value of ['not-json', '{"version":0,"optional":true}', '{"version":1,"optional":"yes"}']) {
    local.setItem('arr-privacy-choice', value);
    assert.equal(module.readPreferences(local), null);
  }
  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() { throw new Error('blocked'); } };
  assert.equal(module.readOptional(blocked, 'arr-theme'), null);
  assert.doesNotThrow(() => module.savePreferences(blocked, false));
});
