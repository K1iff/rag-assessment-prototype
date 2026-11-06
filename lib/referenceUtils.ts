/**
 * Shared utility functions for reference titles and citations formatting.
 */

/**
 * Universal Reference Title Sanitization
 * 1. Strips leading numeric IDs, storage timestamps, and following separators (e.g., 1791434066986_, 123-).
 * 2. Strips .pdf extension (case-insensitive).
 * 3. Replaces single or multiple underscores with clean spaces.
 * 4. Collapses redundant whitespace and trims.
 */
export function formatReferenceTitle(rawTitle: string | null | undefined): string {
  if (!rawTitle) return '';
  return String(rawTitle)
    // 1. Strip leading numeric IDs, timestamps, and following separators
    .replace(/^(\d+[\s_\-]+)+/, '')
    // 2. Strip .pdf extension (case-insensitive)
    .replace(/\.pdf$/i, '')
    // 3. Replace single or multiple underscores with spaces
    .replace(/_+/g, ' ')
    // 4. Collapse redundant whitespace and trim
    .replace(/\s+/g, ' ')
    .trim();
}

export interface CitationItem {
  id: string;
  title: string;
  rawTitle: string;
  pages?: string;
}

/**
 * Parses raw citations (JSON string, array of objects, or pipe-delimited string)
 * into structured CitationItem objects with sanitized titles and extracted page numbers.
 */
export function parseCitations(rawCitations: any): CitationItem[] {
  if (!rawCitations) return [];

  let parsed: any = rawCitations;
  try {
    while (typeof parsed === 'string') {
      const trimmed = parsed.trim();
      if (
        (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
        (trimmed.startsWith('{') && trimmed.endsWith('}'))
      ) {
        parsed = JSON.parse(trimmed);
      } else {
        break;
      }
    }
  } catch {
    // Keep as string if parsing fails
  }

  // Case 1: Array of objects e.g. [{ source: "...", page: 12 }, ...]
  if (Array.isArray(parsed) && parsed.length > 0) {
    const docMap: Record<string, Set<number>> = {};
    parsed.forEach((item: any) => {
      if (!item) return;
      const rawSource =
        item.source ||
        item.document ||
        item.doc ||
        (typeof item === 'string' ? item : 'Unknown Document');
      if (!docMap[rawSource]) {
        docMap[rawSource] = new Set<number>();
      }
      if (item.page !== undefined && item.page !== null) {
        const pageNum = Number(item.page);
        if (!isNaN(pageNum)) {
          docMap[rawSource].add(pageNum);
        }
      }
    });

    return Object.keys(docMap).map((rawSource, idx) => {
      const pagesArr = Array.from(docMap[rawSource]).sort((a, b) => a - b);
      const cleanTitle = formatReferenceTitle(rawSource);
      return {
        id: `cite-${idx}-${cleanTitle}`,
        title: cleanTitle || rawSource,
        rawTitle: rawSource,
        pages: pagesArr.length > 0 ? `Pages: ${pagesArr.join(', ')}` : undefined,
      };
    });
  }

  // Case 2: String (joined by " | " or single text)
  const citationStr = String(parsed || '').replace(/^["']|["']$/g, '').trim();
  if (!citationStr || citationStr.toLowerCase() === 'no citation provided') {
    return [];
  }

  const parts = citationStr.split(/\s*\|\s*/);
  const items: CitationItem[] = [];

  parts.forEach((part, idx) => {
    const trimmedPart = part.trim();
    if (!trimmedPart || trimmedPart.toLowerCase() === 'no citation provided') return;

    // Separate textbook title from page numbers
    // Matches patterns like ", Pages: 388, 475" or "; Page: 12"
    const pageMatch = trimmedPart.match(/(?:,\s*|\s*;\s*|\s+)(pages?:\s*[\d,\s\-]+)$/i);
    let rawTitle = trimmedPart;
    let pages: string | undefined = undefined;

    if (pageMatch && pageMatch.index !== undefined) {
      rawTitle = trimmedPart.slice(0, pageMatch.index).trim();
      pages = pageMatch[1].trim().replace(/^pages?:\s*/i, 'Pages: ');
    }

    const cleanTitle = formatReferenceTitle(rawTitle);
    items.push({
      id: `cite-part-${idx}-${cleanTitle}`,
      title: cleanTitle || rawTitle,
      rawTitle,
      pages,
    });
  });

  return items;
}

/**
 * Helper to produce a clean pipe-delimited summary string if needed.
 */
export function formatCitations(rawCitations: any): string {
  const items = parseCitations(rawCitations);
  if (items.length === 0) return 'No citation provided';
  return items
    .map((item) => (item.pages ? `${item.title}, ${item.pages}` : item.title))
    .join(' | ');
}

