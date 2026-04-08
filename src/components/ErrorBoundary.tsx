"use client";

import { Component, ReactNode } from "react";
import Link from "next/link";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
            <svg
              width="48"
              height="48"
              viewBox="0 0 40 40"
              fill="none"
              className="text-[var(--color-stone)]/30 mb-4"
            >
              <path d="M20 4L36 36H4L20 4Z" fill="currentColor" />
            </svg>
            <h2 className="font-display text-xl text-[var(--color-bark)] mb-2">
              Noe gikk galt
            </h2>
            <p className="font-body text-sm text-[var(--color-stone)] mb-4">
              Vi beklager, det oppstod en feil. Prøv igjen.
            </p>
            <Link
              href="/"
              className="px-5 py-2.5 rounded-lg bg-[var(--color-ember)] text-white font-body text-sm font-medium hover:bg-[var(--color-ember-hover)] transition-colors"
            >
              Tilbake til forsiden
            </Link>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
