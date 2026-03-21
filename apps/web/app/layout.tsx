import "./globals.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Morpheus — From Dream to Deploy",
  description:
    "Convert hand-drawn wireframes to Next.js + Tailwind code using AI and RAG",
  keywords: [
    "wireframe",
    "AI",
    "Next.js",
    "Tailwind",
    "LangChain",
    "code generation"
  ]
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
		<head>
			<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
		</head>
		<body className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)]">
			{children}
		</body>
    </html>
  );
}
