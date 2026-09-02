import { randomInt } from "node:crypto";

/**
 * الأبجدية آمنة بصريًا: بدون 0/O و 1/I/l لتجنب الالتباس.
 */
const ALPHABET = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ";

export function generateShortCode(length = 6): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[randomInt(ALPHABET.length)];
  }
  return out;
}

export function isValidShortCode(code: string): boolean {
  return /^[a-zA-Z0-9-_]{3,32}$/.test(code);
}
