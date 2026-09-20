export default function SectionTitle({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return <div className="max-w-2xl"><div className="eyebrow mb-3">{eyebrow}</div><h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>{description && <p className="muted mt-4 text-base leading-7 sm:text-lg">{description}</p>}</div>;
}
