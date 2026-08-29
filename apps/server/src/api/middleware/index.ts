export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Last-Event-ID",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

export const maxJsonBodyBytes = 2 * 1024 * 1024;
/**
 * Prompts carry base64 image attachments, which blow past the JSON cap: a
 * single phone photo is already several megabytes once encoded.
 */
export const maxPromptBodyBytes = 24 * 1024 * 1024;

export class HttpError extends Error {
  readonly status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

export function errorStatus(error: unknown): number {
  return error instanceof HttpError ? error.status : 500;
}
