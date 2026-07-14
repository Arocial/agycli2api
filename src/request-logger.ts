import { STATUS_CODES } from "node:http";
import type { RequestHandler, Response } from "express";

const requestErrors = new WeakMap<Response, string[]>();
const MAX_ERROR_LENGTH = 2_000;

function formatError(error: unknown): string {
	const message = error instanceof Error ? error.message : String(error);
	const singleLine = message.replace(/\s+/g, " ").trim();
	return singleLine.length > MAX_ERROR_LENGTH
		? `${singleLine.slice(0, MAX_ERROR_LENGTH)}…`
		: singleLine;
}

function redactUrl(originalUrl: string): string {
	try {
		const url = new URL(originalUrl, "http://localhost");
		for (const name of [...url.searchParams.keys()]) {
			if (name.toLowerCase() === "key") {
				url.searchParams.set(name, "[REDACTED]");
			}
		}
		return `${url.pathname}${url.search}`;
	} catch {
		return originalUrl.replace(/([?&]key=)[^&]*/gi, "$1[REDACTED]");
	}
}

export function setRequestError(res: Response, error: unknown): void {
	const message = formatError(error);
	if (!message) return;

	const errors = requestErrors.get(res) ?? [];
	if (!errors.includes(message)) {
		errors.push(message);
		requestErrors.set(res, errors);
	}
}

export const requestLogger: RequestHandler = (req, res, next) => {
	const startedAt = process.hrtime.bigint();
	let logged = false;

	const logRequest = (connectionClosed = false) => {
		if (logged) return;
		logged = true;

		if (connectionClosed) {
			setRequestError(
				res,
				"Client connection closed before response completed",
			);
		}

		const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
		const errors = requestErrors.get(res) ?? [];
		if (res.statusCode >= 400 && errors.length === 0) {
			errors.push(
				`HTTP ${res.statusCode} ${STATUS_CODES[res.statusCode] ?? "Request failed"}`,
			);
		}

		const message = [
			`${new Date().toISOString()} [request]`,
			req.method,
			redactUrl(req.originalUrl),
			String(res.statusCode),
			`${durationMs.toFixed(1)}ms`,
			`ip=${req.ip || req.socket.remoteAddress || "-"}`,
		];
		if (errors.length > 0) {
			message.push(`error=${JSON.stringify(errors.join("; "))}`);
		}

		const line = message.join(" ");
		if (errors.length > 0) {
			console.error(line);
		} else {
			console.log(line);
		}
	};

	res.once("finish", () => logRequest());
	res.once("close", () => {
		if (!res.writableFinished) logRequest(true);
	});
	next();
};
