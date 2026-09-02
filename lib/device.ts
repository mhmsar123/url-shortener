import UAParser from "ua-parser-js";

export type DeviceInfo = {
  deviceType: string;
  browser: string;
  os: string;
};

export function parseDevice(userAgent: string | null): DeviceInfo {
  const fallback: DeviceInfo = { deviceType: "desktop", browser: "Unknown", os: "Unknown" };
  if (!userAgent) return fallback;

  try {
    const parser = new UAParser();
    parser.setUA(userAgent);
    const result = parser.getResult();

    let deviceType = "desktop";
    if (result.device?.type === "mobile") deviceType = "mobile";
    else if (result.device?.type === "tablet") deviceType = "tablet";

    return {
      deviceType,
      browser: result.browser?.name || "Unknown",
      os: result.os?.name || "Unknown",
    };
  } catch {
    return fallback;
  }
}
