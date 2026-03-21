"use client";

import { useEffect, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

export interface CodeDisplayProps {
	code: string;
	isStreaming: boolean;
}

function buildPreviewHTML(code: string): string {
	// Strip import statements — browser doesn't need them
	// Also strip common Markdown fences (```tsx ... ```), since the model may return them.
	const lines = code.split(/\r?\n/);
	const keptLines: string[] = [];
	let skippingImport = false;

	for (const line of lines) {
		if (!skippingImport && /^\s*import\b/.test(line)) {
			skippingImport = !/;\s*$/.test(line);
			continue;
		}

		if (skippingImport) {
			if (/;\s*$/.test(line)) skippingImport = false;
			continue;
		}

		keptLines.push(line);
	}

	const cleanCode = keptLines
		.join("\n")
		.replace(/^\s*```[a-zA-Z0-9_-]*\s*$/gm, "")
		.replace(/^\s*```\s*$/gm, "")
		.replace(/^export\s+default\s+/gm, "")
		.trim();

	const cleanCodeForScript = cleanCode.replace(/<\/script>/gi, "<\\/script>");

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
	<script type="text/babel">
		${cleanCodeForScript}

		const rootElement = document.getElementById('root');
		const root = ReactDOM.createRoot(rootElement);

		// Try to find and render the component
		// In sandboxed iframes, some window properties (e.g. localStorage) throw on access.
		const componentNames = Object.keys(window).filter((k) => {
			if (!/^[A-Z]/.test(k)) return false;
			if (k === 'React' || k === 'ReactDOM') return false;
			try {
				return typeof window[k] === 'function';
			} catch {
				return false;
			}
		});

		// Extract function name from code as fallback
		const __source = ${JSON.stringify(cleanCode)};
		const match = __source.match(/function\\s+([A-Z][a-zA-Z]*)/);
		const name = match ? match[1] : null;
		const fromName = name && typeof window[name] === 'function' ? window[name] : null;
		const fromGlobals = componentNames.length > 0 ? window[componentNames[0]] : null;
		const Component = fromName || fromGlobals;

		if (Component) {
			root.render(React.createElement(Component));
		} else {
			root.render(React.createElement('div', {
				style: { color: 'red', padding: '16px' }
			}, 'Could not detect component name. Make sure the component is a named function.'));
		}
	<\/script>
</body>
</html>`;
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

	const copyDisabled = code.trim().length === 0;

	return (
		<div className="relative">
			{isStreaming ? (
				<div
					className="absolute left-0 right-0 top-0 h-[2px] overflow-hidden"
					aria-hidden="true"
				>
					<div
						className="stream-bar h-full w-1/3"
						style={{ background: COLORS.accent }}
					/>
				</div>
			) : null}

			<div
				className="flex items-center justify-between border px-4 py-3"
				style={{ borderColor: COLORS.border, background: COLORS.surface }}
			>
				<div
					className="text-[14px] uppercase"
					style={{ color: COLORS.muted, letterSpacing: "0.08em" }}
				>
					GENERATED COMPONENT
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
							// If clipboard is blocked, keep UI stable (no extra error UI).
						}
					}}
					className="border px-3 py-1 text-xs font-semibold"
					style={{
						borderColor: COLORS.border,
						background: "transparent",
						color: copyDisabled ? COLORS.muted : COLORS.text,
						borderRadius: 0,
						opacity: copyDisabled ? 0.55 : 1,
						cursor: copyDisabled ? "not-allowed" : "pointer"
					}}
					onMouseEnter={(e) => {
						if (copyDisabled) return;
						e.currentTarget.style.borderColor = COLORS.accent;
						e.currentTarget.style.color = COLORS.accent;
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.borderColor = COLORS.border;
						e.currentTarget.style.color = copyDisabled ? COLORS.muted : COLORS.text;
					}}
				>
					{copied ? "COPIED ✓" : "COPY"}
				</button>
			</div>

			<div className="mt-4">
				<SyntaxHighlighter
					language="tsx"
					style={vscDarkPlus}
					showLineNumbers
					customStyle={{
						background: COLORS.background,
						border: `1px solid ${COLORS.border}`,
						borderRadius: 0,
						fontSize: "13px",
						fontFamily: '"Fira Code", "Cascadia Code", monospace',
						minHeight: "300px",
						maxHeight: "500px",
						overflowY: "auto",
						margin: 0
					}}
				>
					{code.length > 0 ? code : ""}
				</SyntaxHighlighter>
			</div>

			<button
				type="button"
				onClick={() => setShowPreview((v) => !v)}
				className="mt-4 w-full border px-4 py-2 text-sm font-semibold"
				style={{
					borderColor: COLORS.border,
					background: "transparent",
					color: COLORS.text,
					borderRadius: 0
				}}
				onMouseEnter={(e) => {
					e.currentTarget.style.borderColor = COLORS.accent;
					e.currentTarget.style.color = COLORS.accent;
				}}
				onMouseLeave={(e) => {
					e.currentTarget.style.borderColor = COLORS.border;
					e.currentTarget.style.color = COLORS.text;
				}}
			>
				{showPreview ? "HIDE PREVIEW" : "SHOW PREVIEW"}
			</button>

			{showPreview && (
				<div style={{ marginTop: '12px' }}>
					<p style={{
						fontSize: '11px',
						color: 'var(--color-text-tertiary)',
						marginBottom: '8px',
						fontFamily: 'monospace'
					}}>
						LIVE PREVIEW — rendered with React 18 + Tailwind CDN
					</p>
					<iframe
						srcDoc={buildPreviewHTML(code)}
						style={{
							width: '100%',
							height: '500px',
							border: '1px solid #2a2a2a',
							borderRadius: '0',
							background: 'white'
						}}
						sandbox="allow-scripts"
						title="Component preview"
					/>
				</div>
			)}

		</div>
	);
}
