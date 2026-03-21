/**
 * MORPHEUS — Ingest Script
 * Run this once locally before deploying:
 *   npx ts-node src/scripts/ingest.ts
 *
 * Prerequisites:
 *   1. Copy .env.example to .env and fill in all values
 *   2. Create a free Qdrant cluster at cloud.qdrant.io
 *   3. Get a free HF key at huggingface.co/settings/tokens
 */

import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { QdrantVectorStore } from "@langchain/community/vectorstores/qdrant";
import { QdrantClient } from "@qdrant/js-client-rest";

import { getEmbeddings } from "../lib/embeddings.js";

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

type RequiredEnvVar =
	| "HF_API_KEY"
	| "QDRANT_URL"
	| "QDRANT_API_KEY"
	| "OPENROUTER_API_KEY";

function loadEnvFromDevVarsIfPresent(): void {
	const thisDir = path.dirname(fileURLToPath(import.meta.url));
	const candidates = [
		path.join(process.cwd(), ".dev.vars"),
		path.join(thisDir, "..", "..", ".dev.vars")
	];

	for (const filePath of candidates) {
		try {
			if (!fs.existsSync(filePath)) continue;
			const raw = fs.readFileSync(filePath, "utf8");
			for (const line of raw.split(/\r?\n/)) {
				const trimmed = line.trim();
				if (!trimmed || trimmed.startsWith("#")) continue;
				const eq = trimmed.indexOf("=");
				if (eq <= 0) continue;
				const key = trimmed.slice(0, eq).trim();
				let value = trimmed.slice(eq + 1).trim();
				if (
					(value.startsWith('"') && value.endsWith('"')) ||
					(value.startsWith("'") && value.endsWith("'"))
				) {
					value = value.slice(1, -1);
				}
				if (!process.env[key] && value) {
					process.env[key] = value;
				}
			}
			return;
		} catch {
			// Best-effort. If parsing fails, missing env validation below will explain.
		}
	}
}

function getMissingEnvVars(names: readonly RequiredEnvVar[]): RequiredEnvVar[] {
	const missing: RequiredEnvVar[] = [];
	for (const name of names) {
		if (!process.env[name]) missing.push(name);
	}
	return missing;
}

async function main(): Promise<void> {
	try {
		loadEnvFromDevVarsIfPresent();
		const missingAfterDevVars = getMissingEnvVars([
			"HF_API_KEY",
			"QDRANT_URL",
			"QDRANT_API_KEY",
			"OPENROUTER_API_KEY"
		] as const);
		if (missingAfterDevVars.length > 0) {
			// eslint-disable-next-line no-console
			console.error(
				`Missing required env vars: ${missingAfterDevVars.join(
					", "
				)}. Ensure packages/api/.dev.vars includes all keys (or export them in your shell).`
			);
			process.exit(1);
		}

		// eslint-disable-next-line no-console
		console.log("Loading knowledge base...");

		const loader = new TextLoader("../../knowledge/ui-patterns.md");
		const docs = await loader.load();
		if (docs.length === 0 || docs.every((d) => !d.pageContent?.trim())) {
			throw new Error(
				"knowledge/ui-patterns.md appears to be empty. Populate it before running ingest."
			);
		}

		// eslint-disable-next-line no-console
		console.log("Splitting into chunks...");

		const splitter = new RecursiveCharacterTextSplitter({
			chunkSize: 400,
			chunkOverlap: 40
		});

		const chunks = await splitter.splitDocuments(docs);

		// eslint-disable-next-line no-console
		console.log(`Splitting complete — ${chunks.length} chunks created`);
		// eslint-disable-next-line no-console
		console.log(
			"Embedding and storing in Qdrant... (this may take 30-60 seconds)"
		);

		const embeddings = getEmbeddings(process.env.HF_API_KEY);

		await QdrantVectorStore.fromDocuments(chunks, embeddings, {
			url: process.env.QDRANT_URL as string,
			apiKey: process.env.QDRANT_API_KEY as string,
			collectionName: "ui-patterns"
		});

		const qdrant = new QdrantClient({
			url: process.env.QDRANT_URL as string,
			apiKey: process.env.QDRANT_API_KEY as string
		});
		const countResult = await qdrant.count("ui-patterns", { exact: true });
		// eslint-disable-next-line no-console
		console.log(
			`Qdrant collection 'ui-patterns' contains ${countResult.count} points.`
		);

		// eslint-disable-next-line no-console
		console.log(
			`Done! ${chunks.length} chunks stored in Qdrant collection 'ui-patterns'`
		);
		// eslint-disable-next-line no-console
		console.log("Qdrant collection 'ui-patterns' is ready.");
		// eslint-disable-next-line no-console
		console.log("You can now deploy the API and start generating code.");
	} catch (error: unknown) {
		const message = error instanceof Error ? error.stack ?? error.message : String(error);
		// eslint-disable-next-line no-console
		console.error(message);
		process.exit(1);
	}
}

void main();
