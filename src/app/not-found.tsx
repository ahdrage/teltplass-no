import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
      <svg
        width="64"
        height="64"
        viewBox="0 0 40 40"
        fill="none"
        className="text-[var(--color-stone)]/20 mb-6"
      >
        <path d="M20 4L36 36H4L20 4Z" fill="currentColor" />
      </svg>
      <h1 className="font-display text-4xl text-[var(--color-bark)] mb-3">
        404
      </h1>
      <p className="font-body text-[var(--color-stone)] mb-6">
        Siden du leter etter finnes ikke.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-lg bg-[var(--color-ember)] text-white font-body font-semibold text-sm hover:bg-[var(--color-ember-hover)] transition-colors"
      >
        Tilbake til forsiden
      </Link>
    </div>
  );
}
