import React from 'react';
import katex from 'katex';

export function MathBlock({ formula, className }: { formula: string; className?: string }) {
  const html = katex.renderToString(formula, { displayMode: true, throwOnError: false });
  return (
    <div
      className={`py-2 overflow-x-auto font-serif text-forest-900 ${className || ''}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function MathInline({ formula, className }: { formula: string; className?: string }) {
  const html = katex.renderToString(formula, { displayMode: false, throwOnError: false });
  return (
    <span
      className={`font-serif text-forest-900 ${className || ''}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
