"use client";

import { useEffect, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

export interface CodeDisplayProps {
	code: string;
	isStreaming: boolean;
}

// Extract component name in TypeScript (safe, outside template literal)
function getComponentName(code: string): string | null {
	const patterns = [
		/function\s+([A-Z][a-zA-Z0-9]*)\s*\(/,
		/const\s+([A-Z][a-zA-Z0-9]*)\s*=\s*(?:\(|React\.memo|forwardRef)/,
		/var\s+([A-Z][a-zA-Z0-9]*)\s*=/
	];
	for (const pattern of patterns) {
		const match = code.match(pattern);
		if (match) return match[1];
	}
	return null;
}

function buildPreviewHTML(code: string): string {
	const cleanCode = code
		.replace(/^```[\w]*\n?/gm, "")
		.replace(/^```$/gm, "")
		.replace(/^import\s+.*$/gm, "")
		.replace(/^export\s+default\s+/gm, "")
		.replace(/^export\s+/gm, "")
		.trim();

	const componentName = getComponentName(cleanCode);

	return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"><\/script>
  <script src="https://unpkg.com/react@18/umd/react.development.js"><\/script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"><\/script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
  <style>
    body { margin: 0; padding: 16px; background: white; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-presets="react">
    ${cleanCode}

		(() => {
			const root = ReactDOM.createRoot(document.getElementById('root'));
			${componentName
			? `
			try {
				root.render(React.createElement(${componentName}));
			} catch(e) {
				root.render(React.createElement('div', {
					style: { color: '#DC2626', padding: '16px', fontFamily: 'monospace', fontSize: '13px' }
				}, 'Render error: ' + e.message));
			}`
			: `
			root.render(React.createElement('div', {
				style: { color: '#D97706', padding: '16px', fontFamily: 'monospace', fontSize: '13px' }
			}, 'Could not detect component name. Ensure the code includes a named function like function Dashboard() {}'));`
		}
		})();
  <\/script>
</body>
</html>`
}

const COLORS = {
	background: "#0a0a0a",
	surface: "#111111",
	border: "#2a2a2a",
	text: "#f5f5f0",
	muted: "#888884",
	accent: "#D3FD50",
	accentHover: "#bfe847"
} as const;

export function CodeDisplay({ code, isStreaming }: CodeDisplayProps) {
	const [copied, setCopied] = useState<boolean>(false);
	const [showPreview, setShowPreview] = useState<boolean>(false);

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

	return (
		<div className="relative flex flex-col">
			{/* Top bar */}
			<div
				className="flex items-center justify-between px-4 py-3"
				style={{
					background: "#1A1A18",
					borderRadius: "12px 12px 0 0"
				}}
			>
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-1.5">
						<div className="h-[10px] w-[10px] rounded-full" style={{ background: "#FF5F57" }} />
						<div className="h-[10px] w-[10px] rounded-full" style={{ background: "#FFBD2E" }} />
						<div className="h-[10px] w-[10px] rounded-full" style={{ background: "#28C840" }} />
					</div>
					<div
						className="ml-2 text-[12px] font-medium"
						style={{ color: "#6B6B63", fontFamily: "monospace" }}
					>
						Dashboard.tsx
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
						maxHeight: "520px",
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
				onClick={() => setShowPreview((v) => !v)}
				className="mt-[12px] w-full border px-[16px] py-[8px] text-[13px] font-[500] transition-colors"
				style={{
					border: "1px solid #E4E4DF",
					background: "white",
					color: "#6B6B63",
					borderRadius: "8px"
				}}
				onMouseEnter={(e) => {
					e.currentTarget.style.borderColor = "#7C3AED";
					e.currentTarget.style.color = "#7C3AED";
				}}
				onMouseLeave={(e) => {
					e.currentTarget.style.borderColor = "#E4E4DF";
					e.currentTarget.style.color = "#6B6B63";
				}}
			>
				{showPreview ? "HIDE PREVIEW" : "SHOW PREVIEW"}
			</button>

			{/* Preview Box */}
			{showPreview && (
				<div className="mt-[12px]">
					<iframe
						srcDoc={buildPreviewHTML(cleanedCode)}
						style={{
							width: "100%",
							height: "500px",
							border: "1px solid #E4E4DF",
							borderRadius: "0 0 12px 12px",
							background: "white"
						}}
						sandbox="allow-scripts"
						title="Component preview"
					/>
				</div>
			)}
		</div>
	);
}
