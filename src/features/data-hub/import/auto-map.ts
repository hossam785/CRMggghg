import type {
  CountryRef,
  IndustryRef,
  LeadField,
  Mapping,
  MappingTarget,
  SavedMapping,
} from './types';
import { HEADER_SYNONYMS } from './header-synonyms';
import {
  levenshteinDistance,
  matchCountry,
  matchStage,
  matchTriState,
  normalizeText,
} from './value-matchers';
import { generateHeaderSignature } from './saved-mappings';

export function autoMapColumns(
  headers: string[],
  samples: string[][],
  ctx: {
    industries: IndustryRef[];
    countries: CountryRef[];
    savedMappings: SavedMapping[];
  }
): Mapping {
  const result: Mapping = {};
  const sig = generateHeaderSignature(headers);
  const saved = ctx.savedMappings.find((s) => s.signature === sig);

  headers.forEach((header, colIndex) => {
    // 1. Saved mapping takes absolute priority if present
    if (saved && saved.mapping[header]) {
      result[header] = {
        target: saved.mapping[header],
        confidence: 1.0,
        reason: 'saved_mapping',
      };
      return;
    }

    const normHeader = normalizeText(header);
    const colSamples = samples
      .map((row) => row[colIndex])
      .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
      .slice(0, 50);

    // 2. Score by Header Synonyms
    let bestHeaderTarget: LeadField | null = null;
    let bestHeaderScore = 0;
    let bestHeaderReason = '';

    for (const [field, synonyms] of Object.entries(HEADER_SYNONYMS) as [LeadField, string[]][]) {
      for (const syn of synonyms) {
        const normSyn = normalizeText(syn);
        if (normHeader === normSyn) {
          if (1.0 > bestHeaderScore) {
            bestHeaderScore = 1.0;
            bestHeaderTarget = field;
            bestHeaderReason = 'exact_header';
          }
        } else if (normHeader.startsWith(normSyn) || normSyn.startsWith(normHeader)) {
          if (0.85 > bestHeaderScore) {
            bestHeaderScore = 0.85;
            bestHeaderTarget = field;
            bestHeaderReason = 'prefix_header';
          }
        } else if (normHeader.includes(normSyn) || normSyn.includes(normHeader)) {
          if (0.75 > bestHeaderScore) {
            bestHeaderScore = 0.75;
            bestHeaderTarget = field;
            bestHeaderReason = 'partial_header';
          }
        } else if (levenshteinDistance(normHeader, normSyn) <= 2) {
          if (0.65 > bestHeaderScore) {
            bestHeaderScore = 0.65;
            bestHeaderTarget = field;
            bestHeaderReason = 'fuzzy_header';
          }
        }
      }
    }

    // 3. Content Sniffing
    let sniffTarget: LeadField | null = null;
    let sniffScore = 0;
    let sniffReason = '';

    if (colSamples.length >= 3) {
      let igHits = 0;
      let phoneHits = 0;
      let countryHits = 0;
      let stageHits = 0;
      let triHits = 0;

      for (const s of colSamples) {
        const clean = s.trim();
        // Instagram handle or link
        if (
          clean.includes('instagram.com/') ||
          clean.startsWith('@') ||
          /^[a-zA-Z0-9._]{3,30}$/.test(clean)
        ) {
          igHits++;
        }
        // Phone / WhatsApp
        const digitsOnly = clean.replace(/\D/g, '');
        if (clean.startsWith('+') || (digitsOnly.length >= 8 && digitsOnly.length <= 15)) {
          phoneHits++;
        }
        // Country
        if (matchCountry(clean, ctx.countries) !== null) {
          countryHits++;
        }
        // Stage
        if (matchStage(clean) !== null) {
          stageHits++;
        }
        // Tri-state
        if (matchTriState(clean) !== null) {
          triHits++;
        }
      }

      const total = colSamples.length;
      if (phoneHits / total >= 0.6) {
        sniffTarget = 'whatsapp';
        sniffScore = 0.9;
        sniffReason = 'content_sniff_phone';
      } else if (igHits / total >= 0.6 && !['name', 'company'].includes(bestHeaderTarget || '')) {
        sniffTarget = 'instagram';
        sniffScore = 0.85;
        sniffReason = 'content_sniff_instagram';
      } else if (countryHits / total >= 0.6) {
        sniffTarget = 'country';
        sniffScore = 0.85;
        sniffReason = 'content_sniff_country';
      } else if (stageHits / total >= 0.6) {
        sniffTarget = 'stage';
        sniffScore = 0.8;
        sniffReason = 'content_sniff_stage';
      } else if (triHits / total >= 0.7 && !bestHeaderTarget) {
        sniffTarget = 'has_content';
        sniffScore = 0.7;
        sniffReason = 'content_sniff_tristate';
      }
    }

    // 4. Combine Header and Content signals
    let finalTarget: MappingTarget = 'ignore';
    let finalScore = 0;
    let finalReason = 'unrecognized';

    if (bestHeaderScore >= 0.85) {
      finalTarget = bestHeaderTarget!;
      finalScore = bestHeaderScore;
      finalReason = bestHeaderReason;
    } else if (sniffScore >= 0.85) {
      finalTarget = sniffTarget!;
      finalScore = sniffScore;
      finalReason = sniffReason;
    } else if (bestHeaderScore >= 0.6) {
      finalTarget = bestHeaderTarget!;
      finalScore = bestHeaderScore;
      finalReason = bestHeaderReason;
    } else if (sniffScore >= 0.6) {
      finalTarget = sniffTarget!;
      finalScore = sniffScore;
      finalReason = sniffReason;
    }

    // Default to ignore if low confidence
    if (finalScore < 0.5) {
      finalTarget = 'ignore';
      finalScore = 0;
    }

    result[header] = {
      target: finalTarget,
      confidence: finalScore,
      reason: finalReason,
    };
  });

  return result;
}
