import { defineConfig } from 'vite';
import { resolve, join, dirname, extname, basename, isAbsolute } from 'path';
import sassGlobImports from 'vite-plugin-sass-glob-import';
import fs from 'fs';
import path from 'node:path';
import os from 'node:os';
import { cpus } from 'node:os';
import { exec } from 'child_process';
import { promisify } from 'util';
// PostCSS плагины
import autoprefixer from 'autoprefixer';
import postcssSortMediaQueries from 'postcss-sort-media-queries';

// Преобразуем exec в Promise
const execAsync = promisify(exec);

// Константы
const APP_DIR = 'app';
const DIST_DIR = 'dist';
const PATHS = {
  app: resolve(__dirname, APP_DIR),
  dist: resolve(__dirname, DIST_DIR),
  public: resolve(__dirname, 'public'),
  js: resolve(__dirname, `${APP_DIR}/js`),
  scss: resolve(__dirname, `${APP_DIR}/scss`),
  img: resolve(__dirname, `${APP_DIR}/img`),
  vendor: resolve(__dirname, `${APP_DIR}/vendor`),
  files: resolve(__dirname, `${APP_DIR}/files`),
  fonts: resolve(__dirname, `${APP_DIR}/fonts`),
  html: resolve(__dirname, `${APP_DIR}/html`)
};

// Параллельная обработка
const MAX_PARALLEL_PROCESSES = Math.max(1, cpus().length - 1);

// Универсальные алиасы для всего проекта
const PROJECT_ALIASES = {
  '@scss': resolve(__dirname, `${APP_DIR}/scss`),
  '@js': resolve(__dirname, `${APP_DIR}/js`),
  '@img': resolve(__dirname, `${APP_DIR}/img`),
  '@utils': resolve(__dirname, `${APP_DIR}/js/utils`),
  '@vendor': resolve(__dirname, `${APP_DIR}/vendor`),
  '@files': resolve(__dirname, `${APP_DIR}/files`),
  '@fonts': resolve(__dirname, `${APP_DIR}/fonts`)
};

// Алиасы для HTML (используются в преобразовании)
const HTML_ALIASES = {
  '@scss': 'scss',
  '@js': 'js',
  '@img': 'img',
  '@utils': 'js/utils',
  '@vendor': 'vendor',
  '@files': 'files',
  '@fonts': 'fonts'
};

// Алиасы для SCSS (относительные пути)
const SCSS_ALIASES = {
  '@fonts': '../fonts',
  '@img': '../img',
  '@scss': '../scss',
  '@css': '../css',
  '@vendor': '../vendor',
  '@files': '../files'
};

/**
 * Утилиты для работы с файловой системой
 */
const fsUtils = {
  // Рекурсивное копирование директории
  copyDir(src, dest) {
    if (!fs.existsSync(src)) return;
    
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = join(src, entry.name);
      const destPath = join(dest, entry.name);

      if (entry.isDirectory()) {
        this.copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  },

  // Поиск HTML файлов для точек входа
  findHtmlEntries() {
    const entries = {};
    if (!fs.existsSync(PATHS.app)) return entries;

    fs.readdirSync(PATHS.app)
      .filter(file => file.endsWith('.html'))
      .forEach(file => {
        const name = file.replace('.html', '');
        entries[name] = resolve(PATHS.app, file);
      });

    return entries;
  },

  // Проверка является ли файл изображением
  isImageFile(filename) {
    const ext = extname(filename).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.ico'].includes(ext);
  },

  // Форматирование размера файла
  formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  },

  // Рекурсивный поиск всех изображений (кроме SVG)
  findAllImages(dir, fileList = []) {
    const files = fs.readdirSync(dir, { withFileTypes: true });

    for (const file of files) {
      const fullPath = join(dir, file.name);
      
      if (file.isDirectory()) {
        this.findAllImages(fullPath, fileList);
      } else if (
        this.isImageFile(file.name) && 
        !file.name.toLowerCase().endsWith('.svg')
      ) {
        fileList.push(fullPath);
      }
    }

    return fileList;
  }
};

/**
 * Плагины для Vite
 */
const plugins = {
  // Обработка директив @@include
  fileInclude() {
    return {
      name: 'vite:file-include',
      order: 'pre',
      transformIndexHtml: {
        handler(html, { filename }) {
          // Получение содержимого файла с обработкой вложенных include
          function getFileContent(filePath, params = {}, parentPath = null) {
            try {
              const basePath = parentPath || dirname(filename);
              let adjustedPath = filePath;
              
              if (
                !filePath.includes('/') &&
                !isAbsolute(filePath) &&
                !basePath.includes('html')
              ) {
                adjustedPath = `html/${filePath}`;
              }

              const fullPath = resolve(basePath, adjustedPath);

              if (!fs.existsSync(fullPath)) {
                console.error(`Файл не найден: ${fullPath}`);
                return `<!-- Ошибка: файл не найден ${filePath} -->`;
              }

              let content = fs.readFileSync(fullPath, 'utf-8');

              // Заменяем параметры в шаблоне
              Object.keys(params).forEach((key) => {
                content = content.replace(
                  new RegExp(`@@${key}`, 'g'),
                  params[key]
                );
              });

              // Рекурсивно обрабатываем вложенные include
              return processIncludes(content, dirname(fullPath));
            } catch (error) {
              console.error(`Ошибка при чтении файла ${filePath}:`, error);
              return `<!-- Ошибка: не удалось включить файл ${filePath} -->`;
            }
          }

          // Обработка всех @@include в строке
          function processIncludes(content, currentPath = null) {
            let result = content;
            const includeRegex = /@@include\(['"]([^'"]+)['"](,\s*({[^}]+}))?\)/g;

            let match;
            let lastIndex = 0;

            while ((match = includeRegex.exec(result)) !== null) {
              try {
                lastIndex = includeRegex.lastIndex;
                const [fullMatch, filePath, _, paramsStr] = match;

                // Парсим параметры, если они есть
                let params = {};
                if (paramsStr) {
                  params = JSON.parse(paramsStr.replace(/^\s*,\s*/, ''));
                }

                // Получаем содержимое файла 
                const content = getFileContent(filePath, params, currentPath);

                // Заменяем только текущее совпадение
                result = result.replace(fullMatch, content);

                // Сбрасываем lastIndex и начинаем поиск заново
                includeRegex.lastIndex = 0;
              } catch (error) {
                console.error('Ошибка при обработке вложенного @@include:', error);
                includeRegex.lastIndex = lastIndex + 1;
              }
            }

            return result;
          }

          // Запускаем обработку включений
          return processIncludes(html);
        },
      },
    };
  },

  // Обработка HTML алиасов (@scss, @js, etc.)
  htmlAlias(aliases) {
    return {
      name: 'vite:html-alias',
      transformIndexHtml(html) {
        let result = html;

        // Заменяем абсолютные пути CSS/JS на относительные без ./
        result = result.replace(/(href|src)=["']\/([^"']+)["']/g, '$1="$2"');

        // Заменяем алиасы в атрибутах
        Object.keys(aliases).forEach((alias) => {
          const escapedAlias = alias.replace('@', '\\@');
          const aliasRegex = new RegExp(
            `(src|href|url|poster|data-src|data-background)=["']${escapedAlias}/([^"']+)["']`,
            'g'
          );
          result = result.replace(aliasRegex, (match, attr, path) => {
            return `${attr}="${aliases[alias]}/${path}"`;
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

        return result;
      },
    };
  },

  // Копирование ресурсов в dist
  copyResources(type) {
    const typeConfig = {
      images: { 
        src: PATHS.img, 
        dest: join(PATHS.dist, 'img'),
        logMessage: 'Изображения скопированы'
      },
      vendor: {
        src: PATHS.vendor, 
        dest: join(PATHS.dist, 'vendor'),
        logMessage: 'Файлы vendor скопированы'
      },
      fonts: {
        src: PATHS.fonts, 
        dest: join(PATHS.dist, 'fonts'),
        logMessage: 'Шрифты скопированы'
      },
      files: {
        src: PATHS.files, 
        dest: join(PATHS.dist, 'files'),
        logMessage: 'Файлы из директории files скопированы'
      }
    };

    const config = typeConfig[type];
    if (!config) {
      throw new Error(`Неизвестный тип ресурса: ${type}`);
    }

    return {
      name: `copy-${type}-plugin`,
      apply: 'build',
      closeBundle: async () => {
        try {
          if (fs.existsSync(config.src)) {
            const startTime = Date.now();
            
            // Функция для сбора всех файлов
            function collectFiles(src, dest, baseSrc, baseDest) {
              if (!fs.existsSync(src)) return [];
              
              let files = [];
              const entries = fs.readdirSync(src, { withFileTypes: true });
              
              for (const entry of entries) {
                const srcPath = join(src, entry.name);
                const relativePath = srcPath.replace(baseSrc, '').replace(/^[\/\\]/, '');
                const destPath = join(baseDest, relativePath);
                
                if (entry.isDirectory()) {
                  if (!fs.existsSync(destPath)) {
                    fs.mkdirSync(destPath, { recursive: true });
                  }
                  files = files.concat(collectFiles(srcPath, destPath, baseSrc, baseDest));
                } else {
                  files.push({ src: srcPath, dest: destPath });
                }
              }
              
              return files;
            }
            
            // Создаем каталог назначения, если его нет
            if (!fs.existsSync(config.dest)) {
              fs.mkdirSync(config.dest, { recursive: true });
            }
            
            // Собираем список файлов для копирования
            const filesToCopy = collectFiles(config.src, config.dest, config.src, config.dest);
            
            // Если файлов много, используем параллельное копирование
            if (filesToCopy.length > 100) {
              console.log(`\x1b[36mНачинаем копирование ${filesToCopy.length} файлов типа ${type}...\x1b[0m`);
              
              // Функция для копирования файла
              function copyFile(file) {
                try {
                  fs.copyFileSync(file.src, file.dest);
                  return { success: true, file };
                } catch (error) {
                  console.error(`Ошибка при копировании ${file.src}:`, error);
                  return { success: false, file, error };
                }
              }
              
              // Разделяем файлы на группы для параллельной обработки
              function chunkArray(array, size) {
                const chunks = [];
                for (let i = 0; i < array.length; i += size) {
                  chunks.push(array.slice(i, i + size));
                }
                return chunks;
              }
              
              // Определяем оптимальный размер чанка
              const CHUNK_SIZE = Math.max(1, Math.ceil(filesToCopy.length / MAX_PARALLEL_PROCESSES));
              const fileChunks = chunkArray(filesToCopy, CHUNK_SIZE);
              
              console.log(`\x1b[36mИспользую ${fileChunks.length} параллельных потоков\x1b[0m`);
              
              // Счетчики для отображения прогресса
              let processedCount = 0;
              const total = filesToCopy.length;
              
              // Функция обновления прогресса
              function updateProgress() {
                processedCount++;
                const percent = Math.round((processedCount / total) * 100);
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                process.stdout.write(`\r\x1b[36mКопирование ${type}: ${percent}% (${processedCount}/${total}) - ${elapsed}с\x1b[0m`);
              }
              
              // Обрабатываем чанки параллельно
              const chunkPromises = fileChunks.map(async (chunk) => {
                const results = [];
                for (const file of chunk) {
                  const result = copyFile(file);
                  updateProgress();
                  results.push(result);
                }
                return results;
              });
              
              // Ждем завершения всех чанков
              const chunkResults = await Promise.all(chunkPromises);
              
              // Объединяем результаты
              const results = chunkResults.flat();
              
              console.log(''); // Новая строка после прогресс-бара
              
              // Подсчитываем статистику
              const successCount = results.filter(r => r.success).length;
              const failedCount = results.filter(r => !r.success).length;
              
              const timeElapsed = ((Date.now() - startTime) / 1000).toFixed(2);
              
              if (failedCount === 0) {
                console.log(`\x1b[32m${config.logMessage} (${successCount} файлов за ${timeElapsed}с)\x1b[0m`);
              } else {
                console.log(`\x1b[33m${config.logMessage} частично (${successCount} успешно, ${failedCount} с ошибками) за ${timeElapsed}с\x1b[0m`);
              }
            } else {
              // Для небольшого количества файлов используем обычное копирование
              fsUtils.copyDir(config.src, config.dest);
              console.log(`\x1b[32m${config.logMessage}\x1b[0m`);
            }
          }
        } catch (error) {
          console.error(`Ошибка при копировании ${type}:`, error);
        }
      }
    };
  },

  // Исправление путей к шрифтам в CSS
  fixFontPaths() {
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

          console.log('\x1b[32mПути к шрифтам исправлены\x1b[0m');
        } catch (error) {
          console.error('Ошибка при исправлении путей к шрифтам:', error);
        }
      }
    };
  },

  // Постобработка HTML файлов (удаление crossorigin и type="module")
  processHtml() {
    return {
      name: 'no-cors-attributes',
      apply: 'build',
      closeBundle: async () => {
        try {
          const htmlFiles = fs.readdirSync(PATHS.dist)
            .filter(file => file.endsWith('.html'));

          htmlFiles.forEach(htmlFile => {
            const htmlPath = resolve(PATHS.dist, htmlFile);
            let htmlContent = fs.readFileSync(htmlPath, 'utf-8');

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

            fs.writeFileSync(htmlPath, htmlContent);
          });

          console.log('\x1b[32mАтрибуты HTML исправлены\x1b[0m');
        } catch (error) {
          console.error('Ошибка при обработке HTML файлов:', error);
        }
      }
    };
  },

  // Исправление относительных путей в скриптах
  fixScriptPaths() {
    return {
      name: 'fix-script-paths',
      closeBundle: async () => {
        try {
          fs.readdirSync(PATHS.dist)
            .filter(file => file.endsWith('.html'))
            .forEach(htmlFile => {
              const htmlPath = resolve(PATHS.dist, htmlFile);
              let htmlContent = fs.readFileSync(htmlPath, 'utf-8');

              // Удаляем ./ из всех путей
              htmlContent = htmlContent.replace(
                /(src|href)=["']\.\/([^"']+)["']/g,
                '$1="$2"'
              );

              fs.writeFileSync(htmlPath, htmlContent);
            });

          console.log('\x1b[32mПути к скриптам исправлены на относительные\x1b[0m');
        } catch (error) {
          // Ошибки не выводим
        }
      }
    };
  },

  // Переименование JS файлов в app.js
  renameJs() {
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
  },

  // Создание точки входа для SCSS
  scssEntry() {
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
            console.log('\x1b[32mSCSS обработан как отдельная точка входа\x1b[0m');
          }
        } catch (error) {
          console.error('Ошибка при создании точки входа для SCSS:', error);
        }
      }
    };
  },

  // Горячая перезагрузка при изменении HTML
  htmlReload() {
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
  },

  // Оптимизация изображений
  async imageOptimization() {
    return {
      name: 'optimize-images-plugin',
      apply: 'build',
      enforce: 'post',
      closeBundle: async () => {
        try {
          const imgDistDir = join(PATHS.dist, 'img');
          if (!fs.existsSync(imgDistDir)) return;

          console.log('\x1b[32mНачинаем оптимизацию изображений...\x1b[0m');

          // Находим все изображения (кроме SVG)
          const allImages = fsUtils.findAllImages(imgDistDir);

          if (allImages.length === 0) {
            console.log('\x1b[33mИзображения для оптимизации не найдены\x1b[0m');
            return;
          }

          // Импортируем модули для оптимизации динамически
          const imagemin = (await import('imagemin')).default;
          const imageminMozjpeg = (await import('imagemin-mozjpeg')).default;
          const imageminPngquant = (await import('imagemin-pngquant')).default;
          const imageminGifsicle = (await import('imagemin-gifsicle')).default;
          
          console.log(`\x1b[36mНайдено изображений для оптимизации: ${allImages.length}\x1b[0m`);
          
          // Создаем функцию для оптимизации одного изображения
          async function optimizeImage(imagePath) {
            const imageExt = extname(imagePath).toLowerCase();
            let plugins = [];
            let result = { path: imagePath, success: false, skipped: false };

            // Подбираем плагины в зависимости от типа файла
            if (['.jpg', '.jpeg'].includes(imageExt)) {
              plugins.push(imageminMozjpeg({ quality: 80 }));
            } else if (imageExt === '.png') {
              plugins.push(imageminPngquant({ quality: [0.6, 0.8] }));
            } else if (imageExt === '.gif') {
              plugins.push(imageminGifsicle({ optimizationLevel: 7 }));
            } else {
              // Пропускаем неподдерживаемые форматы
              return { ...result, skipped: true };
            }

            try {
              // Получаем исходный размер файла
              const originalSize = fs.statSync(imagePath).size;

              // Оптимизируем изображение
              const fileBuffer = fs.readFileSync(imagePath);
              const optimizedBuffer = await imagemin.buffer(fileBuffer, {
                plugins: plugins,
              });

              // Записываем оптимизированное изображение
              fs.writeFileSync(imagePath, optimizedBuffer);

              // Получаем новый размер
              const newSize = fs.statSync(imagePath).size;

              // Вычисляем процент сжатия
              const compressionPercent = Math.round(
                (1 - newSize / originalSize) * 100
              );

              return {
                path: imagePath,
                name: basename(imagePath),
                originalSize,
                newSize,
                compressionPercent,
                success: true
              };
            } catch (error) {
              console.error(`Ошибка при оптимизации ${basename(imagePath)}:`, error);
              return { ...result, error: error.message };
            }
          }
          
          // Разделим изображения на группы для параллельной обработки
          function chunkArray(array, size) {
            const chunks = [];
            for (let i = 0; i < array.length; i += size) {
              chunks.push(array.slice(i, i + size));
            }
            return chunks;
          }
          
          // Определяем оптимальное количество изображений на поток
          const CHUNK_SIZE = Math.max(1, Math.ceil(allImages.length / MAX_PARALLEL_PROCESSES));
          const imageChunks = chunkArray(allImages, CHUNK_SIZE);
          
          console.log(`\x1b[36mИспользую ${imageChunks.length} параллельных потоков для обработки\x1b[0m`);
          
          // Счетчики для отображения прогресса
          let processedCount = 0;
          let startTime = Date.now();
          
          // Функция обновления прогресса
          function updateProgress() {
            processedCount++;
            const percent = Math.round((processedCount / allImages.length) * 100);
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            process.stdout.write(`\r\x1b[36mОптимизация изображений: ${percent}% (${processedCount}/${allImages.length}) - ${elapsed}с\x1b[0m`);
          }
          
          // Обрабатываем каждую группу изображений последовательно, но группы - параллельно
          const chunkPromises = imageChunks.map(async (chunk) => {
            const results = [];
            for (const imagePath of chunk) {
              const result = await optimizeImage(imagePath);
              updateProgress();
              results.push(result);
            }
            return results;
          });
          
          // Ждем завершения всех групп
          const chunkResults = await Promise.all(chunkPromises);
          
          // Объединяем результаты
          const results = chunkResults.flat();
          
          console.log('\n'); // Новая строка после прогресс-бара
          
          // Фильтруем результаты
          const optimizedImages = results.filter(r => r && r.success && !r.skipped);
          const skippedImages = results.filter(r => r && r.skipped);
          const failedImages = results.filter(r => !r || r.error);
          
          // Рассчитываем общую статистику
          let totalOriginalSize = 0;
          let totalOptimizedSize = 0;
          
          optimizedImages.forEach(img => {
            totalOriginalSize += img.originalSize;
            totalOptimizedSize += img.newSize;
          });

          // Выводим статистику оптимизации
          if (optimizedImages.length > 0) {
            console.log('\n\x1b[32m----- Статистика оптимизации -----\x1b[0m');

            // Информация по каждому изображению
            optimizedImages.forEach((img) => {
              const originalSizeFormatted = fsUtils.formatFileSize(img.originalSize);
              const newSizeFormatted = fsUtils.formatFileSize(img.newSize);
              const arrowColor =
                img.compressionPercent >= 10 ? '\x1b[32m' : '\x1b[33m';

              console.log(
                `\x1b[36m${img.name}\x1b[0m: ${originalSizeFormatted} ${arrowColor}→\x1b[0m ${newSizeFormatted} (\x1b[32m-${img.compressionPercent}%\x1b[0m)`
              );
            });

            // Общая статистика
            const totalSaved = totalOriginalSize - totalOptimizedSize;
            const totalPercent = Math.round(
              (1 - totalOptimizedSize / totalOriginalSize) * 100
            );

            console.log(
              `\n\x1b[36mОбщая экономия:\x1b[0m ${fsUtils.formatFileSize(
                totalSaved
              )} (\x1b[32m-${totalPercent}%\x1b[0m)`
            );
            console.log(`\x1b[36mУспешно оптимизировано:\x1b[0m ${optimizedImages.length}`);
            
            if (skippedImages.length > 0) {
              console.log(`\x1b[36mПропущено (не требуется оптимизация):\x1b[0m ${skippedImages.length}`);
            }
            
            if (failedImages.length > 0) {
              console.log(`\x1b[33mНе удалось оптимизировать:\x1b[0m ${failedImages.length}`);
            }
            
            console.log(`\x1b[36mВремя выполнения:\x1b[0m ${((Date.now() - startTime) / 1000).toFixed(2)}с`);
            console.log('\x1b[32m---------------------------------\x1b[0m');
          } else {
            console.log('\x1b[33mИзображения не нуждаются в оптимизации\x1b[0m');
          }
        } catch (error) {
          console.error('Ошибка при оптимизации изображений:', error);
        }
      }
    };
  },

  // Добавляем плагин для обработки алиасов в SCSS файлах
  scssAlias() {
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
      },

      // Предоставление для препроцессора опций
      api: {
        additionalData(source, filename) {
          // Добавляем переменные с путями для использования в SCSS
          let additionalCode = '';
          Object.entries(SCSS_ALIASES).forEach(([alias, path]) => {
            const varName = alias.replace('@', '$') + '-path';
            additionalCode += `${varName}: "${path}";\n`;
          });
          
          return additionalCode + source;
        }
      }
    };
  }
};

/**
 * Создание конфигурации Vite с разными настройками
 */
function createConfig(minify = false, imageOptimization = false) {
  const basePlugins = [
    sassGlobImports(),
    plugins.fileInclude(),
    plugins.htmlAlias(HTML_ALIASES),
    plugins.scssEntry(),
    plugins.scssAlias(),
    plugins.copyResources('images'),
    plugins.copyResources('vendor'),
    plugins.copyResources('fonts'),
    plugins.copyResources('files'),
    plugins.fixFontPaths(),
    plugins.processHtml(),
    plugins.fixScriptPaths(),
    plugins.renameJs(),
    plugins.htmlReload()
  ];

  return {
    root: APP_DIR,
    build: {
      outDir: '../dist',
      emptyOutDir: true,
      manifest: false,
      minify: minify ? 'esbuild' : false,
      rollupOptions: {
        input: {
          ...fsUtils.findHtmlEntries(),
          app: resolve(PATHS.js, 'app.js'),
          styles: resolve(PATHS.scss, 'main.scss'),
        },
        output: {
          entryFileNames: 'js/app.js',
          chunkFileNames: 'js/[name].js',
          assetFileNames: (assetInfo) => {
            const extType = assetInfo.name.split('.').at(1);
            if (/css/i.test(extType)) {
              return 'css/app.css';
            }
            if (/png|jpe?g|gif|svg|webp|ico/i.test(extType)) {
              return 'img/[name][extname]';
            }
            if (/woff|woff2|eot|ttf|otf/i.test(extType)) {
              return 'fonts/[name][extname]';
            }
            return 'assets/[name][extname]';
          },
        },
      },
    },
    publicDir: '../public',
    plugins: imageOptimization 
      ? [...basePlugins, plugins.imageOptimization()]
      : basePlugins,
    resolve: {
      alias: {
        '@utils': PROJECT_ALIASES['@utils'],
        '@js': PROJECT_ALIASES['@js'],
        '@scss': PROJECT_ALIASES['@scss'],
        '@img': PROJECT_ALIASES['@img'],
        '@vendor': PROJECT_ALIASES['@vendor'],
        '@files': PROJECT_ALIASES['@files'],
        '@fonts': PROJECT_ALIASES['@fonts']
      },
    },
    css: {
      devSourcemap: true,
      preprocessorOptions: {
        scss: {
          quietDeps: true,
          logger: {
            warn: () => {},
          },
          // Добавляем глобальные переменные со всеми алиасами для использования в SCSS
          additionalData: Object.entries(SCSS_ALIASES).map(([alias, path]) => {
            const varName = alias.replace('@', '$') + '-path';
            return `${varName}: "${path}";`;
          }).join('\n') + '\n'
        },
      },
      // Настройки PostCSS
      postcss: {
        plugins: [
          // Автоматическое добавление вендорных префиксов
          autoprefixer({
            // Список поддерживаемых браузеров (добавим больше старых браузеров для тестирования)
            overrideBrowserslist: [
              'last 4 versions',
              '> 0.5%',
              'Firefox ESR',
              'not dead',
              'ie >= 10'
            ],
            grid: false, // Отключаем префиксы для Grid Layout
            flexbox: false, // Отключаем префиксы для Flexbox
            cascade: true, // Красивое форматирование префиксов
            // Включаем все префиксы для тестирования
            remove: false
          }),
          
          // Группировка и сортировка медиа-запросов
          postcssSortMediaQueries({
            // Сортировка от мобильных к десктопным (mobile-first)
            sort: 'mobile-first'
          })
        ]
      }
    },
  };
}

// Экспортируем конфигурацию в зависимости от режима сборки
export default defineConfig(({ mode }) => {
  console.log(`\x1b[32mРежим сборки: ${mode}\x1b[0m`);

  switch (mode) {
    case 'development':
      return createConfig(false, false); // Без минификации для режима разработки
    case 'production-min':
      return createConfig(true, true);   // С минификацией и оптимизацией изображений
    case 'production':
      return createConfig(false, false); // Без минификации для стандартной сборки
    default:
      return createConfig(false, false); // По умолчанию
  }
});
