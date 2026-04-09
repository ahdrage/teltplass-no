import type { Metadata } from "next";
import "./globals.css";
import { ConvexClientProvider } from "../components/ConvexClientProvider";
import { Fathom } from "../components/Fathom";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { ErrorBoundary } from "../components/ErrorBoundary";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://teltplass.no";

export const metadata: Metadata = {
  title: {
    default: "Teltplass.no - Finn teltplasser i hele Norge",
    template: "%s | Teltplass.no",
  },
  description:
    "Teltplass gir deg oversikten over de beste teltplassene i Norge. Vet du om en perle? Legg den gjerne inn!",
  openGraph: {
    title: "Teltplass.no - Finn teltplasser i hele Norge",
    siteName: "Teltplass.no",
    description:
      "Teltplass gir deg oversikten over de beste teltplassene i Norge. Vet du om en perle? Legg den gjerne inn!",
    type: "website",
    locale: "nb_NO",
    url: siteUrl,
    images: [
      {
        url: `${siteUrl}/teltplass.webp`,
        width: 1200,
        height: 630,
        alt: "Teltplass.no - Finn teltplasser i hele Norge",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Teltplass.no - Finn teltplasser i hele Norge",
    description:
      "Teltplass gir deg oversikten over de beste teltplassene i Norge. Vet du om en perle? Legg den gjerne inn!",
    images: [`${siteUrl}/teltplass.webp`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="no">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Source+Sans+3:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Fathom />
        <ConvexClientProvider>
          <Header />
          <main className="min-h-screen">
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
          <Footer />
        </ConvexClientProvider>
      </body>
    </html>
  );
}
