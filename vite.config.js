import { defineConfig } from 'vite';
import { resolve, join, dirname, extname, basename, isAbsolute } from 'path';
import sassGlobImports from 'vite-plugin-sass-glob-import';
import fs from 'fs';

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

const ALIASES = {
  '@scss': 'scss',
  '@js': 'js',
  '@img': 'img',
  '@utils': 'js/utils',
  '@vendor': 'vendor',
  '@files': 'files'
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

        // Заменяем все алиасы в путях
        Object.keys(aliases).forEach((alias) => {
          const escapedAlias = alias.replace('@', '\\@');
          const aliasRegex = new RegExp(
            `(src|href|url)=["']${escapedAlias}/([^"']+)["']`,
            'g'
          );
          result = result.replace(aliasRegex, (match, attr, path) => {
            return `${attr}="${alias.replace('@', '')}/${path}"`;
          });
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
          fsUtils.copyDir(config.src, config.dest);
          console.log(`\x1b[32m${config.logMessage}\x1b[0m`);
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

          // Статистика оптимизации
          let totalOriginalSize = 0;
          let totalOptimizedSize = 0;
          let optimizedImages = [];

          // Оптимизируем изображения
          for (const imagePath of allImages) {
            const imageExt = extname(imagePath).toLowerCase();
            let plugins = [];

            // Подбираем плагины в зависимости от типа файла
            if (['.jpg', '.jpeg'].includes(imageExt)) {
              plugins.push(imageminMozjpeg({ quality: 80 }));
            } else if (imageExt === '.png') {
              plugins.push(imageminPngquant({ quality: [0.6, 0.8] }));
            } else if (imageExt === '.gif') {
              plugins.push(imageminGifsicle({ optimizationLevel: 7 }));
            }

            // Если есть плагины для оптимизации
            if (plugins.length > 0) {
              try {
                // Получаем исходный размер файла
                const originalSize = fs.statSync(imagePath).size;
                totalOriginalSize += originalSize;

                // Оптимизируем изображение
                const fileBuffer = fs.readFileSync(imagePath);
                const optimizedBuffer = await imagemin.buffer(fileBuffer, {
                  plugins: plugins,
                });

                // Записываем оптимизированное изображение
                fs.writeFileSync(imagePath, optimizedBuffer);

                // Получаем новый размер
                const newSize = fs.statSync(imagePath).size;
                totalOptimizedSize += newSize;

                // Вычисляем процент сжатия
                const compressionPercent = Math.round(
                  (1 - newSize / originalSize) * 100
                );

                // Добавляем информацию в статистику
                optimizedImages.push({
                  name: basename(imagePath),
                  originalSize,
                  newSize,
                  compressionPercent,
                });
              } catch (error) {
                console.error(
                  `Ошибка при оптимизации ${basename(imagePath)}:`,
                  error
                );
              }
            }
          }

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
            console.log(
              `\x1b[36mОбработано изображений:\x1b[0m ${optimizedImages.length}`
            );
            console.log(`\x1b[36mSVG файлы не оптимизировались\x1b[0m`);
            console.log('\x1b[32m---------------------------------\x1b[0m');
          } else {
            console.log('\x1b[33mИзображения не нуждаются в оптимизации\x1b[0m');
          }
        } catch (error) {
          console.error('Ошибка при оптимизации изображений:', error);
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
    plugins.htmlAlias(ALIASES),
    plugins.scssEntry(),
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

  // Добавляем плагин оптимизации изображений, если он включен
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
        '@utils': resolve(PATHS.js, 'utils'),
        '@js': PATHS.js,
        '@scss': PATHS.scss,
        '@img': PATHS.img,
        '@vendor': PATHS.vendor,
        '@files': PATHS.files,
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
        },
      },
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
