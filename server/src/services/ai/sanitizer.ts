/**
 * Sanitizes and encapsulates untrusted input to defend against prompt injection in uploaded files.
 */
export function sanitizeUntrustedDocumentText(rawText: string): string {
  if (!rawText) return '';

  // Limit raw document length to prevent context flooding
  const truncated = rawText.substring(0, 30000);

  // Neutralize common prompt injection patterns
  const neutralized = truncated
    .replace(/(?:ignore|disregard|forget)\s+(?:all\s+)?(?:previous|prior)\s+instructions/gi, '[REDACTED_COMMAND]')
    .replace(/(?:system\s*prompt|system\s*message|developer\s*mode)/gi, '[REDACTED_KEYWORD]')
    .replace(/<\/?(?:system|instruction|user|assistant)>/gi, '');

  // Encapsulate in strict delimiter tags
  return `<untrusted_lab_document>\n${neutralized}\n</untrusted_lab_document>`;
}
