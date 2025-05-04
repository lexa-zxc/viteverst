import fs from 'fs';
import { resolve, join } from 'path';
import { PATHS } from '../config/paths.js';
import { escapeCodeAndPre, unescapeCodeAndPre } from '../utils/html-utils.js';
import { CONSOLE_COLORS } from '../config/constants.js';

/**
 * Плагин для исправления путей к шрифтам в CSS
 * @returns {Object} Vite плагин
 */
export function fixFontPathsPlugin() {
  return {
    name: 'fix-font-paths',
    apply: 'build',
    closeBundle: async () => {
      try {
        const cssDir = join(PATHS.dist, 'css');
        if (!fs.existsSync(cssDir)) return;

        fs.readdirSync(cssDir)
          .filter(file => file.endsWith('.css'))
          .forEach(cssFile => {
            const cssPath = join(cssDir, cssFile);
            let cssContent = fs.readFileSync(cssPath, 'utf-8');

            // Исправляем пути к шрифтам
            cssContent = cssContent.replace(
              /url\(['"]?\/fonts\/([^'")]+)['"]?\)/g,
              'url("../fonts/$1")'
            );

            fs.writeFileSync(cssPath, cssContent);
          });

        console.log(`${CONSOLE_COLORS.green}Пути к шрифтам исправлены${CONSOLE_COLORS.reset}`);
      } catch (error) {
        console.error('Ошибка при исправлении путей к шрифтам:', error);
      }
    }
  };
}

/**
 * Плагин для обработки HTML файлов (удаление лишних атрибутов, замена путей)
 * @returns {Object} Vite плагин
 */
export function processHtmlPlugin() {
  return {
    name: 'process-html',
    apply: 'build',
    closeBundle: async () => {
      try {
        const htmlFiles = fs.readdirSync(PATHS.dist)
          .filter(file => file.endsWith('.html'));

        htmlFiles.forEach(htmlFile => {
          const htmlPath = resolve(PATHS.dist, htmlFile);
          let htmlContent = fs.readFileSync(htmlPath, 'utf-8');

          // Экранируем код в тегах code и pre
          htmlContent = escapeCodeAndPre(htmlContent);

          // Удаление лишних атрибутов и исправление путей
          htmlContent = htmlContent
            .replace(/crossorigin/g, '')
            .replace(/type="module"/g, '')
            .replace(
              /<script[^>]*src="([^"]*\/)?js\/[^"]*\.js[^"]*"[^>]*>(<\/script>)?/g,
              '<script defer src="js/app.js"></script>'
            )
            .replace(
              /<link[^>]*href="([^"]*\/)?css\/[^"]*\.css[^"]*"[^>]*>/g,
              '<link rel="stylesheet" href="css/app.css">'
            )
            .replace(
              /<link[^>]*href="([^"]*\/)?scss\/[^"]*\.scss"[^>]*>/g,
              '<link rel="stylesheet" href="css/app.css">'
            );
            
          // Исправление путей в инлайн стилях с background-image
          const bgImageRegex = /style=["']([^"']*)background-image:\s*url\((['"]?)([^'")]+)(['"]?)\)([^"']*)["']/g;
          htmlContent = htmlContent.replace(bgImageRegex, (match, before, quote1, url, quote2, after) => {
            // Обрабатываем абсолютные пути
            if (url.startsWith('/')) {
              return `style="${before}background-image: url(${quote1}${url.substring(1)}${quote2})${after}"`;
            }
            // Если была ошибка с неправильно сформированным URL
            if (url.includes('=""')) {
              // Исправляем это
              const fixedUrl = url.replace(/\s*([a-zA-Z0-9_-]+)=""\s*([^"]+)/, '$1/$2');
              return `style="${before}background-image: url(${quote1}${fixedUrl}${quote2})${after}"`;
            }
            return match;
          });
          
          // Исправление путей в инлайн стилях с сокращенной записью background: url()
          const bgShortRegex = /style=["']([^"']*)background\s*:\s*url\((['"]?)([^'")]+)(['"]?)\)([^"']*)["']/g;
          htmlContent = htmlContent.replace(bgShortRegex, (match, before, quote1, url, quote2, after) => {
            // Обрабатываем абсолютные пути
            if (url.startsWith('/')) {
              return `style="${before}background: url(${quote1}${url.substring(1)}${quote2})${after}"`;
            }
            // Если была ошибка с неправильно сформированным URL
            if (url.includes('=""')) {
              // Исправляем это
              const fixedUrl = url.replace(/\s*([a-zA-Z0-9_-]+)=""\s*([^"]+)/, '$1/$2');
              return `style="${before}background: url(${quote1}${fixedUrl}${quote2})${after}"`;
            }
            return match;
          });

          // Восстанавливаем экранированный код
          htmlContent = unescapeCodeAndPre(htmlContent);

          fs.writeFileSync(htmlPath, htmlContent);
        });

        console.log(`${CONSOLE_COLORS.green}Атрибуты HTML исправлены${CONSOLE_COLORS.reset}`);
      } catch (error) {
        console.error('Ошибка при обработке HTML файлов:', error);
      }
    }
  };
}

/**
 * Плагин для исправления относительных путей
 * @returns {Object} Vite плагин
 */
export function fixAssetsPathsPlugin() {
  return {
    name: 'fix-assets-paths',
    closeBundle: async () => {
      try {
        fs.readdirSync(PATHS.dist)
          .filter(file => file.endsWith('.html'))
          .forEach(htmlFile => {
            const htmlPath = resolve(PATHS.dist, htmlFile);
            let htmlContent = fs.readFileSync(htmlPath, 'utf-8');

            // Экранируем код в тегах code и pre
            htmlContent = escapeCodeAndPre(htmlContent);

            // Удаляем ./ из всех путей
            htmlContent = htmlContent.replace(
              /(src|href)=["']\.\/([^"']+)["']/g,
              '$1="$2"'
            );

            // Восстанавливаем экранированный код
            htmlContent = unescapeCodeAndPre(htmlContent);

            fs.writeFileSync(htmlPath, htmlContent);
          });

        console.log(`${CONSOLE_COLORS.green}Пути к ресурсам исправлены (удалены префиксы ./)${CONSOLE_COLORS.reset}`);
      } catch (error) {
        console.error('Ошибка при исправлении путей к ресурсам:', error);
      }
    }
  };
}

/**
 * Плагин для переименования JS файлов
 * @returns {Object} Vite плагин
 */
export function renameJsPlugin() {
  return {
    name: 'rename-js-plugin',
    apply: 'build',
    closeBundle: async () => {
      try {
        const jsDir = join(PATHS.dist, 'js');
        if (!fs.existsSync(jsDir)) {
          fs.mkdirSync(jsDir, { recursive: true });
          return;
        }

        fs.readdirSync(jsDir)
          .filter(file => file.startsWith('app') && file.endsWith('.js') && file !== 'app.js')
          .forEach(file => {
            const filePath = join(jsDir, file);
            const newFilePath = join(jsDir, 'app.js');

            if (fs.existsSync(newFilePath)) {
              fs.unlinkSync(newFilePath);
            }

            fs.renameSync(filePath, newFilePath);
          });
      } catch (error) {
        console.error('Ошибка при переименовании JS файла:', error);
      }
    }
  };
} 