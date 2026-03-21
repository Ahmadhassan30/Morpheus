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
			temperature: 0.2,
			messages: [
				{
					role: "system",
					content: `You are an expert Next.js and Tailwind CSS developer.

Use these UI patterns as reference:
${context}

CRITICAL RULES — follow every single one without exception:

1. Start with: export default function ComponentName() {
2. Return a SINGLE root element wrapping everything
3. Use ONLY simple Tailwind classes — no arbitrary values like w-[123px]
4. Keep the component SHORT and SIMPLE — maximum 80 lines total
5. NO SVG icons — use plain text or emoji instead of any <svg> tags
6. NO complex nested ternaries
7. NO TypeScript types or interfaces — plain JavaScript only
8. Use placeholder text like "Link 1", "Button", "Title" — keep it minimal
9. Every JSX tag must be properly closed
10. Do NOT use lucide-react or any external icon library
11. Do NOT include comments in the code
12. Return ONLY the component code — no markdown fences, no explanation
13. The entire component must fit in 60-80 lines maximum

Keep it simple. A clean simple component is better than a complex broken one.`
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
