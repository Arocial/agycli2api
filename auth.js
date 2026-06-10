import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { OAUTH_CONFIG } from './config.js';

// The requested token path
const TOKEN_PATH = path.join(os.homedir(), '.gemini', 'antigravity-cli', 'antigravity-oauth-token');

export async function readToken() {
    try {
        const data = await fs.readFile(TOKEN_PATH, 'utf8');
        return JSON.parse(data).token;
    } catch (err) {
        return null;
    }
}

export async function saveToken(tokenData) {
    try {
        const dir = path.dirname(TOKEN_PATH);
        await fs.mkdir(dir, { recursive: true });
        
        // Ensure we have a clear absolute expiry time
        if (tokenData.expires_in && !tokenData.expiry_date && !tokenData.expires_at) {
            tokenData.expiry_date = Date.now() + (tokenData.expires_in * 1000) - 60000;
        }
        
        await fs.writeFile(TOKEN_PATH, JSON.stringify(tokenData, null, 2), { mode: 0o600 });
    } catch (err) {
        console.warn('Failed to save refreshed token to cache:', err.message);
    }
}

function isTokenExpired(tokenData) {
    const now = Date.now();
    // Check various possible expiry fields (1 min buffer)
    if (tokenData.expiry_date) return now >= (tokenData.expiry_date - 60000);
    if (tokenData.expires_at) return now >= (tokenData.expires_at - 60000);
    // If no absolute timestamp but expires_in exists, assume it needs refresh if we don't know the creation time
    return false;
}

export async function getToken() {
    let tokenData = await readToken();
    
    if (!tokenData || !tokenData.access_token) {
        throw new Error('Token not found or invalid. Please manually log in via antigravity-cli first.');
    }

    if (isTokenExpired(tokenData)) {
        console.log('Token expired, refreshing...');
        if (!tokenData.refresh_token) {
            throw new Error('No refresh token available. Please manually log in via antigravity-cli.');
        }

        try {
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
                const errText = await response.text();
                throw new Error(`Refresh failed with status ${response.status}: ${errText}`);
            }

            const newData = await response.json();
            
            // Merge with existing data (preserve refresh_token if new one not provided)
            const updatedData = { ...tokenData, ...newData };
            if (newData.expires_in) {
                updatedData.expiry_date = Date.now() + (newData.expires_in * 1000);
            }
            
            await saveToken(updatedData);
            tokenData = updatedData;
            console.log('Token successfully refreshed and saved.');
        } catch (err) {
            console.error('Error refreshing token:', err.message);
            throw new Error('Token refresh failed. Please manually log in via antigravity-cli.');
        }
    }

    return tokenData.access_token;
}
