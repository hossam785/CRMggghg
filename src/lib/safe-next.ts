/**
 * Sanitizes the `next` redirect parameter to strictly prevent open redirect vulnerabilities.
 * Only relative internal application paths are allowed.
 * Edge cases like `//evil.com`, `/\\evil`, `https://...`, and protocol-relative URLs return `/`.
 */
export function safeNext(next: string | null | undefined): string {
  if (!next || typeof next !== 'string') {
    return '/';
  }

  // Disallow carriage return, line feeds, tabs in raw input
  if (/[\r\n\t]/.test(next)) {
    return '/';
  }

  const trimmed = next.trim();

  // Must start with '/'
  if (!trimmed.startsWith('/')) {
    return '/';
  }

  // Must NOT start with '//' (protocol-relative URL)
  if (trimmed.startsWith('//')) {
    return '/';
  }

  // Must NOT start with '/\' (Windows-style backslash bypass)
  if (trimmed.startsWith('/\\')) {
    return '/';
  }

  // Disallow carriage return, line feeds, tabs
  if (/[\r\n\t]/.test(trimmed)) {
    return '/';
  }

  // If there's a colon, ensure it's not a protocol injection (e.g. /http:// or /javascript:)
  if (trimmed.includes(':')) {
    try {
      const parsed = new URL(trimmed, 'http://localhost');
      if (parsed.origin !== 'http://localhost') {
        return '/';
      }
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
      return '/';
    }
  }

  return trimmed;
}
