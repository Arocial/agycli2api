import express from 'express';
import cors from 'cors';
import { handleGenerateContent } from './proxy.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Standard Gemini endpoints proxy mapped to Cloud Code
app.post('/v1beta/models/:model:generateContent', (req, res) => handleGenerateContent(req, res, false));
app.post('/v1beta/models/:model:streamGenerateContent', (req, res) => handleGenerateContent(req, res, true));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`agy-cli-proxy running on http://localhost:${PORT}`);
    console.log(`Using credentials from ~/.gemini/antigravity-cli/antigravity-oauth-token`);
});
