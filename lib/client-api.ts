"use client";

export function getCsrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)qs_csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export async function api<T = unknown>(
  path: string,
  options: RequestInit & { json?: unknown } = {}
): Promise<{ ok: boolean; data?: T; error?: string }> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  if (options.json !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (options.method && options.method !== "GET") {
    headers["x-csrf-token"] = getCsrfToken();
  }

  let res: Response;
  try {
    res = await fetch(path, {
      ...options,
      headers,
      body: options.json !== undefined ? JSON.stringify(options.json) : options.body,
    });
  } catch {
    return { ok: false, error: "تعذر الاتصال بالخادم، تحقق من الإنترنت وحاول مجددًا" };
  }

  let body: { ok: boolean; data?: T; error?: string } = { ok: false };
  try {
    body = await res.json();
  } catch {
    body = { ok: res.ok, error: res.statusText };
  }

  if (!res.ok) {
    return { ok: false, error: body.error || "حدث خطأ غير متوقع" };
  }
  return body;
}
