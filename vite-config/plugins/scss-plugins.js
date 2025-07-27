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
 * Улучшенный плагин для обработки горячей перезагрузки HTML и SCSS
 * @returns {Object} Vite плагин
 */
export function htmlReloadPlugin() {
  return {
    name: 'enhanced-reload-plugin',
    handleHotUpdate({ file, server }) {
      // Полная перезагрузка для HTML файлов
      if (file.endsWith('.html')) {
        server.ws.send({
          type: 'full-reload',
          path: '*',
        });
        return [];
      }
      
      // Улучшенная обработка SCSS файлов
      if (file.endsWith('.scss') || file.endsWith('.sass')) {
        // Принудительно инвалидируем все CSS модули для обновления
        const moduleGraph = server.moduleGraph;
        const cssModules = [];
        
        for (const [url, module] of moduleGraph.urlToModuleMap) {
          if (url.includes('.scss') || url.includes('.sass') || url.includes('.css')) {
            moduleGraph.invalidateModule(module);
            cssModules.push(module);
          }
        }
        
        // Отправляем CSS update для всех найденных модулей
        if (cssModules.length > 0) {
          server.ws.send({
            type: 'update',
            updates: cssModules.map(module => ({
              type: 'css-update',
              path: module.url,
              acceptedPath: module.url,
              timestamp: Date.now()
            }))
          });
        }
        
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