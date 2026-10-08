const RESERVED_ROOTS = new Set([
  'p',
  'reel',
  'reels',
  'stories',
  'explore',
  'accounts',
  'direct',
  'tv',
]);

export type ParseInstagramResult =
  | { ok: true; handle: string }
  | { ok: false; reason: 'post_link' | 'invalid' | 'empty' };

/**
 * Parses, cleans, and validates an Instagram handle or profile URL.
 * Strips query strings, hashes, leading @, protocol, domains, and trailing dots/slashes.
 */
export function parseInstagram(input: string | null | undefined): ParseInstagramResult {
  if (!input) {
    return { ok: false, reason: 'empty' };
  }

  let s = input.trim();
  if (!s || s === '@') {
    return { ok: false, reason: 'empty' };
  }

  // Remove query string and hash
  s = ((s.split('?')[0] ?? '').split('#')[0] ?? '').trim();

  // If input is only the instagram domain with no path
  if (/^(?:https?:\/\/)?(?:www\.|m\.)?(?:instagram\.com|instagr\.am)\/?$/i.test(s)) {
    return { ok: false, reason: 'empty' };
  }

  // Handle URL forms
  const urlMatch = s.match(
    /^(?:https?:\/\/)?(?:www\.|m\.)?(?:instagram\.com|instagr\.am)\/(.+)$/i
  );

  let raw = s;
  if (urlMatch) {
    const path = (urlMatch[1] ?? '').trim();
    if (!path) {
      return { ok: false, reason: 'empty' };
    }

    // Split path into segments
    const segments = path.split('/').filter(Boolean);
    const firstSegment = segments[0];
    if (!firstSegment) {
      return { ok: false, reason: 'empty' };
    }

    const first = firstSegment.toLowerCase().replace(/^@/, '');
    if (RESERVED_ROOTS.has(first)) {
      return { ok: false, reason: 'post_link' };
    }

    raw = first;
  } else {
    // If not a full URL, strip leading '@'
    raw = raw.replace(/^@+/, '');
  }

  // Strip trailing slashes, dots, and whitespace
  raw = raw.replace(/[/.]+$/, '').trim().toLowerCase();

  if (!raw) {
    return { ok: false, reason: 'empty' };
  }

  // Check if it's a reserved keyword directly
  if (RESERVED_ROOTS.has(raw)) {
    return { ok: false, reason: 'post_link' };
  }

  // Validate Instagram handle format: 1-30 chars, lowercase alphanumeric, dot, underscore
  if (!/^[a-z0-9._]{1,30}$/.test(raw)) {
    return { ok: false, reason: 'invalid' };
  }

  return { ok: true, handle: raw };
}

/**
 * Formats a clean handle into a standard Instagram profile URL.
 */
export function instagramUrl(handle: string): string {
  const clean = handle.replace(/^@/, '').trim();
  return `https://www.instagram.com/${clean}/`;
}
