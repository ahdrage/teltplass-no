export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-3">
        <svg
          width="40"
          height="40"
          viewBox="0 0 40 40"
          fill="none"
          className="text-[var(--color-stone)]/30 animate-pulse"
        >
          <path d="M20 4L36 36H4L20 4Z" fill="currentColor" />
        </svg>
        <p className="font-body text-sm text-[var(--color-stone)]">
          Laster...
        </p>
      </div>
    </div>
  );
}
