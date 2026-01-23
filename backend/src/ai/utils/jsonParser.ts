/**
 * Robust JSON Extraction Utility for AI Responses
 *
 * Handles various output patterns from AI providers (especially Gemini):
 * - Markdown-wrapped JSON: ```json\n{...}\n```
 * - Text before JSON: "Here's the response:\n{...}"
 * - Malformed/truncated JSON
 * - Control characters in string values
 * - JSON arrays
 */

/**
 * Extract and parse JSON from AI response content
 * Uses multiple strategies to handle various AI output patterns
 *
 * @param content - Raw AI response content
 * @returns Parsed JSON object of type T
 * @throws Error if no valid JSON can be extracted
 */
export function extractJSON<T>(content: string): T {
  if (!content || typeof content !== 'string') {
    throw new Error('Invalid input: content must be a non-empty string');
  }

  const trimmedContent = content.trim();

  // Strategy 1: Direct parse (clean JSON)
  try {
    return JSON.parse(trimmedContent);
  } catch {
    // Continue to next strategy
  }

  // Strategy 2: Strip markdown code blocks
  const markdownStripped = stripMarkdownCodeBlocks(trimmedContent);
  if (markdownStripped !== trimmedContent) {
    try {
      return JSON.parse(markdownStripped);
    } catch {
      // Continue to next strategy
    }
  }

  // Strategy 3: Extract JSON object from text (first { to last })
  const jsonObjectMatch = trimmedContent.match(/\{[\s\S]*\}/);
  if (jsonObjectMatch) {
    try {
      return JSON.parse(jsonObjectMatch[0]);
    } catch {
      // Try with control character cleaning
      try {
        const cleaned = cleanControlCharacters(jsonObjectMatch[0]);
        return JSON.parse(cleaned);
      } catch {
        // Continue to next strategy
      }
    }
  }

  // Strategy 4: Extract JSON array from text (first [ to last ])
  const jsonArrayMatch = trimmedContent.match(/\[[\s\S]*\]/);
  if (jsonArrayMatch) {
    try {
      return JSON.parse(jsonArrayMatch[0]);
    } catch {
      // Try with control character cleaning
      try {
        const cleaned = cleanControlCharacters(jsonArrayMatch[0]);
        return JSON.parse(cleaned);
      } catch {
        // Continue to next strategy
      }
    }
  }

  // Strategy 5: Aggressive cleaning and retry on markdown-stripped content
  const aggressivelyCleaned = aggressiveClean(markdownStripped);
  const cleanedObjectMatch = aggressivelyCleaned.match(/\{[\s\S]*\}/);
  if (cleanedObjectMatch) {
    try {
      return JSON.parse(cleanedObjectMatch[0]);
    } catch {
      // Continue to next strategy
    }
  }

  // Strategy 6: Try to fix truncated JSON
  const fixedTruncated = tryFixTruncatedJSON(markdownStripped);
  if (fixedTruncated) {
    try {
      return JSON.parse(fixedTruncated);
    } catch {
      // Continue to error
    }
  }

  // Log the content for debugging
  console.error('Failed to extract JSON from AI response.');
  console.error('Content preview (first 500 chars):', trimmedContent.substring(0, 500));

  throw new Error('Failed to extract valid JSON from AI response');
}

/**
 * Strip markdown code blocks from content
 * Handles: ```json\n{...}\n``` and ```\n{...}\n```
 */
function stripMarkdownCodeBlocks(content: string): string {
  let cleaned = content.trim();

  // Remove opening markdown code block with optional language identifier
  cleaned = cleaned.replace(/^```(?:json|JSON)?\s*\n?/i, '');

  // Remove closing markdown code block
  cleaned = cleaned.replace(/\n?```\s*$/i, '');

  return cleaned.trim();
}

/**
 * Clean control characters from JSON string
 * Preserves valid escape sequences
 */
function cleanControlCharacters(content: string): string {
  // Replace unescaped control characters in string values
  return content.replace(
    /"((?:[^"\\]|\\.)*)"/g,
    (match, stringContent: string) => {
      const escaped = stringContent
        .replace(/\r\n/g, '\\n')
        .replace(/\r/g, '\\n')
        .replace(/\n/g, '\\n')
        .replace(/\t/g, '\\t')
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove other control chars
      return `"${escaped}"`;
    }
  );
}

/**
 * Aggressive cleaning for heavily malformed content
 */
function aggressiveClean(content: string): string {
  return content
    // Remove all control characters except common whitespace
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize newlines
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove any "json" or "JSON" prefix that might appear
    .replace(/^(?:json|JSON)\s*/i, '')
    .trim();
}

/**
 * Try to fix truncated JSON by adding missing closing brackets
 */
function tryFixTruncatedJSON(content: string): string | null {
  // Find JSON-like content
  const jsonMatch = content.match(/\{[\s\S]*/);
  if (!jsonMatch) {
    return null;
  }

  let jsonStr = jsonMatch[0];

  // Remove trailing control characters
  jsonStr = jsonStr.replace(/[\x00-\x1F\x7F-\x9F]+$/, '');

  // Count opening and closing braces/brackets
  const openBraces = (jsonStr.match(/\{/g) || []).length;
  const closeBraces = (jsonStr.match(/\}/g) || []).length;
  const openBrackets = (jsonStr.match(/\[/g) || []).length;
  const closeBrackets = (jsonStr.match(/\]/g) || []).length;

  // If balanced, return as-is
  if (openBraces === closeBraces && openBrackets === closeBrackets) {
    return jsonStr;
  }

  // Try to fix truncated JSON
  // Check if we're in an unterminated string
  const lastQuote = jsonStr.lastIndexOf('"');
  const lastColon = jsonStr.lastIndexOf(':');
  const lastComma = jsonStr.lastIndexOf(',');

  // If the last meaningful character suggests an incomplete value
  if (lastColon > lastQuote && lastColon > lastComma) {
    // Truncated after a key, add empty string value
    jsonStr += '""';
  } else if (!jsonStr.trim().endsWith('"') && !jsonStr.trim().endsWith('}') &&
    !jsonStr.trim().endsWith(']') && !jsonStr.trim().endsWith(',')) {
    // Possibly in the middle of a string
    jsonStr += '"';
  }

  // Add missing closing brackets
  for (let i = 0; i < openBrackets - closeBrackets; i++) {
    jsonStr += ']';
  }

  // Add missing closing braces
  for (let i = 0; i < openBraces - closeBraces; i++) {
    jsonStr += '}';
  }

  return jsonStr;
}

/**
 * Safely extract JSON with a fallback value
 * Returns the fallback if extraction fails instead of throwing
 *
 * @param content - Raw AI response content
 * @param fallback - Value to return if extraction fails
 * @returns Parsed JSON or fallback value
 */
export function extractJSONSafe<T>(content: string, fallback: T): T {
  try {
    return extractJSON<T>(content);
  } catch {
    return fallback;
  }
}
