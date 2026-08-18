import type {
  Metadata,
  Viewport,
} from "next";

import PWARegister from "./components/pwa-register";

import {
  DM_Serif_Display,
  Outfit,
  JetBrains_Mono,
} from "next/font/google";

import "./globals.css";


const dmSerif =
  DM_Serif_Display({
    weight: "400",
    subsets: ["latin"],
    variable:
      "--font-heading",
  });


const outfit =
  Outfit({
    subsets: ["latin"],
    variable:
      "--font-body",
  });


const jetbrains =
  JetBrains_Mono({
    weight: ["300", "400", "500", "700"],
    subsets: ["latin"],
    variable:
      "--font-mono",
  });


export const metadata: Metadata = {
  title: "Scholara",
  description:
    "Student Management Platform",

  applicationName: "Scholara",
};


export const viewport: Viewport = {
  themeColor: "#e6a000",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">

      <body
        className={`
          ${dmSerif.variable}
          ${outfit.variable}
          ${jetbrains.variable}
        `}
      >

        <PWARegister />

        {children}

      </body>

    </html>
  );
}