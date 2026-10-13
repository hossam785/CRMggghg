'use client';

import * as React from 'react';
import { normalizeSearch } from '@/lib/normalize/arabic';
import { cn } from '@/lib/utils';

export interface HighlightProps {
  text: string;
  query?: string | null;
  className?: string;
  highlightClassName?: string;
}

const ARABIC_DIACRITICS_REGEX = /[\u064B-\u065F\u0670\u0640]/;

/**
 * Safely highlights matching query tokens within a text string using normalized Arabic comparison.
 * Preserves original diacritics, casing, and characters without dangerouslySetInnerHTML.
 */
export function Highlight({
  text,
  query,
  className,
  highlightClassName,
}: HighlightProps) {
  if (!text) return null;
  if (!query || !query.trim()) {
    return <span className={className}>{text}</span>;
  }

  const tokens = query
    .trim()
    .split(/\s+/)
    .map((t) => normalizeSearch(t))
    .filter((t) => t.length > 0);

  if (tokens.length === 0) {
    return <span className={className}>{text}</span>;
  }

  // 1. Build mapped normalized characters array tracking original text indices
  const normChars: Array<{ char: string; origIndex: number }> = [];

  for (let i = 0; i < text.length; i++) {
    const rawChar = text.charAt(i);
    if (ARABIC_DIACRITICS_REGEX.test(rawChar)) {
      continue; // Skip tashkeel and tatweel in the normalized representation
    }
    const norm = normalizeSearch(rawChar);
    if (norm) {
      normChars.push({ char: norm, origIndex: i });
    } else if (rawChar === ' ' || rawChar === '\t') {
      normChars.push({ char: ' ', origIndex: i });
    }
  }

  const normString = normChars.map((c) => c.char).join('');
  if (!normString) {
    return <span className={className}>{text}</span>;
  }

  // 2. Identify matching spans in original text coordinates
  const ranges: Array<{ start: number; end: number }> = [];

  for (const token of tokens) {
    let searchStart = 0;
    while (searchStart < normString.length) {
      const matchIndex = normString.indexOf(token, searchStart);
      if (matchIndex === -1) break;

      const normEndIndex = matchIndex + token.length - 1;
      const origStart = normChars[matchIndex]?.origIndex;
      const origEndChar = normChars[normEndIndex]?.origIndex;

      if (origStart !== undefined && origEndChar !== undefined) {
        // Expand end to include any trailing diacritics right after the matched char
        let origEnd = origEndChar + 1;
        while (origEnd < text.length && ARABIC_DIACRITICS_REGEX.test(text.charAt(origEnd))) {
          origEnd++;
        }
        ranges.push({ start: origStart, end: origEnd });
      }

      searchStart = matchIndex + 1;
    }
  }

  if (ranges.length === 0) {
    return <span className={className}>{text}</span>;
  }

  // 3. Merge overlapping or contiguous ranges
  ranges.sort((a, b) => a.start - b.start);
  const firstRange = ranges[0];
  if (!firstRange) {
    return <span className={className}>{text}</span>;
  }

  const mergedRanges: Array<{ start: number; end: number }> = [];
  let currentRange = { ...firstRange };

  for (let i = 1; i < ranges.length; i++) {
    const nextRange = ranges[i];
    if (!nextRange) continue;

    if (nextRange.start <= currentRange.end) {
      currentRange.end = Math.max(currentRange.end, nextRange.end);
    } else {
      mergedRanges.push(currentRange);
      currentRange = { ...nextRange };
    }
  }
  mergedRanges.push(currentRange);

  // 4. Construct React fragments
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;

  for (const range of mergedRanges) {
    if (range.start > lastIndex) {
      nodes.push(
        <React.Fragment key={`text-${lastIndex}`}>
          {text.slice(lastIndex, range.start)}
        </React.Fragment>
      );
    }

    nodes.push(
      <mark
        key={`match-${range.start}`}
        className={cn(
          'bg-primary/20 text-foreground font-semibold rounded-xs px-0.5 select-text',
          highlightClassName
        )}
      >
        {text.slice(range.start, range.end)}
      </mark>
    );

    lastIndex = range.end;
  }

  if (lastIndex < text.length) {
    nodes.push(
      <React.Fragment key={`text-${lastIndex}`}>
        {text.slice(lastIndex)}
      </React.Fragment>
    );
  }

  return <span className={className}>{nodes}</span>;
}
