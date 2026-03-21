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
		<body className="min-h-screen bg-[#0a0a0a] text-[#f5f5f0]">
			<div
				aria-hidden="true"
				className="fixed left-0 top-0 z-50 h-[3px] w-full bg-[#D3FD50]"
			/>
			{children}
		</body>
    </html>
  );
}
