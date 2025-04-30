import { defineConfig } from 'vite';
import { resolve } from 'path';
import sassGlobImports from 'vite-plugin-sass-glob-import';
import fs from 'fs';
import path from 'path';

// Создаем собственный плагин для обработки @@include
function createFileIncludePlugin() {
  return {
    name: 'vite:file-include',
    order: 'pre',
    transformIndexHtml: {
      handler(html, { filename }) {
        // Функция для получения содержимого файла с обработкой вложенных include
        function getFileContent(filePath, params = {}, parentPath = null) {
          try {
            // Определяем базовый путь для текущего контекста
            const basePath = parentPath || path.dirname(filename);
            // Если в пути нет директории html, и нет абсолютного пути, и базовый путь не содержит html
            // предполагаем что надо искать в директории html
            let adjustedPath = filePath;
            if (!filePath.includes('/') && !path.isAbsolute(filePath) && !basePath.includes('html')) {
              adjustedPath = `html/${filePath}`;
            }
            
            const fullPath = path.resolve(basePath, adjustedPath);
            
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

            // Рекурсивно обрабатываем вложенные include в этом файле
            const fileDir = path.dirname(fullPath);
            return processIncludes(content, fileDir);
          } catch (error) {
            console.error(`Ошибка при чтении файла ${filePath}:`, error);
            return `<!-- Ошибка: не удалось включить файл ${filePath} -->`;
          }
        }

        // Функция для обработки всех @@include в строке
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
              
              // Получаем содержимое файла (уже с обработанными вложенными include)
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
      }
    },
  };
}

// Создаем плагин для обработки HTML алиасов
function createHtmlAliasPlugin(aliases) {
  return {
    name: 'vite:html-alias',
    transformIndexHtml(html) {
      let result = html;

      // Заменяем абсолютные пути CSS/JS на относительные без ./
      result = result.replace(/(href|src)=["']\/([^"']+)["']/g, '$1="$2"');

      // Заменяем все алиасы в путях
      Object.keys(aliases).forEach((alias) => {
        // Экранируем @ для регулярного выражения
        const escapedAlias = alias.replace('@', '\\@');
        // Создаем регулярное выражение для поиска алиасов в путях
        const aliasRegex = new RegExp(
          `(src|href|url)=["']${escapedAlias}/([^"']+)["']`,
          'g'
        );
        // Заменяем на относительные пути для сборки без ./
        result = result.replace(aliasRegex, (match, attr, path) => {
          return `${attr}="${alias.replace('@', '')}/${path}"`;
        });
      });

      return result;
    },
  };
}

// Создаем плагин для копирования изображений
function createCopyImagesPlugin() {
  return {
    name: 'copy-images-plugin',
    apply: 'build',
    closeBundle: async () => {
      try {
        // Исходная директория с изображениями
        const imgSrcDir = path.resolve(__dirname, 'app/img');
        // Целевая директория для изображений в dist
        const imgDestDir = path.resolve(__dirname, 'dist/img');

        // Проверяем существование директории с изображениями
        if (!fs.existsSync(imgSrcDir)) {
          return;
        }

        // Создаем директорию для изображений, если она не существует
        if (!fs.existsSync(imgDestDir)) {
          fs.mkdirSync(imgDestDir, { recursive: true });
        }

        // Рекурсивная функция для копирования файлов
        function copyDir(src, dest) {
          const entries = fs.readdirSync(src, { withFileTypes: true });

          for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);

            if (entry.isDirectory()) {
              // Создаем поддиректорию
              if (!fs.existsSync(destPath)) {
                fs.mkdirSync(destPath, { recursive: true });
              }
              // Рекурсивно копируем содержимое
              copyDir(srcPath, destPath);
            } else {
              // Копируем файл
              fs.copyFileSync(srcPath, destPath);
            }
          }
        }

        // Копируем все изображения
        copyDir(imgSrcDir, imgDestDir);
        console.log('\x1b[36mImages copied\x1b[0m');
      } catch (error) {
        console.error('Ошибка при копировании изображений:', error);
      }
    }
  };
}

// Создаем плагин для копирования vendor директории
function createCopyVendorPlugin() {
  return {
    name: 'copy-vendor-plugin',
    apply: 'build',
    closeBundle: async () => {
      try {
        // Исходная директория vendor
        const vendorSrcDir = path.resolve(__dirname, 'app/vendor');
        // Целевая директория vendor в dist
        const vendorDestDir = path.resolve(__dirname, 'dist/vendor');

        // Проверяем существование директории vendor
        if (!fs.existsSync(vendorSrcDir)) {
          return;
        }

        // Создаем директорию для vendor в dist, если она не существует
        if (!fs.existsSync(vendorDestDir)) {
          fs.mkdirSync(vendorDestDir, { recursive: true });
        }

        // Рекурсивная функция для копирования файлов
        function copyDir(src, dest) {
          const entries = fs.readdirSync(src, { withFileTypes: true });

          for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);

            if (entry.isDirectory()) {
              // Создаем поддиректорию
              if (!fs.existsSync(destPath)) {
                fs.mkdirSync(destPath, { recursive: true });
              }
              // Рекурсивно копируем содержимое
              copyDir(srcPath, destPath);
            } else {
              // Копируем файл
              fs.copyFileSync(srcPath, destPath);
            }
          }
        }

        // Копируем всю директорию vendor
        copyDir(vendorSrcDir, vendorDestDir);
        console.log('\x1b[36mVendor files copied\x1b[0m');
      } catch (error) {
        console.error('Ошибка при копировании vendor:', error);
      }
    }
  };
}

// Создаем плагин для копирования шрифтов
function createCopyFontsPlugin() {
  return {
    name: 'copy-fonts-plugin',
    apply: 'build',
    closeBundle: async () => {
      try {
        const fontsSrcDir = path.resolve(__dirname, 'app/fonts');
        const fontsDestDir = path.resolve(__dirname, 'dist/fonts');

        if (!fs.existsSync(fontsSrcDir)) return;

        if (!fs.existsSync(fontsDestDir)) {
          fs.mkdirSync(fontsDestDir, { recursive: true });
        }

        const fontFiles = fs.readdirSync(fontsSrcDir);
        fontFiles.forEach(file => {
          if (/\.(woff2?|eot|ttf|otf)$/i.test(file)) {
            fs.copyFileSync(
              path.join(fontsSrcDir, file),
              path.join(fontsDestDir, file)
            );
          }
        });
        
        console.log('\x1b[32mШрифты скопированы\x1b[0m');
      } catch (error) {
        console.error('Ошибка при копировании шрифтов:', error);
      }
    }
  };
}

// Создаем плагин для исправления путей к шрифтам в CSS
function createFixFontPaths() {
  return {
    name: 'fix-font-paths',
    apply: 'build',
    closeBundle: async () => {
      try {
        const cssDir = path.resolve(__dirname, 'dist/css');
        if (!fs.existsSync(cssDir)) return;

        const cssFiles = fs.readdirSync(cssDir).filter(file => file.endsWith('.css'));
        
        cssFiles.forEach(cssFile => {
          const cssPath = path.join(cssDir, cssFile);
          let cssContent = fs.readFileSync(cssPath, 'utf-8');
          
          // Исправляем пути к шрифтам с сохранением форматирования
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
}

// Создаем плагин для удаления атрибутов crossorigin и type="module"
function createNoCorsAttributes() {
  return {
    name: 'no-cors-attributes',
    apply: 'build',
    closeBundle: async () => {
      try {
        const distDir = path.resolve(__dirname, 'dist');

        // Получаем список HTML файлов
        const htmlFiles = fs
          .readdirSync(distDir)
          .filter((file) => file.endsWith('.html'));

        // Обновляем каждый HTML файл, удаляя атрибуты crossorigin и type="module"
        htmlFiles.forEach((htmlFile) => {
          const htmlPath = path.resolve(distDir, htmlFile);
          let htmlContent = fs.readFileSync(htmlPath, 'utf-8');

          // Удаляем атрибут crossorigin из CSS
          htmlContent = htmlContent.replace(/crossorigin/g, '');

          // Удаляем атрибут type="module" из JS
          htmlContent = htmlContent.replace(/type="module"/g, '');
          
          // Заменяем пути к JS файлам, убирая хэши и добавляя атрибут defer
          htmlContent = htmlContent.replace(
            /<script[^>]*src="([^"]*\/)?js\/[^"]*\.js[^"]*"[^>]*>(<\/script>)?/g,
            '<script defer src="js/app.js"></script>'
          );
          
          // Заменяем пути к CSS файлам, убирая хэши
          htmlContent = htmlContent.replace(
            /<link[^>]*href="([^"]*\/)?css\/[^"]*\.css[^"]*"[^>]*>/g,
            '<link rel="stylesheet" href="css/app.css">'
          );
          
          // Заменяем подключение всех scss файлов на css/app.css
          htmlContent = htmlContent.replace(
            /<link[^>]*href="([^"]*\/)?scss\/[^"]*\.scss"[^>]*>/g,
            '<link rel="stylesheet" href="css/app.css">'
          );

          fs.writeFileSync(htmlPath, htmlContent);
        });
        
        console.log('\x1b[36mHTML attributes fixed\x1b[0m');
      } catch (error) {
        console.error('Ошибка при обработке HTML файлов:', error);
      }
    },
  };
}

// Создаем плагин для обработки скриптов после сборки
function createFixScriptPaths() {
  return {
    name: 'fix-script-paths',
    closeBundle: async () => {
      try {
        const distDir = path.resolve(__dirname, 'dist');
        // Получаем список HTML файлов
        const htmlFiles = fs
          .readdirSync(distDir)
          .filter((file) => file.endsWith('.html'));

        // Обновляем каждый HTML файл
        htmlFiles.forEach((htmlFile) => {
          const htmlPath = path.resolve(distDir, htmlFile);
          let htmlContent = fs.readFileSync(htmlPath, 'utf-8');

          // Удаляем ./ из всех путей
          htmlContent = htmlContent.replace(/(src|href)=["']\.\/([^"']+)["']/g, '$1="$2"');

          fs.writeFileSync(htmlPath, htmlContent);
        });

        console.log('\x1b[36mHTML paths fixed\x1b[0m');
      } catch (error) {
        // Ошибки не выводим
      }
    },
  };
}

// Создаем плагин для переименования файла app3.js в app.js
function createRenameJsPlugin() {
  return {
    name: 'rename-js-plugin',
    apply: 'build',
    closeBundle: async () => {
      try {
        const distDir = path.resolve(__dirname, 'dist');
        const jsDir = path.resolve(distDir, 'js');
        
        if (!fs.existsSync(jsDir)) {
          fs.mkdirSync(jsDir, { recursive: true });
          return;
        }
        
        // Получаем список всех JS файлов в директории js
        const jsFiles = fs.readdirSync(jsDir).filter(file => 
          file.startsWith('app') && file.endsWith('.js') && file !== 'app.js'
        );
        
        // Если существует app3.js, переименовываем его в app.js
        jsFiles.forEach(file => {
          const filePath = path.resolve(jsDir, file);
          const newFilePath = path.resolve(jsDir, 'app.js');
          
          // Если app.js уже существует, удаляем его
          if (fs.existsSync(newFilePath)) {
            fs.unlinkSync(newFilePath);
          }
          
          // Переименовываем файл
          fs.renameSync(filePath, newFilePath);
          console.log(`\x1b[32mФайл ${file} переименован в app.js\x1b[0m`);
        });
        
      } catch (error) {
        console.error('Ошибка при переименовании JS файла:', error);
      }
    }
  };
}

// Создаем плагин для обработки SCSS из HTML
function createScssEntryPlugin() {
  return {
    name: 'scss-entry-plugin',
    apply: 'build',
    buildStart() {
      try {
        const scssEntryPath = path.resolve(__dirname, 'app/scss/main.scss');
        if (fs.existsSync(scssEntryPath)) {
          // Создаем в кэше виртуальный файл для импорта стилей
          this.emitFile({
            type: 'chunk',
            id: scssEntryPath,
            name: 'styles'
          });
          console.log('\x1b[32mSCSS обработан как отдельная точка входа\x1b[0m');
        }
      } catch (error) {
        console.error('Ошибка при создании точки входа для SCSS:', error);
      }
    }
  };
}

// Функция для автоматического поиска HTML файлов в корне папки app
function findHtmlEntries() {
  const appDir = path.resolve(__dirname, 'app');
  const entries = {};
  
  // Проверяем, существует ли директория
  if (fs.existsSync(appDir)) {
    // Получаем список файлов в директории
    const files = fs.readdirSync(appDir);
    
    // Находим все HTML файлы в корне директории app
    files.forEach(file => {
      if (file.endsWith('.html')) {
        // Получаем имя файла без расширения
        const name = file.replace('.html', '');
        // Добавляем в объект entries
        entries[name] = path.resolve(appDir, file);
      }
    });
  }
  
  return entries;
}

export default defineConfig({
  root: 'app',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    manifest: false,
    rollupOptions: {
      input: {
        ...findHtmlEntries(),
        app: resolve(__dirname, 'app/js/app.js'),
        styles: resolve(__dirname, 'app/scss/main.scss')
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
      }
    }
  },
  publicDir: '../public',
  plugins: [
    sassGlobImports(),
    createFileIncludePlugin(),
    createHtmlAliasPlugin({
      '@scss': 'scss',
      '@js': 'js',
      '@img': 'img',
      '@utils': 'js/utils',
      '@vendor': 'vendor',
    }),
    createScssEntryPlugin(),
    createCopyImagesPlugin(),
    createCopyVendorPlugin(),
    createCopyFontsPlugin(),
    createFixFontPaths(),
    createNoCorsAttributes(),
    createFixScriptPaths(),
    createRenameJsPlugin(),
    // Плагин для перезагрузки страницы при изменении HTML
    {
      name: 'html-reload',
      handleHotUpdate({ file, server }) {
        if (file.endsWith('.html')) {
          server.ws.send({
            type: 'full-reload',
            path: '*',
          });
          return [];
        }
      },
    },
  ],
  resolve: {
    alias: {
      '@utils': resolve(__dirname, 'app/js/utils'),
      '@js': resolve(__dirname, 'app/js'),
      '@scss': resolve(__dirname, 'app/scss'),
      '@img': resolve(__dirname, 'app/img'),
      '@vendor': resolve(__dirname, 'app/vendor'),
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
});
