import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { PwaBootstrap } from "../components/pwa-bootstrap";

export const metadata: Metadata = {
  title: "One Gourmet PH Inventory",
  description: "Centralized F&B Inventory & Costing System",
  manifest: "/manifest.webmanifest"
};

export default function RootLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <html lang="en">
      <body>
        <PwaBootstrap />
        {children}
      </body>
    </html>
  );
}
