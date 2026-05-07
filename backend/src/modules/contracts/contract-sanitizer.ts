import sanitizeHtml from 'sanitize-html';

/**
 * Sanitiza el HTML de un contrato antes de guardarlo en la BD o renderizarlo
 * en Puppeteer para PDF. Bloquea:
 *  - <script>, <iframe>, <object>, <embed>, <link rel="import">
 *  - srcdoc, on* handlers, javascript: URLs
 *  - <img src=http://...> (sólo data: y https: a hosts conocidos para imágenes legítimas)
 *  - @import dentro de <style>
 * Esto evita SSRF/XSS desde HTML generado por la IA o pegado por el usuario.
 */
export function sanitizeContractHtml(html: string | null | undefined): string {
  if (!html) return '';

  return sanitizeHtml(html, {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'ul', 'ol', 'li',
      'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup',
      'blockquote', 'cite',
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th',
      'div', 'span',
      'a',
    ],
    allowedAttributes: {
      '*': ['style', 'class'],
      'a': ['href', 'target', 'rel'],
      'td': ['colspan', 'rowspan'],
      'th': ['colspan', 'rowspan'],
    },
    allowedSchemes: ['https', 'mailto', 'tel'],
    allowedSchemesByTag: {},
    allowProtocolRelative: false,
    // Remover por completo cualquier estilo que contenga url(...) o expression(...)
    transformTags: {
      'a': (tagName, attribs) => ({
        tagName: 'a',
        attribs: {
          ...attribs,
          rel: 'noopener noreferrer',
          target: attribs.target || '_self',
        },
      }),
    },
    allowedStyles: {
      '*': {
        // Solo propiedades visuales seguras y valores que no permitan url()
        'color': [/^#(0x)?[0-9a-f]+$/i, /^rgb\(/, /^[a-z]+$/i],
        'background-color': [/^#(0x)?[0-9a-f]+$/i, /^rgb\(/, /^[a-z]+$/i],
        'background': [/^#(0x)?[0-9a-f]+$/i, /^rgb\(/, /^[a-z]+$/i],
        'text-align': [/^left$|^right$|^center$|^justify$/],
        'font-size': [/^\d+(?:px|pt|em|rem|%)$/],
        'font-weight': [/^\d+$|^bold$|^normal$/],
        'font-family': [/^[a-zA-Z\s,'"-]+$/],
        'font-style': [/^italic$|^normal$|^oblique$/],
        'text-decoration': [/^underline$|^none$|^line-through$/],
        'margin': [/^[\d.\s]+(?:px|pt|em|rem|%)?$/],
        'margin-top': [/^[\d.\s]+(?:px|pt|em|rem|%)?$/],
        'margin-bottom': [/^[\d.\s]+(?:px|pt|em|rem|%)?$/],
        'margin-left': [/^[\d.\s]+(?:px|pt|em|rem|%)?$/],
        'margin-right': [/^[\d.\s]+(?:px|pt|em|rem|%)?$/],
        'padding': [/^[\d.\s]+(?:px|pt|em|rem|%)?$/],
        'padding-top': [/^[\d.\s]+(?:px|pt|em|rem|%)?$/],
        'padding-bottom': [/^[\d.\s]+(?:px|pt|em|rem|%)?$/],
        'padding-left': [/^[\d.\s]+(?:px|pt|em|rem|%)?$/],
        'padding-right': [/^[\d.\s]+(?:px|pt|em|rem|%)?$/],
        'border': [/^[\d.\s]+(?:px|pt|em)?\s+(?:solid|dashed|dotted)\s+#?[0-9a-f]+$/i],
        'border-top': [/^[\d.\s]+(?:px|pt|em)?\s+(?:solid|dashed|dotted)\s+#?[0-9a-f]+$/i],
        'border-bottom': [/^[\d.\s]+(?:px|pt|em)?\s+(?:solid|dashed|dotted)\s+#?[0-9a-f]+$/i],
        'border-left': [/^[\d.\s]+(?:px|pt|em)?\s+(?:solid|dashed|dotted)\s+#?[0-9a-f]+$/i],
        'border-right': [/^[\d.\s]+(?:px|pt|em)?\s+(?:solid|dashed|dotted)\s+#?[0-9a-f]+$/i],
        'width': [/^[\d.]+(?:px|pt|em|rem|%)$/],
        'height': [/^[\d.]+(?:px|pt|em|rem|%)$/],
        'max-width': [/^[\d.]+(?:px|pt|em|rem|%)$/],
        'display': [/^block$|^inline$|^inline-block$|^flex$|^none$/],
        'line-height': [/^[\d.]+$|^[\d.]+(?:px|pt|em|rem|%)$/],
        'letter-spacing': [/^[\d.-]+(?:px|pt|em|rem)$/],
      },
    },
  });
}
