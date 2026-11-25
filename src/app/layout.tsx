import type { Metadata, Viewport } from "next";
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

export const metadata: Metadata = {
  title: {
    default: "Mini CRM",
    template: "%s · Mini CRM",
  },
  description:
    "Gestiona tus clientes y tus oportunidades de venta con un embudo por etapas.",
};

/**
 * viewportFit "cover": la página ocupa toda la pantalla también bajo la muesca
 * y la barra de inicio del móvil, y env(safe-area-inset-*) devuelve sus
 * medidas. La cabecera y la barra inferior fijas las usan para no quedar
 * tapadas (y el body, para los lados en horizontal).
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-fondo font-sans text-texto">
        {children}
      </body>
    </html>
  );
}
