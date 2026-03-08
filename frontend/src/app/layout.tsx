import type { Metadata } from "next";
import "./globals.css";
import SettingsModal from "@/components/settings/SettingsModal";

export const metadata: Metadata = {
  title: "BrandMind — AI Designer",
  description: "Your AI designer that follows brand guidelines to the letter.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SettingsModal />
        {children}
      </body>
    </html>
  );
}
