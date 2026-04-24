import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  Great_Vibes,
  Plus_Jakarta_Sans,
} from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant-garamond",
  subsets: ["latin"],
});

const greatVibes = Great_Vibes({
  variable: "--font-great-vibes",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EverAfter Notes | Wedding Digital Guestbook",
  description:
    "A romantic wedding digital guestbook where guests leave blessings, memories, and love notes for the couple.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      data-theme="man2"
      className={`${plusJakartaSans.variable} ${cormorantGaramond.variable} ${greatVibes.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
