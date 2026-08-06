import { NextResponse } from "next/server";

export function badRequest(message: string, errors?: string[]) {
  return NextResponse.json(
    errors ? { message, errors } : { message },
    { status: 400 },
  );
}

export function rateLimitExceeded(message: string, retryAfterSeconds: number) {
  return NextResponse.json(
    { message },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
      },
    },
  );
}

export function upstreamFailure(message: string) {
  return NextResponse.json({ message }, { status: 502 });
}

export function internalFailure(message: string) {
  return NextResponse.json({ message }, { status: 500 });
}

export function logServerError(context: string, error: unknown) {
  console.error(`[${context}]`, error);
}
