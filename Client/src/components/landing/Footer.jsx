import { Link } from 'react-router-dom';
import AILogo from '@/components/layout/AILogo';
import { PrivacySettingsButton } from '@/components/privacy/PrivacyPreferences';
import { getPublicConfig } from '@/lib/public-config';

export function Footer() {
  const business = getPublicConfig();
  return <footer className="px-4 sm:px-6 mt-16 pb-10 mx-auto max-w-[1240px]">
    <div className="rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-6 sm:p-10">
      <Link to="/" className="inline-flex items-center gap-3 font-semibold"><AILogo animated={false} />ResumeTrackerAI</Link>
      <p className="text-sm text-[var(--ink-muted)] mt-4 max-w-xl">AI-assisted resume feedback and version tracking. Review suggestions carefully; scores do not predict hiring decisions.</p>
      <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-6 gap-y-1 mt-5">
        <Link className="min-h-11 inline-flex items-center underline" to="/#features">Features</Link>
        <Link className="min-h-11 inline-flex items-center underline" to="/#how-it-works">How it works</Link>
        <Link className="min-h-11 inline-flex items-center underline" to="/privacy">Privacy</Link>
        <Link className="min-h-11 inline-flex items-center underline" to="/terms">Terms</Link>
        <Link className="min-h-11 inline-flex items-center underline" to="/cookies">Cookies</Link>
        <PrivacySettingsButton />
      </nav>
      {business.businessName && <address className="not-italic mt-5 text-sm space-y-1">
        <p>{business.businessName}{business.country ? ' · ' + business.country : ''}</p>
        {business.address && <p>{business.address}</p>}
        {business.contactEmail && <a className="underline" href={'mailto:' + business.contactEmail}>{business.contactEmail}</a>}
      </address>}
    </div>
  </footer>;
}
