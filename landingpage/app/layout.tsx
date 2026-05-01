import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const repo = "https://github.com/lucaskaiut/horus";

export const metadata: Metadata = {
  title: "Horus — plataforma de logs",
  description:
    "Coleta, indexação e consulta de logs com API Laravel, interface Next.js e OpenSearch. Ingestão assíncrona, dashboard e listagem com filtros.",
  openGraph: {
    title: "Horus",
    description: "Plataforma de coleta e consulta de logs para equipes que precisam de visibilidade operacional.",
    type: "website",
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  alternates: { canonical: "/" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} scroll-smooth`}>
      <body className="min-h-dvh antialiased">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-foreground focus:px-3 focus:py-2 focus:text-background"
        >
          Ir para o conteúdo
        </a>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Horus",
              applicationCategory: "DeveloperApplication",
              operatingSystem: "Servidor",
              description:
                "Sistema de ingestão e consulta de logs com API REST, painel web e motor de busca OpenSearch.",
              url: process.env.NEXT_PUBLIC_SITE_URL ?? undefined,
              codeRepository: repo,
            }),
          }}
        />
      </body>
    </html>
  );
}
