import { SectionHeader } from './FeaturesSection';

const NOTES = [
  { title: 'An estimate, not an employer verdict', text: 'Scores come from an AI review. They do not reproduce a particular employer’s ATS or guarantee an interview.' },
  { title: 'Keep the facts yours', text: 'Review every suggestion. Never add skills, employers, dates or results that are not supported by your experience.' },
  { title: 'Understand where your data goes', text: 'Resume text is processed by Google Gemini. Saved versions and results are stored in the configured database.' },
];

export function TestimonialsSection() {
  return <section className="px-4 sm:px-6 mt-20 mx-auto max-w-[1240px]">
    <SectionHeader eyebrow="Before you begin" title="Useful feedback. Human judgment." sub="What to know before using AI to review a resume." />
    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
      {NOTES.map(note => <article key={note.title} className="rounded-3xl p-6 bg-[var(--surface)] border border-[var(--border)]">
        <h3 className="font-semibold text-lg">{note.title}</h3>
        <p className="text-sm mt-3 leading-relaxed text-[var(--ink-muted)]">{note.text}</p>
      </article>)}
    </div>
  </section>;
}
