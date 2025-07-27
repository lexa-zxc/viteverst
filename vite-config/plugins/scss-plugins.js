import fs from 'fs';
import { join } from 'path';
import { PATHS } from '../config/paths.js';
import { SCSS_ALIASES } from '../config/paths.js';
import { CONSOLE_COLORS } from '../config/constants.js';

/**
 * Плагин для создания точки входа для SCSS
 * @returns {Object} Vite плагин
 */
export function scssEntryPlugin() {
  return {
    name: 'scss-entry-plugin',
    apply: 'build',
    buildStart() {
      try {
        const scssEntryPath = join(PATHS.scss, 'main.scss');
        if (fs.existsSync(scssEntryPath)) {
          this.emitFile({
            type: 'chunk',
            id: scssEntryPath,
            name: 'styles',
          });
          console.log(`${CONSOLE_COLORS.green}SCSS обработан как отдельная точка входа${CONSOLE_COLORS.reset}`);
        }
      } catch (error) {
        console.error('Ошибка при создании точки входа для SCSS:', error);
      }
    }
  };
}

/**
 * Плагин для обработки горячей перезагрузки при изменении HTML
 * @returns {Object} Vite плагин
 */
export function htmlReloadPlugin() {
  return {
    name: 'html-reload',
    handleHotUpdate({ file, server }) {
      if (file.endsWith('.html')) {
        server.ws.send({
          type: 'full-reload',
          path: '*',
        });
        return [];
      }
    }
  };
}

/**
 * Плагин для обработки алиасов в SCSS файлах
 * @returns {Object} Vite плагин
 */
export function scssAliasPlugin() {
  return {
    name: 'scss-alias-plugin',
    transform(code, id) {
      if (id.endsWith('.scss') || id.endsWith('.sass') || id.endsWith('.css')) {
        // Заменяем все алиасы в SCSS и CSS файлах
        let result = code;

        Object.entries(SCSS_ALIASES).forEach(([alias, path]) => {
          // Поддержка @import "алиас/путь" и @use "алиас/путь"
          const importRegex = new RegExp(`(@import|@use|@forward)\\s+["'](${alias.replace('@', '')}/[^"']+)["']`, 'g');
          result = result.replace(importRegex, (match, directive, importPath) => {
            return `${directive} "${path}/${importPath.replace(`${alias.replace('@', '')}/`, '')}"`;
          });

          // Поддержка url(алиас/путь)
          const urlRegex = new RegExp(`url\\(["'](${alias.replace('@', '')}/[^"')]+)["']\\)`, 'g');
          result = result.replace(urlRegex, (match, url) => {
            return `url("${path}/${url.replace(`${alias.replace('@', '')}/`, '')}")`;
          });

          // Поддержка url(алиас/путь) без кавычек
          const urlNoQuotesRegex = new RegExp(`url\\((${alias.replace('@', '')}/[^)]+)\\)`, 'g');
          result = result.replace(urlNoQuotesRegex, (match, url) => {
            return `url(${path}/${url.replace(`${alias.replace('@', '')}/`, '')})`;
          });

          // Поддержка прямых упоминаний @алиас/путь в любом контексте
          const fullAliasRegex = new RegExp(`(['"])${alias}\/([^'"]+)(['"])`, 'g');
          result = result.replace(fullAliasRegex, (match, quote1, filePath, quote2) => {
            return `${quote1}${path}/${filePath}${quote2}`;
          });
        });

        return { code: result, map: null };
      }
    },

    // Добавляем постобработку CSS
    async generateBundle(outputOptions, bundle) {
      // Обрабатываем собранные CSS файлы
      Object.keys(bundle).forEach(key => {
        const asset = bundle[key];
        if (key.endsWith('.css')) {
          let code = asset.source;

          // Исправляем пути в CSS
          // Заменяем абсолютные пути на относительные
          code = code.replace(/url\(['"]?\/fonts\/([^'")]+)['"]?\)/g, 'url("../fonts/$1")');
          code = code.replace(/url\(['"]?\/img\/([^'")]+)['"]?\)/g, 'url("../img/$1")');
          code = code.replace(/url\(['"]?\/scss\/([^'")]+)['"]?\)/g, 'url("../scss/$1")');
          code = code.replace(/url\(['"]?\/css\/([^'")]+)['"]?\)/g, 'url("../css/$1")');
          code = code.replace(/url\(['"]?\/vendor\/([^'")]+)['"]?\)/g, 'url("../vendor/$1")');
          code = code.replace(/url\(['"]?\/files\/([^'")]+)['"]?\)/g, 'url("../files/$1")');

          // Дополнительно заменяем пути без начального слэша (для совместимости)
          Object.entries(SCSS_ALIASES).forEach(([alias, path]) => {
            const folderName = alias.replace('@', '');
            const urlRegex = new RegExp(`url\\(['"]?${folderName}\/([^'")]+)['"]?\\)`, 'g');
            code = code.replace(urlRegex, `url("${path}/$1")`);
          });

          asset.source = code;
        }
      });
    }
  };
}


/**
 * Плагин для активации новых SCSS файлов
 * @returns {Object} Vite плагин
 */
export function scssFileWatcherPlugin() {
  return {
    name: 'scss-file-watcher-plugin',
    apply: 'serve',
    configureServer(server) {
      server.watcher.on('add', (path) => {
        if (path.endsWith('.scss') || path.endsWith('.sass')) {


          try {
            // Путь к основному файлу стилей
            const mainScssPath = join(PATHS.scss, 'main.scss');

            // Проверяем, существует ли файл
            if (fs.existsSync(mainScssPath)) {
              // Читаем содержимое файла
              let content = fs.readFileSync(mainScssPath, 'utf-8');

              // Добавляем временный комментарий в конец файла
              const timestamp = Date.now();
              content += `\n// Временный комментарий для обновления: ${timestamp}\n`;
              fs.writeFileSync(mainScssPath, content);

              // Через небольшую задержку удаляем этот комментарий
              setTimeout(() => {
                content = content.replace(`\n// Временный комментарий для обновления: ${timestamp}\n`, '');
                fs.writeFileSync(mainScssPath, content);
                console.log(`${CONSOLE_COLORS.green}Обнаружен и активирован новый SCSS файл: ${path}${CONSOLE_COLORS.reset}`);
              }, 100);
            } else {
              console.log(`${CONSOLE_COLORS.red}Файл main.scss не найден по пути: ${mainScssPath}${CONSOLE_COLORS.reset}`);
            }
          } catch (error) {
            console.error('Ошибка при обновлении main.scss:', error);
          }
        }
      });
    }
  };
}
