# Morpheus

Morpheus converts a wireframe photo (hand-drawn or screenshot) + a short description into production-ready **Next.js + Tailwind** component code.

It’s built as a small monorepo:
- **Web**: Next.js UI for upload + streaming code output
- **API**: Cloudflare Workers + Hono endpoint that runs multimodal generation
- **RAG**: Qdrant vector search over a curated UI patterns knowledge base

## How it works

1. You upload an image and add a short description.
2. The API retrieves the most relevant UI patterns from Qdrant (RAG).
3. The API streams a multimodal prompt (context + image) to a vision-capable LLM via OpenRouter.
4. The web app renders the streamed TSX output as it arrives.

## Tech stack

- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS, TypeScript
- **API**: Cloudflare Workers, Hono, streaming responses
- **RAG**: LangChain + Qdrant
- **Embeddings**: Hugging Face Inference (sentence-transformers/all-MiniLM-L6-v2, 384 dims)
- **LLM**: OpenRouter (OpenAI-compatible API), vision model

## Repo layout

- apps/web — Next.js app
- packages/api — Cloudflare Worker (Hono)
- knowledge/ui-patterns.md — curated UI patterns used for retrieval

## Prerequisites

- Node.js 20+
- A Cloudflare account (for Workers deployment)
- API keys:
	- Hugging Face Inference (HF_API_KEY)
	- Qdrant Cloud (QDRANT_URL, QDRANT_API_KEY)
	- OpenRouter (OPENROUTER_API_KEY)

## Local setup

Install dependencies from the repo root:

	npm install

### 1) Start the API (Workers)

For local development, Wrangler reads environment variables from packages/api/.dev.vars.

Create packages/api/.dev.vars (do not commit it):

	HF_API_KEY=...
	QDRANT_URL=...
	QDRANT_API_KEY=...
	OPENROUTER_API_KEY=...

Run the API:

	npm run dev:api

Wrangler typically serves at http://127.0.0.1:8787.

### 2) Configure and start the web app

Create apps/web/.env.local:

	NEXT_PUBLIC_API_URL=http://127.0.0.1:8787

Run the web app:

	npm run dev:web

Open http://localhost:3000.

## Ingest the knowledge base into Qdrant

The retriever expects a Qdrant collection named ui-patterns populated with chunks from knowledge/ui-patterns.md.

The ingest script runs locally via ts-node and reads keys from your process environment.

PowerShell example (Windows):

	$env:HF_API_KEY = "..."
	$env:QDRANT_URL = "..."
	$env:QDRANT_API_KEY = "..."
	$env:OPENROUTER_API_KEY = "..."
	npm run ingest

## Deployment

### Deploy the API (Cloudflare Workers)

From packages/api, set secrets:

	wrangler secret put HF_API_KEY
	wrangler secret put QDRANT_URL
	wrangler secret put QDRANT_API_KEY
	wrangler secret put OPENROUTER_API_KEY

Deploy:

	npm run deploy --workspace=packages/api

### Deploy the web app (Vercel)

Deploy apps/web to Vercel and set:

- NEXT_PUBLIC_API_URL = your deployed Worker URL

## Notes / production guardrails

- The API enforces basic upload validation (image MIME type + 10MB max).
- CORS is intentionally locked down in the Worker app; update it if you change domains.
- If you see generation failures, confirm Qdrant is populated (run ingest) and all secrets are set.
