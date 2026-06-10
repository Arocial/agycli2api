import cors from "cors";
import express from "express";
import { handleGenerateContent } from "./proxy.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// API Key Authentication Middleware
app.use((req, res, next) => {
	const expectedKey = process.env.API_KEY;
	if (!expectedKey) {
		return next();
	}

	const providedKey =
		req.query.key ||
		req.headers["x-goog-api-key"] ||
		req.headers["x-api-key"] ||
		(req.headers.authorization?.startsWith("Bearer ")
			? req.headers.authorization.slice(7)
			: undefined);

	if (providedKey !== expectedKey) {
		return res
			.status(401)
			.json({ error: { message: "Unauthorized: Invalid API Key" } });
	}

	next();
});

// Standard Gemini endpoints proxy mapped to Cloud Code
app.post("/v1beta/models/:modelAndAction", (req, res) => {
	const [model, action] = req.params.modelAndAction.split(":");
	const isStreaming = action === "streamGenerateContent";
	return handleGenerateContent(req, res, isStreaming, model || "");
});

const PORT = process.env.PORT || 3403;
app.listen(PORT, () => {
	console.log(`agy-cli-proxy running on http://localhost:${PORT}`);
	console.log(
		`Using credentials from ~/.gemini/antigravity-cli/antigravity-oauth-token`,
	);
	if (process.env.API_KEY) {
		console.log(`API Key authentication is ENABLED.`);
	} else {
		console.log(
			`API Key authentication is DISABLED. Set API_KEY environment variable to enable.`,
		);
	}
});
