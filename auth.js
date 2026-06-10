import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import http from 'http';
import { OAUTH_CONFIG } from './config.js';

const CONFIG_DIR = path.join(os.homedir(), '.config', 'agy-cli-proxy');
const TOKEN_PATH = path.join(CONFIG_DIR, 'token.json');
const REDIRECT_PORT = 51121;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/oauth-callback`;

async function ensureConfigDir() {
    try {
        await fs.mkdir(CONFIG_DIR, { recursive: true });
    } catch (err) {
        // Ignore
    }
}

export async function saveToken(tokenData) {
    await ensureConfigDir();
    // Add expiry time (current time + expires_in seconds - 60 seconds buffer)
    if (tokenData.expires_in) {
        tokenData.expires_at = Date.now() + (tokenData.expires_in * 1000) - 60000;
    }
    await fs.writeFile(TOKEN_PATH, JSON.stringify(tokenData, null, 2));
}

export async function readToken() {
    try {
        const data = await fs.readFile(TOKEN_PATH, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return null;
    }
}

export async function startAuth() {
    return new Promise((resolve, reject) => {
        const server = http.createServer(async (req, res) => {
            try {
                const url = new URL(req.url, `http://localhost:${REDIRECT_PORT}`);
                if (url.pathname === '/oauth-callback') {
                    const code = url.searchParams.get('code');
                    if (code) {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end('<h1>Authentication successful!</h1><p>You can close this window now.</p>');
                        
                        // Exchange code for token
                        const tokenResponse = await fetch(OAUTH_CONFIG.tokenUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: new URLSearchParams({
                                client_id: OAUTH_CONFIG.clientId,
                                client_secret: OAUTH_CONFIG.clientSecret,
                                code,
                                grant_type: 'authorization_code',
                                redirect_uri: REDIRECT_URI
                            })
                        });
                        
                        if (!tokenResponse.ok) {
                            throw new Error(`Failed to exchange token: ${await tokenResponse.text()}`);
                        }
                        
                        const tokenData = await tokenResponse.json();
                        await saveToken(tokenData);
                        console.log('Token saved successfully.');
                        server.close();
                        resolve(tokenData);
                    } else {
                        res.writeHead(400);
                        res.end('Missing code parameter');
                    }
                } else {
                    res.writeHead(404);
                    res.end('Not found');
                }
            } catch (err) {
                console.error('Auth error:', err);
                res.writeHead(500);
                res.end('Internal server error');
                server.close();
                reject(err);
            }
        });

        server.listen(REDIRECT_PORT, () => {
            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${OAUTH_CONFIG.clientId}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent('https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/userinfo.email')}&access_type=offline&prompt=consent`;
            console.log('Please open the following URL in your browser to authenticate:');
            console.log('\n' + authUrl + '\n');
            console.log('Waiting for authentication...');
        });
    });
}

export async function getToken() {
    let tokenData = await readToken();
    if (!tokenData) {
        throw new Error('Not authenticated. Please run auth first.');
    }

    if (tokenData.expires_at && Date.now() > tokenData.expires_at) {
        // Refresh token
        console.log('Token expired, refreshing...');
        if (!tokenData.refresh_token) {
            throw new Error('No refresh token available. Please re-authenticate.');
        }

        const response = await fetch(OAUTH_CONFIG.tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: OAUTH_CONFIG.clientId,
                client_secret: OAUTH_CONFIG.clientSecret,
                refresh_token: tokenData.refresh_token,
                grant_type: 'refresh_token'
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to refresh token: ${await response.text()}`);
        }

        const newData = await response.json();
        // Preserve the old refresh token if a new one is not provided
        if (!newData.refresh_token) {
            newData.refresh_token = tokenData.refresh_token;
        }
        await saveToken(newData);
        tokenData = newData;
    }

    return tokenData.access_token;
}
