"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const SandpackProvider = dynamic(
	() => import("@codesandbox/sandpack-react").then((m) => m.SandpackProvider),
	{ ssr: false }
);

const SandpackPreview = dynamic(
	() => import("@codesandbox/sandpack-react").then((m) => m.SandpackPreview),
	{ ssr: false }
);

export interface CodeDisplayProps {
	code: string;
	isStreaming: boolean;
	autoShow?: boolean;
}

function cleanCode(raw: string): string {
	let code = raw
		// Strip markdown fences
		.replace(/^```[\w]*\n?/gm, '')
		.replace(/^```$/gm, '')
		// Strip "use client"
		.replace(/^["']use client["']\s*;?\s*/gm, '')
		// Strip import statements
		.replace(/^import\s+.*$/gm, '')
		// Strip export default on its own
		.replace(/^export\s+default\s+(?!function)/gm, '')
		// CRITICAL: Strip stray language tags like "jsx", "tsx", "js"
		// that Groq sometimes outputs as the first line
		.replace(/^(jsx|tsx|js|ts|javascript|typescript)\s*\n/i, '')
		// Strip any line that is ONLY a language word
		.replace(/^(jsx|tsx|js|ts)\s*$/gim, '')
		.trim()

	// Fix truncated code - balance braces
	const openBraces = (code.match(/\{/g) || []).length
	const closeBraces = (code.match(/\}/g) || []).length
	const openParens = (code.match(/\(/g) || []).length
	const closeParens = (code.match(/\)/g) || []).length

	if (closeBraces < openBraces || closeParens < openParens) {
		const missingParens = Math.max(0, openParens - closeParens)
		const missingBraces = Math.max(0, openBraces - closeBraces)
		code = code
			+ '\n'
			+ ')'.repeat(missingParens)
			+ '\n'
			+ '}'.repeat(missingBraces)
	}

	// Ensure default export
	if (!code.includes('export default')) {
		const match = code.match(/function\s+([A-Z][a-zA-Z0-9]*)\s*\(/)
		if (match) {
			code = code + '\nexport default ' + match[1] + ';'
		}
	}

	// Prepend React import for Sandpack classic mode
	const reactImport = "import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';\n\n"
	return reactImport + code
}

export function CodeDisplay({ code, isStreaming, autoShow }: CodeDisplayProps) {
	const [copied, setCopied] = useState<boolean>(false);
	const [showPreview, setShowPreview] = useState<boolean>(false);
	const [previewHeight, setPreviewHeight] = useState("70vh");

	useEffect(() => {
		if (!copied) return;
		const t = window.setTimeout(() => setCopied(false), 2000);
		return () => window.clearTimeout(t);
	}, [copied]);

	useEffect(() => {
		if (autoShow && code.length > 100 && !isStreaming) {
			setShowPreview(true);
		}
	}, [autoShow, code, isStreaming]);

	const cleanedCode = code
		.replace(/^```[\w]*\n?/gm, "")
		.replace(/^```$/gm, "")
		.trim();

	const copyDisabled = code.trim().length === 0;
	const fileName = "component.tsx";

	return (
		<div className="relative flex flex-col">
			{/* Top bar */}
			<div
				className="flex items-center justify-between px-4 py-3"
				style={{
					background: "linear-gradient(to right, #1A1A18, #2A2A28)",
					borderRadius: "12px 12px 0 0"
				}}
			>
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-1.5">
						<div className="h-[12px] w-[12px] rounded-full" style={{ background: "#FF5F57" }} />
						<div className="h-[12px] w-[12px] rounded-full" style={{ background: "#FFBD2E" }} />
						<div className="h-[12px] w-[12px] rounded-full" style={{ background: "#28C840" }} />
					</div>
					<div
						className="ml-2 text-[12px] font-medium"
						style={{ color: "#6B6B63", fontFamily: "monospace" }}
					>
						{fileName}
					</div>
				</div>

				<button
					type="button"
					disabled={copyDisabled}
					onClick={async () => {
						if (copyDisabled) return;
						try {
							await navigator.clipboard.writeText(code);
							setCopied(true);
						} catch {
							// If clipboard is blocked, keep UI stable.
						}
					}}
					className="px-[10px] py-[4px] text-[11px] font-semibold uppercase transition-colors"
					style={{
						border: "1px solid #333",
						background: "transparent",
						color: copied ? "white" : "#9D9D93",
						borderRadius: "4px",
						opacity: copyDisabled ? 0.55 : 1,
						cursor: copyDisabled ? "not-allowed" : "pointer"
					}}
					onMouseEnter={(e) => {
						if (copyDisabled || copied) return;
						e.currentTarget.style.color = "white";
					}}
					onMouseLeave={(e) => {
						if (copyDisabled || copied) return;
						e.currentTarget.style.color = "#9D9D93";
					}}
				>
					{copied ? "COPIED ✓" : "COPY"}
				</button>
			</div>

			{/* Streaming indicator */}
			{isStreaming ? (
				<div className="absolute left-0 right-0 top-[44px] h-[2px] overflow-hidden" aria-hidden="true">
					<div className="stream-bar h-full w-1/3" style={{ background: "#7C3AED" }} />
				</div>
			) : null}

			{/* Code block */}
			<div>
				<SyntaxHighlighter
					language="tsx"
					style={vscDarkPlus}
					showLineNumbers
					customStyle={{
						background: "#1E1E1E",
						border: "none",
						borderRadius: showPreview ? "0" : "0 0 12px 12px",
						fontSize: "13px",
						fontFamily: '"Fira Code", "Cascadia Code", monospace',
						minHeight: "300px",
						maxHeight: "280px",
						overflowY: "auto",
						margin: 0
					}}
				>
					{cleanedCode.length > 0 ? cleanedCode : ""}
				</SyntaxHighlighter>
			</div>

			{/* Preview Toggle */}
			<button
				type="button"
				onClick={() => setShowPreview((prev) => !prev)}
				className="mt-[12px] w-full transition-colors"
				style={{
					padding: "10px 20px",
					fontSize: "14px",
					fontWeight: "600",
					border: showPreview ? "1px solid rgba(124, 58, 237, 0.3)" : "1px solid #E4E4DF",
					background: showPreview ? "rgba(124, 58, 237, 0.08)" : "white",
					color: showPreview ? "#7C3AED" : "#6B6B63",
					borderRadius: "8px"
				}}
				onMouseEnter={(e) => {
					if (!showPreview) {
						e.currentTarget.style.borderColor = "#7C3AED";
						e.currentTarget.style.color = "#7C3AED";
					}
				}}
				onMouseLeave={(e) => {
					if (!showPreview) {
						e.currentTarget.style.borderColor = "#E4E4DF";
						e.currentTarget.style.color = "#6B6B63";
					}
				}}
			>
				{showPreview ? "HIDE PREVIEW" : "SHOW PREVIEW"}
			</button>

			{/* Preview Box */}
			{showPreview && (
				<div style={{ marginTop: "12px" }}>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							marginTop: "16px",
							marginBottom: "8px",
						}}
					>
						<span
							style={{
								fontSize: "11px",
								fontWeight: 600,
								letterSpacing: "0.08em",
								color: "var(--color-text-tertiary)",
								textTransform: "uppercase"
							}}
						>
							Live preview
						</span>
						<div style={{ display: "flex", gap: "6px" }}>
							{(["S", "M", "L"] as const).map((size) => (
								<button
									key={size}
									onClick={() =>
										setPreviewHeight(
											size === "S" ? "400px" : size === "M" ? "70vh" : "100vh"
										)
									}
									style={{
										fontSize: "11px",
										padding: "3px 10px",
										border: "1px solid var(--color-border-tertiary)",
										borderRadius: "4px",
										background:
											previewHeight ===
											(size === "S" ? "400px" : size === "M" ? "70vh" : "100vh")
												? "var(--color-background-tertiary)"
												: "transparent",
										color: "var(--color-text-secondary)",
										cursor: "pointer",
										fontWeight: 500
									}}
								>
									{size}
								</button>
							))}
						</div>
					</div>
					<SandpackProvider
						template="react"
						files={{
							"/App.js": cleanCode(code),
						}}
						customSetup={{
							dependencies: {
								react: "18.2.0",
								"react-dom": "18.2.0",
							},
						}}
						options={{
							externalResources: ["https://cdn.tailwindcss.com"],
							autorun: true,
							autoReload: true,
							recompileMode: "delayed",
							recompileDelay: 300,
						}}
						theme="light"
					>
						<SandpackPreview
							style={{
								height: previewHeight,
								minHeight: "500px",
								border: "1px solid #E4E4DF",
								borderRadius: "8px",
								transition: "height 0.2s ease"
							}}
							showNavigator={false}
							showOpenInCodeSandbox={true}
							showRefreshButton={true}
						/>
					</SandpackProvider>
				</div>
			)}
		</div>
	);
}
