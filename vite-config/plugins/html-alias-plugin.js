import { escapeCodeAndPre, unescapeCodeAndPre } from '../utils/html-utils.js';

/**
 * Плагин для обработки алиасов в HTML
 * @param {Object} aliases - Объект с алиасами
 * @returns {Object} Vite плагин
 */
export function htmlAliasPlugin(aliases) {
  return {
    name: 'vite:html-alias',
    transformIndexHtml(html) {
      // Экранируем код
      const escapedHtml = escapeCodeAndPre(html);
      let result = escapedHtml;

      // Заменяем абсолютные пути CSS/JS на относительные без ./
      result = result.replace(/(href|src)=["']\/([^"']+)["']/g, '$1="$2"');

      // Заменяем алиасы в атрибутах
      Object.keys(aliases).forEach((alias) => {
        const escapedAlias = alias.replace('@', '\\@');
        const aliasRegex = new RegExp(
          `(src|href|url|poster|data-src|data-background|srcset)=["']${escapedAlias}/([^"']+)["']`,
          'g'
        );
        result = result.replace(aliasRegex, (match, attr, path) => {
          return `${attr}="${aliases[alias]}/${path}"`;
        });
        
        // Отдельная обработка для атрибута srcset с множественными значениями
        const srcsetRegex = new RegExp(
          `srcset=["']([^"']*?)${escapedAlias}/([^"'\\s]+)([^"']*?)["']`,
          'g'
        );
        result = result.replace(srcsetRegex, (match, before, path, after) => {
          return `srcset="${before}${aliases[alias]}/${path}${after}"`;
        });
        
        // Обработка нескольких алиасов в одном атрибуте srcset
        const multiSrcsetRegex = new RegExp(
          `${escapedAlias}/([^"'\\s,]+)`,
          'g'
        );
        result = result.replace(/srcset=["']([^"']+)["']/g, (match, content) => {
          const replacedContent = content.replace(multiSrcsetRegex, `${aliases[alias]}/$1`);
          return `srcset="${replacedContent}"`;
        });
      });

      // Обработка URL в инлайн-стилях с background-image
      // 1. Для алиасов @img, @files, и т.д. в background-image
      const aliasInStylesRegex = /style=["']([^"']*)background-image:\s*url\((['"]?)(@[a-zA-Z0-9_-]+)\/([^'")]+)(['"]?)\)([^"']*)["']/g;
      result = result.replace(aliasInStylesRegex, (match, before, quote1, alias, path, quote2, after) => {
        if (aliases[alias]) {
          return `style="${before}background-image: url(${quote1}${aliases[alias]}/${path}${quote2})${after}"`;
        }
        return match;
      });
      
      // 2. Для абсолютных путей (/img, /files, и т.д.) в background-image
      const absoluteInStylesRegex = /style=["']([^"']*)background-image:\s*url\((['"]?)\/([^'")]+)(['"]?)\)([^"']*)["']/g;
      result = result.replace(absoluteInStylesRegex, (match, before, quote1, path, quote2, after) => {
        return `style="${before}background-image: url(${quote1}${path}${quote2})${after}"`;
      });
      
      // 3. Для алиасов в сокращенной записи background: url()
      const aliasInBgShortRegex = /style=["']([^"']*)background\s*:\s*url\((['"]?)(@[a-zA-Z0-9_-]+)\/([^'")]+)(['"]?)\)([^"']*)["']/g;
      result = result.replace(aliasInBgShortRegex, (match, before, quote1, alias, path, quote2, after) => {
        if (aliases[alias]) {
          return `style="${before}background: url(${quote1}${aliases[alias]}/${path}${quote2})${after}"`;
        }
        return match;
      });
      
      // 4. Для абсолютных путей в сокращенной записи background: url()
      const absoluteInBgShortRegex = /style=["']([^"']*)background\s*:\s*url\((['"]?)\/([^'")]+)(['"]?)\)([^"']*)["']/g;
      result = result.replace(absoluteInBgShortRegex, (match, before, quote1, path, quote2, after) => {
        return `style="${before}background: url(${quote1}${path}${quote2})${after}"`;
      });

      // Восстанавливаем экранированный код
      return unescapeCodeAndPre(result);
    },
  };
} 