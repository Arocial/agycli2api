import express from 'express';
import cors from 'cors';
import { startAuth } from './auth.js';
import { handleGenerateContent } from './proxy.js';

const args = process.argv.slice(2);

if (args[0] === 'auth') {
    console.log('Starting authentication process...');
    startAuth().then(() => {
        console.log('Auth completed. You can now run the proxy server by running: node index.js');
        process.exit(0);
    }).catch((err) => {
        console.error('Auth failed', err);
        process.exit(1);
    });
} else {
    const app = express();
    app.use(cors());
    app.use(express.json({ limit: '50mb' }));

    // Standard Gemini endpoints proxy mapped to Cloud Code
    app.post('/v1beta/models/:model:generateContent', (req, res) => handleGenerateContent(req, res, false));
    app.post('/v1beta/models/:model:streamGenerateContent', (req, res) => handleGenerateContent(req, res, true));

    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
        console.log(`agy-cli-proxy running on http://localhost:${PORT}`);
        console.log(`To authenticate, run: node index.js auth`);
    });
}
