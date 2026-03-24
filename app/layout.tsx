import "./globals.css";
import type { Metadata } from "next";
import React from "react";
import BackgroundMusic from "./components/BackgroundMusic";
import UiClickSoundProvider from "./components/UiClickSoundProvider";

export const metadata: Metadata = {
  title: "Soma AI Web Player",
  description: "Next.js wrapper that serves the Unity WebGL Soma AI build.",
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <BackgroundMusic />
        <UiClickSoundProvider />
        {children}
      </body>
    </html>
  );
}




