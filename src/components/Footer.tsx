"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";

export function Footer() {
  return (
    <>
      {/* Pre-footer: Newsletter + Donation */}
      <section className="bg-[var(--color-sand)] py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-[var(--color-cloud)] rounded-2xl border border-[var(--color-stone)]/15 p-8">
              <h3 className="font-display text-2xl text-[var(--color-bark)] mb-3">
                Hold deg oppdatert
              </h3>
              <p className="font-body text-sm text-[var(--color-stone)] mb-6 leading-relaxed">
                Meld deg på vårt nyhetsbrev og bli den første som får beskjed om nye teltplasser.
              </p>
              <NewsletterForm />
            </div>

            <div className="bg-[var(--color-ember)] rounded-2xl p-8 text-white">
              <h3 className="font-display text-2xl mb-3">
                Kjøp oss en kaffe
              </h3>
              <p className="font-body text-sm text-white/80 mb-6 leading-relaxed">
                Hjelp med å finansiere prosjektet og kjøp oss en kaffe.
              </p>
              <p className="font-display text-3xl md:text-4xl">
                VIPPS til 746539
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[var(--color-night)] topo-bg-dark text-[var(--color-sand)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-3 gap-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <svg width="24" height="22" viewBox="0 0 365 330" fill="none">
                  <path d="M182.457031,0.6796875 L363.539062,328.21875 L0.68359375,328.21875 L182.457031,0.6796875 Z M182.311865,95.4492188 L76.8680962,285.449219 L130.500568,285.449219 L153.403134,248.254918 L175.980438,285.449219 L287.35456,285.449219 L182.311865,95.4492188 Z" fill="currentColor" fillRule="evenodd" />
                </svg>
                <span className="font-display text-lg">Teltplass</span>
              </div>
              <p className="font-body text-sm text-[var(--color-stone)] leading-relaxed">
                Finn de beste teltplassene i hele Norge. Delt av friluftsfolk, for friluftsfolk.
              </p>
            </div>

            <div>
              <h3 className="font-display text-base mb-4">Utforsk</h3>
              <nav className="flex flex-col gap-2">
                <FooterLink href="/kart">Kart</FooterLink>
                <FooterLink href="/sok">Søk</FooterLink>
                <FooterLink href="/ny">Legg til teltplass</FooterLink>
              </nav>
            </div>

            <div>
              <h3 className="font-display text-base mb-4">Kontakt</h3>
              <p className="font-body text-sm text-[var(--color-stone)]">
                hei@teltplass.no
              </p>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-[var(--color-stone)]/20 text-center">
            <p className="font-body text-xs text-[var(--color-stone)]">
              &copy; {new Date().getFullYear()} Teltplass.no — Laget med kjærlighet for naturen
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="font-body text-sm text-[var(--color-stone)] hover:text-[var(--color-sand)] transition-colors"
    >
      {children}
    </Link>
  );
}

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const subscribe = useMutation(api.newsletter.subscribe);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    await subscribe({ email });
    setSubmitted(true);
    setEmail("");
  }

  if (submitted) {
    return (
      <p className="font-body text-sm text-[var(--color-moss)]">
        Takk! Du er nå påmeldt.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Din e-postadresse"
        required
        className="flex-1 px-4 py-2.5 rounded-lg bg-white border border-[var(--color-stone)]/20 text-[var(--color-bark)] placeholder:text-[var(--color-stone)] font-body text-sm focus:outline-none focus:border-[var(--color-ember)] transition-colors"
      />
      <button
        type="submit"
        className="px-5 py-2.5 rounded-lg bg-[var(--color-bark)] text-white font-body text-sm font-medium hover:bg-[var(--color-bark)]/90 transition-colors"
      >
        Abonner
      </button>
    </form>
  );
}
