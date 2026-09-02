/**
 * التحقق من Cloudflare Turnstile (CAPTCHA مجاني).
 * إن لم تكن المفاتيح مضبوطة، يُعتبر التحقق ناجحًا تلقائيًا.
 */
export function isTurnstileEnabled(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY
  );
}

export async function verifyTurnstile(token: string | null): Promise<boolean> {
  if (!isTurnstileEnabled()) return true;
  if (!token) return false;

  try {
    const form = new URLSearchParams();
    form.append("secret", process.env.TURNSTILE_SECRET_KEY!);
    form.append("response", token);

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: form,
      cache: "no-store",
    });
    const data = (await res.json()) as { success?: boolean };
    return Boolean(data.success);
  } catch {
    return false;
  }
}
