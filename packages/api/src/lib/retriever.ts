import { VectorStoreRetriever } from "@langchain/core/vectorstores";
import { QdrantVectorStore } from "@langchain/community/vectorstores/qdrant";

import { getEmbeddings } from "./embeddings";

const QDRANT_DASHBOARD_URL = "https://cloud.qdrant.io";

export type RetrieverEnv = {
	HF_API_KEY?: string;
	QDRANT_URL?: string;
	QDRANT_API_KEY?: string;
};

function requireQdrantVar(
	name: "QDRANT_URL" | "QDRANT_API_KEY",
	env?: RetrieverEnv
): string {
	const value = env?.[name] ?? process.env[name];
	if (!value) {
		if (name === "QDRANT_URL") {
			throw new Error(
				"QDRANT_URL is not set. Create a free Qdrant cluster at cloud.qdrant.io and copy the cluster URL."
			);
		}
		throw new Error(
			"QDRANT_API_KEY is not set. Get your API key from cloud.qdrant.io (cluster settings) and set it as QDRANT_API_KEY."
		);
	}
	return value;
}

/**
 * Create a LangChain retriever backed by Qdrant.
 *
 * Qdrant is a vector database optimized for similarity search over embeddings.
 * The `ui-patterns` collection contains embedded chunks of the knowledge base
 * (e.g., navbar, hero section, login form, sidebar layout) for RAG retrieval.
 *
 * The `k: 3` parameter controls how many of the most semantically similar chunks
 * are returned for a given query (higher k increases recall but may add noise).
 */
export async function getRetriever(): Promise<VectorStoreRetriever> {
	return getRetrieverWithEnv();
}

/**
 * Same as `getRetriever()`, but allows passing Cloudflare Worker bindings (c.env).
 */
export async function getRetrieverWithEnv(env?: RetrieverEnv): Promise<VectorStoreRetriever> {
	const url = requireQdrantVar("QDRANT_URL", env);
	const apiKey = requireQdrantVar("QDRANT_API_KEY", env);

	try {
		const embeddings = getEmbeddings(env?.HF_API_KEY);
		const vectorStore = await QdrantVectorStore.fromExistingCollection(
			embeddings,
			{
				url,
				apiKey,
				collectionName: "ui-patterns"
			}
		);

		return vectorStore.asRetriever({ k: 3 });
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Unknown error connecting to Qdrant";
		throw new Error(
			`Failed to create Qdrant retriever for collection 'ui-patterns' at ${url}. ${message} (See ${QDRANT_DASHBOARD_URL})`
		);
	}
}
