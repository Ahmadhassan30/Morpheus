import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";

let cached: HuggingFaceInferenceEmbeddings | null = null;
let cachedKey: string | null = null;

function resolveHfApiKey(explicitApiKey?: string): string {
	const apiKey = explicitApiKey ?? process.env.HF_API_KEY;
	if (!apiKey) {
		throw new Error(
			"HF_API_KEY is not set. Get a free key at huggingface.co/settings/tokens"
		);
	}
	return apiKey;
}

/**
 * Returns the Hugging Face embeddings instance used across the Morpheus API.
 *
 * This uses Hugging Face Inference to generate dense vector embeddings for text.
 * Embeddings are what enable semantic search: similar meaning → nearby vectors.
 *
 * Why this model:
 * - `sentence-transformers/all-MiniLM-L6-v2` is fast and widely used
 * - It works well on the Hugging Face free tier
 * - It produces 384-dimensional vectors, which are compact and efficient for retrieval
 *
 * Output dimensions: 384
 */
export function getEmbeddings(explicitApiKey?: string): HuggingFaceInferenceEmbeddings {
	const apiKey = resolveHfApiKey(explicitApiKey);
	if (cached && cachedKey === apiKey) return cached;

	cached = new HuggingFaceInferenceEmbeddings({
		apiKey,
		model: "sentence-transformers/all-MiniLM-L6-v2"
	});
	cachedKey = apiKey;
	return cached;
}
