import type { Metadata } from "next";
import "./globals.css";
import { ConvexClientProvider } from "../components/ConvexClientProvider";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { ErrorBoundary } from "../components/ErrorBoundary";

export const metadata: Metadata = {
  title: {
    default: "Teltplass.no - Finn teltplasser i hele Norge",
    template: "%s | Teltplass.no",
  },
  description:
    "Finn de beste teltplassene i hele Norge. Delt av friluftsfolk, for friluftsfolk.",
  openGraph: {
    title: "Teltplass.no - Finn teltplasser i hele Norge",
    description: "Utforsk over 130 teltplasser over hele Norge.",
    type: "website",
    locale: "nb_NO",
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
