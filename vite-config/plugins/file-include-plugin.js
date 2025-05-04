import { escapeCodeAndPre, unescapeCodeAndPre, processIncludes } from '../utils/html-utils.js';

/**
 * Плагин для обработки директив @@include в HTML
 * @returns {Object} Vite плагин
 */
export function fileIncludePlugin() {
  return {
    name: 'vite:file-include',
    order: 'pre',
    transformIndexHtml: {
      handler(html, { filename }) {
        // Экранируем код и обрабатываем включения
        const escapedHtml = escapeCodeAndPre(html);
        const processedHtml = processIncludes(escapedHtml, null, filename);
        return unescapeCodeAndPre(processedHtml);
      },
    },
  };
} 