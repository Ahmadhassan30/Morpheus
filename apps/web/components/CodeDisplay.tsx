"use client";

import { useEffect, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { SandpackPreview, SandpackProvider } from "@codesandbox/sandpack-react";

export interface CodeDisplayProps {
	code: string;
	isStreaming: boolean;
}

function cleanCode(raw: string): string {
	return raw
		.replace(/^```[\w]*\n?/gm, "")
		.replace(/^```$/gm, "")
		.replace(/^["']use client["']\s*;?\s*/gm, "")
		.replace(/^import\s+.*$/gm, "")
		.trim();
}

function getPreviewCode(raw: string): string {
	const base = cleanCode(raw);
	if (/export\s+default\s+/m.test(base)) return base;

	const fnMatch = base.match(/function\s+([A-Za-z_$][\w$]*)\s*\(/);
	if (fnMatch?.[1]) {
		return `${base}\n\nexport default ${fnMatch[1]};`;
	}

	const constMatch = base.match(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*[^=]*=>/);
	if (constMatch?.[1]) {
		return `${base}\n\nexport default ${constMatch[1]};`;
	}

	return base;
}

export function CodeDisplay({ code, isStreaming }: CodeDisplayProps) {
	const [copied, setCopied] = useState<boolean>(false);
	const [showPreview, setShowPreview] = useState<boolean>(false);
	const [previewSource, setPreviewSource] = useState<string>("export default function Component(){ return <div />; }");

	useEffect(() => {
		if (!copied) return;
		const t = window.setTimeout(() => setCopied(false), 2000);
		return () => window.clearTimeout(t);
	}, [copied]);

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
						maxHeight: "calc(45vh - 60px)",
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
				onClick={() => {
					if (!showPreview) {
						setPreviewSource(getPreviewCode(code));
					}
					setShowPreview(!showPreview);
				}}
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
					<p
						style={{
							fontSize: "11px",
							color: "var(--color-text-tertiary)",
							marginBottom: "8px",
							fontFamily: "monospace",
							letterSpacing: "0.08em"
						}}
					>
						LIVE PREVIEW - powered by Sandpack
					</p>
					<SandpackProvider
						template="react"
						files={{
							"/App.js": previewSource
						}}
						options={{
							externalResources: ["https://cdn.tailwindcss.com"],
							autorun: true,
							autoReload: true
						}}
						theme="light"
						customSetup={{
							dependencies: {
								react: "^18.0.0",
								"react-dom": "^18.0.0"
							}
						}}
					>
						<SandpackPreview
							style={{
								height: "calc(55vh - 20px)",
								border: "1px solid #E4E4DF",
								borderRadius: "0 0 12px 12px"
							}}
							showNavigator={false}
							showOpenInCodeSandbox={false}
							showRefreshButton
						/>
					</SandpackProvider>
				</div>
			)}
		</div>
	);
}
