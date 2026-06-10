import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { OAUTH_CONFIG, TOKEN_EXPIRY_BUFFER_MS } from "./config.js";

// The requested token path
const TOKEN_PATH = path.join(
	os.homedir(),
	".gemini",
	"antigravity-cli",
	"antigravity-oauth-token",
);

export interface TokenData {
	access_token: string;
	refresh_token?: string;
	expires_in?: number;
	expiry_date?: number;
	expires_at?: number;
	expiry?: string;
}

interface TokenFileContent {
	auth_method?: string;
	token?: TokenData;
	[key: string]: unknown;
}

let cachedTokenData: TokenData | null = null;
let refreshPromise: Promise<string> | null = null;

export async function readToken(): Promise<TokenData | null> {
	try {
		const data = await fs.readFile(TOKEN_PATH, "utf8");
		return JSON.parse(data).token;
	} catch (_err) {
		return null;
	}
}

export async function saveToken(tokenData: TokenData) {
	try {
		const dir = path.dirname(TOKEN_PATH);
		await fs.mkdir(dir, { recursive: true });

		// Ensure we have a clear absolute expiry time
		if (
			tokenData.expires_in &&
			!tokenData.expiry_date &&
			!tokenData.expires_at &&
			!tokenData.expiry
		) {
			tokenData.expiry_date =
				Date.now() + tokenData.expires_in * 1000 - TOKEN_EXPIRY_BUFFER_MS;
			tokenData.expiry = new Date(tokenData.expiry_date).toISOString();
		}

		let fileContent: TokenFileContent = { auth_method: "consumer" };
		try {
			const existingData = await fs.readFile(TOKEN_PATH, "utf8");
			fileContent = JSON.parse(existingData);
		} catch (_e) {
			// Ignore read error
		}
		fileContent.token = tokenData;

		await fs.writeFile(TOKEN_PATH, JSON.stringify(fileContent, null, 2), {
			mode: 0o600,
		});
	} catch (err) {
		console.warn(
			"Failed to save refreshed token to cache:",
			(err as Error).message,
		);
	}
}

function isTokenExpired(tokenData: TokenData) {
	const now = Date.now();
	// Check various possible expiry fields
	if (tokenData.expiry) {
		const expiryTime = new Date(tokenData.expiry).getTime();
		if (!Number.isNaN(expiryTime)) {
			return now >= expiryTime - TOKEN_EXPIRY_BUFFER_MS;
		}
	}
	if (tokenData.expiry_date)
		return now >= tokenData.expiry_date - TOKEN_EXPIRY_BUFFER_MS;
	if (tokenData.expires_at)
		return now >= tokenData.expires_at - TOKEN_EXPIRY_BUFFER_MS;
	// If no absolute timestamp but expires_in exists, assume it needs refresh if we don't know the creation time
	return false;
}

export async function getToken() {
	if (!cachedTokenData) {
		cachedTokenData = await readToken();
	}
	const tokenData = cachedTokenData;

	if (!tokenData?.access_token) {
		throw new Error(
			"Token not found or invalid. Please manually log in via antigravity-cli first.",
		);
	}

	if (isTokenExpired(tokenData)) {
		console.log("Token expired, refreshing...");
		if (!tokenData.refresh_token) {
			throw new Error(
				"No refresh token available. Please manually log in via antigravity-cli.",
			);
		}

		if (refreshPromise) {
			return refreshPromise;
		}

		refreshPromise = (async () => {
			try {
				const response = await fetch(OAUTH_CONFIG.tokenUrl, {
					method: "POST",
					headers: { "Content-Type": "application/x-www-form-urlencoded" },
					body: new URLSearchParams({
						client_id: OAUTH_CONFIG.clientId,
						client_secret: OAUTH_CONFIG.clientSecret,
						refresh_token: tokenData.refresh_token || "",
						grant_type: "refresh_token",
					}),
				});

				if (!response.ok) {
					const errText = await response.text();
					throw new Error(
						`Token refresh failed (${response.status}): ${errText}`,
					);
				}

				const newData = await response.json();

				// Merge with existing data (preserve refresh_token if new one not provided)
				const updatedData = { ...tokenData, ...newData };
				if (newData.expires_in) {
					updatedData.expiry_date = Date.now() + newData.expires_in * 1000;
					updatedData.expiry = new Date(updatedData.expiry_date).toISOString();
				}

				await saveToken(updatedData);
				cachedTokenData = updatedData;
				console.log("Token successfully refreshed and saved.");
				return updatedData.access_token;
			} catch (err) {
				console.error("Error refreshing token:", (err as Error).message);
				throw new Error(`Token refresh failed. ${(err as Error).message}`);
			} finally {
				refreshPromise = null;
			}
		})();

		return refreshPromise;
	}

	return tokenData.access_token;
}
