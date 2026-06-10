import cors from "cors";
import express from "express";
import { handleGenerateContent } from "./proxy.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

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
});
