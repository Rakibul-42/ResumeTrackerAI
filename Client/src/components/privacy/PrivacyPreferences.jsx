import { useEffect, useState } from 'react';
import { browserStorage, readPreferences, savePreferences } from '@/lib/preferences';
import { Button } from '@/components/ui/Button';

export function PrivacyPreferences() {
  const [open, setOpen] = useState(() => readPreferences() === null);
  const [message, setMessage] = useState('');
  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener('privacy:open', show);
    return () => window.removeEventListener('privacy:open', show);
  }, []);
  function choose(optional) {
    savePreferences(browserStorage(), optional);
    window.dispatchEvent(new Event('privacy:changed'));
    setOpen(false);
    setMessage(optional ? 'Preference storage allowed.' : 'Only necessary storage is enabled.');
  }
  return <>
    <span className="sr-only" role="status">{message}</span>
    {open && <section aria-labelledby="privacy-choice-title" className="fixed bottom-3 inset-x-3 z-[60] mx-auto max-w-2xl rounded-2xl bg-[var(--surface)] text-[var(--ink)] border border-[var(--border)] p-4 shadow-hover">
      <h2 id="privacy-choice-title" className="text-base font-semibold">Your storage preferences</h2>
      <p className="text-sm mt-1 text-[var(--ink-muted)]">Sign-in uses a necessary session cookie. With your permission, this browser can also remember your theme and notification preferences. No advertising or visitor-analytics trackers are enabled.</p>
      <div className="flex flex-wrap gap-3 mt-3 items-center">
        <Button onClick={() => choose(false)}>Necessary only</Button>
        <Button onClick={() => choose(true)}>Allow preferences</Button>
        <a className="underline text-sm min-h-11 inline-flex items-center" href="/cookies">Cookie policy</a>
      </div>
    </section>}
  </>;
}

export function PrivacySettingsButton() {
  return <button type="button" className="text-sm underline min-h-11" onClick={() => window.dispatchEvent(new Event('privacy:open'))}>Storage preferences</button>;
}
