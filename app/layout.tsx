import type { Metadata } from "next";
import { Mulish } from "next/font/google";
import "./globals.css";

const mulish = Mulish({
  subsets: ["latin"],
  // Marca: Mulish sin weight 700
  weight: ["300", "400", "500", "600", "800"],
  variable: "--font-mulish",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Diagnóstico de marca gratuito | Ēndor",
  description:
    "Descubre qué le duele a tu marca, qué tan grave es y dónde quedas frente a quien te quita clientes. Con evidencia, no con opiniones.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${mulish.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
