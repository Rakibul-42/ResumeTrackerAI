import { Link } from 'react-router-dom';
export default function NotFound() {
  return <main id="main-content" tabIndex={-1} className="min-h-screen grid place-content-center gap-5 p-6 text-center">
    <p className="text-[var(--ink-muted)]">404</p>
    <h1 className="text-3xl font-semibold">Page not found</h1>
    <p>The link may be outdated or the address may be incorrect.</p>
    <Link to="/" className="underline underline-offset-4">Return to the home page</Link>
  </main>;
}
