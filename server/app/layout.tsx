import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Happy Vibe Server",
  description: "AI-powered coding server platform",
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
