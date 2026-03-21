import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
export type ChainInput = {
	context: string;
	image: string;
};

function resolveOpenRouterApiKey(explicitApiKey?: string): string {
	const apiKey = explicitApiKey ?? process.env.OPENROUTER_API_KEY;
	if (!apiKey) {
		throw new Error(
			"OPENROUTER_API_KEY is not set. Get a free key at openrouter.ai/keys"
		);
	}
	return apiKey;
}

/**
 * Multimodal prompt template using LangChain's ChatPromptTemplate.
 * Accepts two variables:
 * - {context}: RAG-retrieved UI patterns for grounding
 * - {image}: base64 data URL of the wireframe photo
 */
const prompt = ChatPromptTemplate.fromMessages([
	[
		"system",
		`You are an expert Next.js and Tailwind CSS developer.
The user will provide a photo of a hand-drawn UI wireframe sketch.
Your job is to convert it into a single, clean, production-ready Next.js JSX component.

Use the following UI component patterns as reference and grounding:
{context}

Rules you must follow without exception:
1. Return ONLY the JSX component code — nothing else
2. No markdown code fences (no backticks)
3. No import statements
4. No explanation or prose before or after the code
5. Use Tailwind CSS utility classes exclusively — no inline styles
6. Use semantic HTML elements (nav, main, section, article, footer)
7. Make the component fully responsive using Tailwind breakpoint prefixes
8. Use realistic placeholder text — not "Lorem ipsum" or "text here"
9. The component must be a valid React functional component
10. Component name should reflect what it is (e.g. DashboardLayout, LoginForm)`
	],
	[
		"user",
		[
			{
				type: "image_url",
				image_url: { url: "{image}" }
			},
			{
				type: "text",
				text: "Analyze this wireframe sketch and convert it to a Next.js + Tailwind component following all the rules in the system prompt."
			}
		]
	]
]);

/**
 * LCEL (LangChain Expression Language) chain using the pipe operator.
 * Data flows left to right:
 *   prompt → formats the messages with context + image
 *   llm    → sends to OpenRouter/Llama 4 Maverick, streams tokens back
 *   parser → converts the AIMessageChunk stream to a plain string stream
 *
 * Usage:
 *   const stream = await chain.stream({ context: "...", image: "data:image/jpeg;base64,..." })
 *   for await (const chunk of stream) { write(chunk) }
 */
export function getChain(explicitApiKey?: string) {
	const openAIApiKey = resolveOpenRouterApiKey(explicitApiKey);

	/**
	 * LLM pointed at OpenRouter which proxies to Llama 4 Maverick.
	 * OpenRouter is OpenAI-API-compatible — we just change the baseURL.
	 * Llama 4 Maverick supports vision (image inputs) and is free tier on OpenRouter.
	 */
	const llm = new ChatOpenAI({
		modelName: "mistralai/mistral-small-3.1-24b-instruct:free",
		openAIApiKey,
		configuration: {
			baseURL: "https://openrouter.ai/api/v1",
			defaultHeaders: {
				"HTTP-Referer": "https://morpheus.dev",
				"X-Title": "Morpheus"
			}
		},
		streaming: true,
		temperature: 0.2, // low temperature = more deterministic code output
		maxTokens: 2048
	});

	const chain = prompt.pipe(llm).pipe(new StringOutputParser());
	return { chain, llm, prompt };
}

export { prompt };
