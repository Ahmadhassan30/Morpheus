/**
 * MORPHEUS API — Hono app entry point
 * Deployed to Cloudflare Workers
 *
 * Routes:
 *   GET  /health          → health check
 *   POST /api/generate    → wireframe to code pipeline
 */

import { Hono } from "hono";
import { cors } from "hono/cors";

import generateRouter from "./routes/generate";

type Bindings = {
	HF_API_KEY: string;
	QDRANT_URL: string;
	QDRANT_API_KEY: string;
	GROQ_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(
	"*",
	cors({
		origin: ["http://localhost:3000", "https://morpheus.vercel.app"],
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type"]
	})
);

app.get("/health", (c) =>
	c.json({ status: "ok", service: "morpheus-api", timestamp: Date.now() })
);

app.route("/api/generate", generateRouter);

export default app;
