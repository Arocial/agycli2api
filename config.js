import os from 'os';

function generateSmartUserAgent() {
    const version = process.env.FALLBACK_ANTIGRAVITY_VERSION || '2.0.3';
    const osPlatform = os.platform();
    const architecture = os.arch();
    const osName = osPlatform === 'darwin' ? 'darwin' : (osPlatform === 'win32' ? 'win32' : 'linux');
    return `antigravity/${version} ${osName}/${architecture}`;
}

export function getClientVersion() {
    return process.env.ANTIGRAVITY_CLIENT_VERSION_FALLBACK || '1.110.0';
}

export const ANTIGRAVITY_HEADERS = {
    'User-Agent': generateSmartUserAgent(),
    'Content-Type': 'application/json',
    'X-Client-Name': 'antigravity',
    'X-Client-Version': getClientVersion(),
    'x-goog-api-client': 'gl-node/18.18.2 fire/0.8.6 grpc/1.10.x'
};

export const OAUTH_CONFIG = {
    clientId: '1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com',
    clientSecret: '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',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    deviceCodeUrl: 'https://oauth2.googleapis.com/device/code'
};

export const ANTIGRAVITY_ENDPOINT_DAILY = 'https://daily-cloudcode-pa.googleapis.com';

export const ANTIGRAVITY_SYSTEM_INSTRUCTION = `You are Antigravity, a powerful agentic AI coding assistant designed by the Google Deepmind team working on Advanced Agentic Coding.You are pair programming with a USER to solve their coding task. The task may require creating a new codebase, modifying or debugging an existing codebase, or simply answering a question.**Absolute paths only****Proactiveness**`;
