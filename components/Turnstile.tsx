"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, options: Record<string, unknown>) => string;
      getResponse: (widgetId?: string) => string | undefined;
      reset: (widgetId?: string) => void;
    };
    turnstileWidgetIds?: Record<string, string>;
  }
}

export default function Turnstile({ id }: { id: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey || !ref.current) return;
    const scriptId = "turnstile-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    const render = () => {
      if (!window.turnstile || !ref.current) return;
      const widgetId = window.turnstile.render(ref.current, {
        sitekey: siteKey,
        theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
      });
      window.turnstileWidgetIds = window.turnstileWidgetIds || {};
      window.turnstileWidgetIds[id] = widgetId;
    };

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.onload = render;
      document.head.appendChild(script);
    } else {
      render();
    }

    return () => {
      if (window.turnstile && window.turnstileWidgetIds?.[id]) {
        window.turnstile.reset(window.turnstileWidgetIds[id]);
      }
    };
  }, [id, siteKey]);

  if (!siteKey) return null;
  return <div ref={ref} className="turnstile-wrapper flex justify-center" />;
}

export function getTurnstileToken(id: string): string {
  if (!window.turnstile) return "";
  const widgetId = window.turnstileWidgetIds?.[id];
  return window.turnstile.getResponse(widgetId) || "";
}
