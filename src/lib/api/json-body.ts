import { NextResponse } from "next/server";

interface JsonBodySuccess<T> {
  ok: true;
  value: T;
}

interface JsonBodyFailure {
  ok: false;
  response: NextResponse;
}

export async function readJsonBody<T>(
  request: Request,
): Promise<JsonBodySuccess<T> | JsonBodyFailure> {
  try {
    return {
      ok: true,
      value: (await request.json()) as T,
    };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "无效的 JSON" },
        { status: 400 },
      ),
    };
  }
}
