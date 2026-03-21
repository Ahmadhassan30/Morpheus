/**
 * MORPHEUS — Generate Route
 * POST /api/generate
 *
 * Accepts a multipart/form-data request with:
 *   - image: File (the wireframe photo)
 *   - description: string (text description of the wireframe)
 *
 * Pipeline:
 *   1. Validate inputs
 *   2. Convert image to base64
 *   3. Retrieve relevant UI patterns from Qdrant via LangChain
 *   4. Stream Groq response back to client
 */

import { Hono } from "hono";
import { streamText } from "hono/streaming";
import { Document } from "langchain/document";
import type { Context } from "hono";
import type { StreamingApi } from "hono/utils/stream";

import { getRetrieverWithEnv } from "../lib/retriever";

type Bindings = {
	HF_API_KEY: string;
	QDRANT_URL: string;
	QDRANT_API_KEY: string;
	GROQ_API_KEY: string;
};

type FileConstructor = {
	new (...args: never[]): unknown;
};

function isFileInstance(value: unknown): value is Blob & {
	size: number;
	type: string;
	arrayBuffer: () => Promise<ArrayBuffer>;
} {
	const maybeFileCtor = (globalThis as { File?: unknown }).File;
	if (typeof maybeFileCtor !== "function") return false;
	return value instanceof (maybeFileCtor as FileConstructor);
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
async function streamGroqCompletion(args: {
	apiKey: string;
	context: string;
	imageUrl: string;
	description: string;
	stream: StreamingApi;
}): Promise<void> {
	const context = args.context;
	// Groq free tier: 8192 max output tokens, 30 req/min, 500k tokens/day
	// Lower temperature = deterministic output, less mid-generation drift
	const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
		method: "POST",
		headers: {
			"Authorization": `Bearer ${args.apiKey}`,
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			model: "meta-llama/llama-4-scout-17b-16e-instruct",
			stream: true,
			max_tokens: 8192,
			temperature: 0.1,
			messages: [
				{
					role: "system",
					content: `You are an expert senior Next.js and Tailwind CSS developer.
The user will provide a wireframe image and a description.
Your job is to convert it into a complete, fully implemented
Next.js component using Tailwind CSS utility classes.

Use these UI patterns as reference:
${context}

CRITICAL OUTPUT RULES — follow without exception:
1. Return ONLY raw JSX code — no markdown fences, no backticks,
   no triple backticks, no language identifiers like jsx or tsx
2. No explanation, no comments, no prose before or after the code
3. NEVER use SVG path d="" attributes — they cause parse errors.
   Use Unicode characters or text for icons instead: ✕ ← → ☰ ★
4. NEVER use TypeScript type annotations — plain JavaScript only.
   No interfaces, no : Type, no <Generic> syntax anywhere
5. NEVER import from external packages except react.
   No lucide-react, no heroicons, no framer-motion, no other imports
6. Use only Tailwind classes — no style="" attributes anywhere
7. Always end the file with exactly:
   export default function ComponentName() {}
   using a real descriptive name like Dashboard, Homepage, LoginForm
8. Do NOT truncate — generate the COMPLETE component from the
   opening function declaration to the closing export statement.
   If the component is long, keep going until it is fully complete
9. Every JSX tag you open must be properly closed before the
   function ends
10. Every string attribute value must open and close on the same line.
    Never break a className or any attribute value across two lines

COMPONENT QUALITY RULES:
- Generate the FULL component — every section visible in the wireframe
- Use realistic placeholder content — real names, prices, dates, text
- Make it fully responsive using sm: md: lg: Tailwind breakpoints
- Include hover states: hover:bg-gray-100 on all interactive elements
- Use semantic HTML: nav, main, section, aside, footer, article, header
- The component must look like a real production UI, not a skeleton
- Generate everything visible in the wireframe image — no skipping sections`
				},
				{
					role: "user",
					content: [
						{
							type: "image_url",
							image_url: {
								url: args.imageUrl
							}
						},
						{
							type: "text",
							text: `Convert this wireframe to a Next.js + Tailwind component. Description: ${args.description}`
						}
					]
				}
			]
		})
	});

	if (!response.ok) {
		const text = await response.text().catch(() => "");
		throw new Error(
			`Groq request failed (${response.status}). ${text || "No response body"}`
		);
	}
	if (!response.body) {
		throw new Error("Groq returned no response body");
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;

		buffer += decoder.decode(value, { stream: true });
		const lines = buffer.split(/\r?\n/);
		buffer = lines.pop() ?? "";

		for (const line of lines) {
			const trimmed = line.trim();
			if (!trimmed.startsWith("data:")) continue;
			const data = trimmed.slice("data:".length).trim();
			if (!data) continue;
			if (data === "[DONE]") return;

			let parsed: unknown;
			try {
				parsed = JSON.parse(data);
			} catch {
				continue;
			}

			const obj = parsed as {
				choices?: Array<{
					delta?: { content?: unknown };
					message?: { content?: unknown };
				}>;
			};
			const content =
				obj.choices?.[0]?.delta?.content ?? obj.choices?.[0]?.message?.content;
			if (typeof content === "string" && content.length > 0) {
				const sanitized = content
					.replace(/```[a-zA-Z0-9_-]*/g, "")
					.replace(/```/g, "")
					.replace(/`/g, "");
				if (sanitized.length > 0) {
					await args.stream.write(sanitized);
				}
			}
		}
	}
}

const router = new Hono<{ Bindings: Bindings }>();

router.post("/", async (c: Context<{ Bindings: Bindings }>) => {
	try {
		// STEP 1 — Input validation
		const form = await c.req.formData();
		const imageValue = form.get("image");
		if (!isFileInstance(imageValue)) {
			return c.json(
				{ error: "image field is required and must be a file" },
				400
			);
		}

		const image = imageValue;

		if (!image.type.startsWith("image/")) {
			return c.json({ error: "uploaded file must be an image" }, 400);
		}

		if (image.size > MAX_IMAGE_BYTES) {
			return c.json({ error: "image must be under 10MB" }, 400);
		}

		const descriptionValue = form.get("description");
		if (
			typeof descriptionValue !== "string" ||
			descriptionValue.trim().length === 0
		) {
			return c.json({ error: "description field is required" }, 400);
		}

		const description = descriptionValue.trim();

		// STEP 2 — Convert image to base64
		const buffer = await image.arrayBuffer();
		const bytes = new Uint8Array(buffer);
		const binary = bytes.reduce(
			(acc, byte) => acc + String.fromCharCode(byte),
			""
		);
		const base64 = btoa(binary);
		const imageUrl = `data:${image.type};base64,${base64}`;

		// STEP 3 — RAG retrieval
		let context: string;
		let docs: Document[];
		try {
			const retriever = await getRetrieverWithEnv(c.env);
			docs = (await retriever.invoke(description)) as Document[];
			context =
				docs.length > 0
					? docs.map((d: Document) => d.pageContent).join("\n\n---\n\n")
					: "No specific patterns found. Use general Next.js + Tailwind best practices.";
		} catch (_error: unknown) {
			return c.json(
				{ error: "Vector store unavailable. Check QDRANT env vars." },
				503
			);
		}

		console.log(
			`[generate] RAG retrieved ${docs.length} chunks for: "${description}"`
		);

		// STEP 4 — Stream Groq response
		return streamText(c, async (stream: StreamingApi) => {
			try {
				await streamGroqCompletion({
					apiKey: c.env.GROQ_API_KEY,
					context,
					imageUrl,
					description,
					stream
				});
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : "Unknown error";
				console.error("[generate] LLM error:", message);
				await stream.write(`\n\n// Error: ${message}`);
			}
		});
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Unknown error";
		console.error("[generate] Unhandled error:", message);
		return c.json({ error: "Request failed. Please try again." }, 500);
	}
});

export default router;
