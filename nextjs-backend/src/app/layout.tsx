import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Keyboard Backend",
  description: "API backend for AI Keyboard application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
