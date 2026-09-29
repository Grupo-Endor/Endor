import type { Metadata } from "next";
import { Mulish, Playfair_Display } from "next/font/google";
import "./globals.css";

const mulish = Mulish({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-mulish",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Diagnóstico de marca gratuito | Ēndor",
  description:
    "Descubre qué le duele a tu marca y qué tan grave es frente a tu competencia. Diagnóstico gratuito en 6 dimensiones por Ēndor.",
  openGraph: {
    title: "Diagnóstico de marca gratuito | Ēndor",
    description:
      "Tienes el mejor producto de tu categoría. Descubre por qué no eres la primera opción.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body
        className={`${mulish.variable} ${playfair.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
