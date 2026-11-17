import { WHATSAPP_MESSAGE } from "./constants";

/**
 * Normalise a Nepali mobile number to its 10-digit national form (98XXXXXXXX).
 * Accepts spaces, dashes, brackets and an optional +977 / 977 / 00977 prefix.
 * Returns null when the input is not a valid Nepali mobile number.
 */
export function normalizeNepaliMobile(input: string): string | null {
  let digits = input.replace(/[\s\-().]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (digits.startsWith("00977")) digits = digits.slice(5);
  else if (digits.startsWith("977") && digits.length === 13) digits = digits.slice(3);
  if (!/^\d+$/.test(digits)) return null;
  // Nepal mobile numbers: 10 digits beginning with 96, 97 or 98 (NTC, Ncell, SmartCell).
  return /^9[678]\d{8}$/.test(digits) ? digits : null;
}

export function isValidNepaliMobile(input: string) {
  return normalizeNepaliMobile(input) !== null;
}

/** 98XXXXXXXX → 98XX-XXX-XXX for display. */
export function formatMobile(normalized: string) {
  if (!/^\d{10}$/.test(normalized)) return normalized;
  return `${normalized.slice(0, 4)}-${normalized.slice(4, 7)}-${normalized.slice(7)}`;
}

export function telLink(normalized: string) {
  return `tel:+977${normalized}`;
}

export function whatsappLink(normalized: string, message: string = WHATSAPP_MESSAGE) {
  return `https://wa.me/977${normalized}?text=${encodeURIComponent(message)}`;
}
