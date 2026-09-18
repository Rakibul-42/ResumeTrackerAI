import { Link, useLocation } from 'react-router-dom';
import content from '../../../shared/public-site.json';
import { Footer } from '@/components/landing/Footer';
import { getPublicConfig } from '@/lib/public-config';
import { PrivacySettingsButton } from '@/components/privacy/PrivacyPreferences';

export default function Legal({ slug }) {
  const location = useLocation();
  const key = slug || location.pathname.slice(1);
  const policy = content.policies[key];
  const config = getPublicConfig();
  return <div className="min-h-screen bg-[var(--bg)]">
    <a href="#main-content" className="skip-link">Skip to content</a>
    <header className="max-w-4xl mx-auto p-5"><Link className="underline min-h-11 inline-flex items-center" to="/">Back to ResumeTrackerAI</Link></header>
    <main id="main-content" tabIndex={-1} className="max-w-4xl mx-auto px-5 py-6 space-y-8 break-words">
      <h1 className="text-3xl sm:text-4xl font-display font-semibold">{policy.title}</h1>
      {!config.policiesReady && <p role="note" className="border border-current rounded-xl p-4 text-sm">Draft policy — service-owner details and jurisdiction-specific review are required before public launch.</p>}
      <p className="text-sm text-[var(--ink-muted)]">Version {content.termsVersion}</p>
      {config.businessName && <section className="space-y-2"><h2 className="text-xl font-semibold">Service operator</h2><p>{config.businessName}{config.country ? ` (${config.country})` : ''}</p>{config.contactEmail && <a className="underline" href={`mailto:${config.contactEmail}`}>{config.contactEmail}</a>}</section>}
      {policy.sections.map(section => <section key={section.title} className="space-y-3"><h2 className="text-xl font-semibold">{section.title}</h2><p className="leading-relaxed text-[var(--ink-muted)]">{section.text}</p></section>)}
      {key === 'cookies' && <PrivacySettingsButton />}
    </main>
    <Footer />
  </div>;
}
