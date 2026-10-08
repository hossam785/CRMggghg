import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js/min';
import { normalizeArabicDigits } from './arabic';

export type ParsePhoneResult =
  | { ok: true; e164: string; country?: string }
  | { ok: false; reason: 'empty' | 'invalid' };

/**
 * Parses and validates an international phone number into E.164 format.
 * Accepts Arabic-Indic numerals, spaces, dashes, parentheses, and 00 prefix.
 * Uses defaultCountry (default 'EG') as the fallback region for local numbers.
 */
export function parsePhone(
  input: string | null | undefined,
  defaultCountry: string = 'EG'
): ParsePhoneResult {
  if (!input) {
    return { ok: false, reason: 'empty' };
  }

  // 1. Convert Arabic-Indic digits to ASCII digits
  let cleaned = normalizeArabicDigits(input.trim());
  if (!cleaned) {
    return { ok: false, reason: 'empty' };
  }

  // 2. Convert leading "00" international prefix to "+"
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  }

  // Clean country code
  const region = (defaultCountry.toUpperCase().slice(0, 2) || 'EG') as CountryCode;

  try {
    const phoneNumber = parsePhoneNumberFromString(cleaned, region);
    if (phoneNumber && phoneNumber.isValid()) {
      return {
        ok: true,
        e164: phoneNumber.number, // e.g. "+201012345678"
        country: phoneNumber.country,
      };
    }
  } catch {
    // Ignore parse error and return invalid
  }

  return { ok: false, reason: 'invalid' };
}

/**
 * Generates a direct WhatsApp click-to-chat URL from an E.164 phone number.
 */
export function waUrl(e164: string): string {
  const digits = e164.replace(/\D/g, '');
  return `https://wa.me/${digits}`;
}
