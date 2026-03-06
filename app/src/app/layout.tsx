import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Second Me Academy — Digital Twin & Avatar Builder",
  description:
    "Build your digital twin or custom avatar. Create scroll-stopping content and turn attention into income using AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#0a0a0a] text-white">
        {children}
      </body>
    </html>
  );
}
