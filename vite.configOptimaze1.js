import { defineConfig } from 'vite';
import { resolve, join, dirname, extname, basename, isAbsolute } from 'path';
import sassGlobImports from 'vite-plugin-sass-glob-import';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import autoprefixer from 'autoprefixer';
import postcssSortMediaQueries from 'postcss-sort-media-queries';
import os from 'os';

const execAsync = promisify(exec);
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
  html: resolve(__dirname, `${APP_DIR}/html`),
};

const MAX_PARALLEL_PROCESSES = Math.max(1, os.cpus().length - 1);
const PROJECT_ALIASES = {
  '@scss': resolve(__dirname, `${APP_DIR}/scss`),
  '@js': resolve(__dirname, `${APP_DIR}/js`),
  '@img': resolve(__dirname, `${APP_DIR}/img`),
  '@utils': resolve(__dirname, `${APP_DIR}/js/utils`),
  '@vendor': resolve(__dirname, `${APP_DIR}/vendor`),
  '@files': resolve(__dirname, `${APP_DIR}/files`),
  '@fonts': resolve(__dirname, `${APP_DIR}/fonts`),
};

const HTML_ALIASES = {
  '@scss': 'scss',
  '@js': 'js',
  '@img': 'img',
  '@utils': 'js/utils',
  '@vendor': 'vendor',
  '@files': 'files',
  '@fonts': 'fonts',
};

const SCSS_ALIASES = {
  '@fonts': '../fonts',
  '@img': '../img',
  '@scss': '../scss',
  '@css': '../css',
  '@vendor': '../vendor',
  '@files': '../files',
};

const fsUtils = {
  copyDir(src, dest) {
    if (!fs.existsSync(src)) return;
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

    fs.readdirSync(src, { withFileTypes: true }).forEach((entry) => {
      const srcPath = join(src, entry.name);
      const destPath = join(dest, entry.name);
      entry.isDirectory()
        ? this.copyDir(srcPath, destPath)
        : fs.copyFileSync(srcPath, destPath);
    });
  },

  findHtmlEntries() {
    return fs.existsSync(PATHS.app)
      ? fs
          .readdirSync(PATHS.app)
          .filter((file) => file.endsWith('.html'))
          .reduce(
            (entries, file) => ({
              ...entries,
              [file.replace('.html', '')]: resolve(PATHS.app, file),
            }),
            {}
          )
      : {};
  },

  isImageFile(filename) {
    return ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.ico'].includes(
      extname(filename).toLowerCase()
    );
  },

  formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  },

  findAllImages(dir, fileList = []) {
    fs.readdirSync(dir, { withFileTypes: true }).forEach((file) => {
      const fullPath = join(dir, file.name);
      file.isDirectory()
        ? this.findAllImages(fullPath, fileList)
        : this.isImageFile(file.name) &&
          !file.name.endsWith('.svg') &&
          fileList.push(fullPath);
    });
    return fileList;
  },
};

const escapeCodeAndPre = (html) =>
  html.replace(
    /(<pre[^>]*>)(\s*)(<code[^>]*>)([\s\S]*?)(<\/code>)(\s*)(<\/pre>)/gi,
    (_, p1, p2, p3, p4, p5, p6, p7) =>
      `${p1}${p2}${p3}<!-- VITE_IGNORE_START -->${Buffer.from(p4).toString(
        'base64'
      )}<!-- VITE_IGNORE_END -->${p5}${p6}${p7}`
  );

const unescapeCodeAndPre = (html) =>
  html.replace(
    /<!-- VITE_IGNORE_START -->([^<]*)<!-- VITE_IGNORE_END -->/g,
    (_, c) => Buffer.from(c, 'base64').toString()
  );

const wrapHtmlProcessor =
  (originalFunc) =>
  (html, ...args) =>
    unescapeCodeAndPre(originalFunc(escapeCodeAndPre(html), ...args));

const plugins = {
  // Исправленная версия функции fileInclude
  fileInclude: () => ({
    name: 'vite:file-include',
    order: 'pre',
    transformIndexHtml: {
      handler: wrapHtmlProcessor((html, { filename }) => {
        const getFileContent = (filePath, params = {}, parentPath = null) => {
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
              console.error(`File not found: ${fullPath}`);
              return `<!-- Error: file not found ${filePath} -->`;
            }

            let content = fs.readFileSync(fullPath, 'utf-8');
            Object.keys(params).forEach((key) => {
              content = content.replace(
                new RegExp(`@@${key}`, 'g'),
                params[key]
              );
            });
            return processIncludes(content, dirname(fullPath));
          } catch (error) {
            console.error(`Error reading file ${filePath}:`, error);
            return `<!-- Error including ${filePath} -->`;
          }
        };

        const processIncludes = (content, currentPath = null) => {
          const parts = [];
          const regex =
            /<!-- VITE_IGNORE_START -->[\s\S]*?<!-- VITE_IGNORE_END -->/g;
          let lastIndex = 0,
            match;

          while ((match = regex.exec(content)) !== null) {
            if (match.index > lastIndex)
              parts.push({
                text: content.substring(lastIndex, match.index),
                ignore: false,
              });
            parts.push({ text: match[0], ignore: true });
            lastIndex = match.index + match[0].length;
          }
          if (lastIndex < content.length)
            parts.push({ text: content.substring(lastIndex), ignore: false });

          return parts
            .map((part) =>
              part.ignore
                ? part.text
                : part.text.replace(
                    /@@include\(['"]([^'"]+)['"](,\s*({[^}]+}))?\)/g,
                    (_, filePath, paramGroup, paramsStr) =>
                      getFileContent(
                        filePath,
                        paramsStr
                          ? JSON.parse(paramsStr.replace(/^\s*,\s*/, ''))
                          : {},
                        currentPath
                      )
                  )
            )
            .join('');
        };

        return processIncludes(html);
      }),
    },
  }),

  htmlAlias: (aliases) => ({
    name: 'vite:html-alias',
    transformIndexHtml: wrapHtmlProcessor((html) =>
      Object.entries(aliases).reduce(
        (result, [alias, path]) =>
          result.replace(
            new RegExp(
              `(src|href|url|poster|data-src|data-background)=["']${alias.replace(
                '@',
                '\\@'
              )}/([^"']+)["']`,
              'g'
            ),
            `$1="${path}/$2"`
          ),
        html.replace(/(href|src)=["']\/([^"']+)["']/g, '$1="$2"')
      )
    ),
  }),

  copyResources: (type) => ({
    name: `copy-${type}-plugin`,
    apply: 'build',
    closeBundle: async () => {
      const config = {
        images: {
          src: PATHS.img,
          dest: join(PATHS.dist, 'img'),
          log: 'Images copied',
        },
        vendor: {
          src: PATHS.vendor,
          dest: join(PATHS.dist, 'vendor'),
          log: 'Vendor files copied',
        },
        fonts: {
          src: PATHS.fonts,
          dest: join(PATHS.dist, 'fonts'),
          log: 'Fonts copied',
        },
        files: {
          src: PATHS.files,
          dest: join(PATHS.dist, 'files'),
          log: 'Files copied',
        },
      }[type];

      if (!fs.existsSync(config.src)) return;

      const start = Date.now();
      const files = [];
      const collectFiles = (src, dest) => {
        fs.readdirSync(src, { withFileTypes: true }).forEach((entry) => {
          const srcPath = join(src, entry.name);
          const destPath = join(dest, entry.name);
          entry.isDirectory()
            ? collectFiles(srcPath, destPath)
            : files.push({ src: srcPath, dest: destPath });
        });
      };

      if (!fs.existsSync(config.dest))
        fs.mkdirSync(config.dest, { recursive: true });
      collectFiles(config.src, config.dest);

      if (files.length > 100) {
        console.log(`\x1b[36mCopying ${files.length} ${type} files...\x1b[0m`);
        const chunkSize = Math.ceil(files.length / MAX_PARALLEL_PROCESSES);
        const chunks = Array.from(
          { length: Math.ceil(files.length / chunkSize) },
          (_, i) => files.slice(i * chunkSize, (i + 1) * chunkSize)
        );

        let processed = 0;
        await Promise.all(
          chunks.map(async (chunk) => {
            for (const file of chunk) {
              fs.copyFileSync(file.src, file.dest);
              process.stdout.write(
                `\r\x1b[36m${type} copy: ${Math.round(
                  (++processed / files.length) * 100
                )}% (${processed}/${files.length}) - ${(
                  (Date.now() - start) /
                  1000
                ).toFixed(1)}s\x1b[0m`
              );
            }
          })
        );
        console.log(
          `\n\x1b[32m${config.log} (${files.length} files in ${(
            (Date.now() - start) /
            1000
          ).toFixed(2)}s)\x1b[0m`
        );
      } else {
        fsUtils.copyDir(config.src, config.dest);
        console.log(`\x1b[32m${config.log}\x1b[0m`);
      }
    },
  }),

  fixFontPaths: () => ({
    name: 'fix-font-paths',
    apply: 'build',
    closeBundle: async () => {
      const cssDir = join(PATHS.dist, 'css');
      if (!fs.existsSync(cssDir)) return;

      fs.readdirSync(cssDir)
        .filter((file) => file.endsWith('.css'))
        .forEach((file) =>
          fs.writeFileSync(
            join(cssDir, file),
            fs
              .readFileSync(join(cssDir, file), 'utf-8')
              .replace(
                /url\(['"]?\/fonts\/([^'")]+)['"]?\)/g,
                'url("../fonts/$1")'
              )
          )
        );
      console.log('\x1b[32mFont paths fixed\x1b[0m');
    },
  }),

  processHtml: () => ({
    name: 'no-cors-attributes',
    apply: 'build',
    closeBundle: async () => {
      fs.readdirSync(PATHS.dist)
        .filter((file) => file.endsWith('.html'))
        .forEach((file) => {
          const path = resolve(PATHS.dist, file);
          fs.writeFileSync(
            path,
            escapeCodeAndPre(fs.readFileSync(path, 'utf-8'))
              .replace(/crossorigin|type="module"/g, '')
              .replace(
                /<script[^>]*src="([^"]*\/)?js\/[^"]*\.js[^"]*"[^>]*>(<\/script>)?/g,
                '<script defer src="js/app.js"></script>'
              )
              .replace(
                /<link[^>]*href="([^"]*\/)?(css|scss)\/[^"]*\.(css|scss)[^"]*"[^>]*>/g,
                '<link rel="stylesheet" href="css/app.css">'
              )
          );
        });
      console.log('\x1b[32mHTML attributes fixed\x1b[0m');
    },
  }),

  fixAssetsPaths: () => ({
    name: 'fix-script-paths',
    closeBundle: async () => {
      fs.readdirSync(PATHS.dist)
        .filter((file) => file.endsWith('.html'))
        .forEach((file) =>
          fs.writeFileSync(
            resolve(PATHS.dist, file),
            fs
              .readFileSync(resolve(PATHS.dist, file), 'utf-8')
              .replace(/(src|href)=["']\.\/([^"']+)["']/g, '$1="$2"')
          )
        );
      console.log('\x1b[32mAsset paths fixed\x1b[0m');
    },
  }),

  renameJs: () => ({
    name: 'rename-js-plugin',
    apply: 'build',
    closeBundle: async () => {
      const jsDir = join(PATHS.dist, 'js');
      if (!fs.existsSync(jsDir)) return;

      fs.readdirSync(jsDir)
        .filter(
          (file) =>
            file.startsWith('app') && file.endsWith('.js') && file !== 'app.js'
        )
        .forEach((file) => {
          const newPath = join(jsDir, 'app.js');
          fs.existsSync(newPath) && fs.unlinkSync(newPath);
          fs.renameSync(join(jsDir, file), newPath);
        });
    },
  }),

  scssEntry: () => ({
    name: 'scss-entry-plugin',
    apply: 'build',
    buildStart() {
      const entryPath = join(PATHS.scss, 'main.scss');
      if (fs.existsSync(entryPath)) {
        this.emitFile({ type: 'chunk', id: entryPath, name: 'styles' });
        console.log('\x1b[32mSCSS entry processed\x1b[0m');
      }
    },
  }),

  htmlReload: () => ({
    name: 'html-reload',
    handleHotUpdate({ file, server }) {
      file.endsWith('.html') &&
        server.ws.send({ type: 'full-reload', path: '*' });
      return [];
    },
  }),

  imageOptimization: () => ({
    name: 'optimize-images-plugin',
    apply: 'build',
    enforce: 'post',
    closeBundle: async () => {
      const imgDir = join(PATHS.dist, 'img');
      if (!fs.existsSync(imgDir)) return;

      console.log('\x1b[32mOptimizing images...\x1b[0m');
      const images = fsUtils.findAllImages(imgDir);
      if (!images.length)
        return console.log('\x1b[33mNo images to optimize\x1b[0m');

      const { default: imagemin } = await import('imagemin');
      const plugins = [
        (await import('imagemin-mozjpeg')).default({ quality: 80 }),
        (await import('imagemin-pngquant')).default({ quality: [0.6, 0.8] }),
        (await import('imagemin-gifsicle')).default({ optimizationLevel: 7 }),
      ];

      const start = Date.now();
      const chunkSize = Math.ceil(images.length / MAX_PARALLEL_PROCESSES);
      const chunks = Array.from(
        { length: Math.ceil(images.length / chunkSize) },
        (_, i) => images.slice(i * chunkSize, (i + 1) * chunkSize)
      );

      let processed = 0;
      const results = (
        await Promise.all(
          chunks.map(async (chunk) => {
            const chunkResults = [];
            for (const img of chunk) {
              const ext = extname(img).toLowerCase();
              if (!['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
                chunkResults.push({ path: img, skipped: true });
                continue;
              }

              try {
                const original = fs.statSync(img).size;
                const optimized = await imagemin.buffer(fs.readFileSync(img), {
                  plugins: [
                    plugins.find((p) =>
                      p.name.includes(ext.replace('.', ''))
                    ) || plugins[0],
                  ],
                });
                fs.writeFileSync(img, optimized);
                chunkResults.push({
                  path: img,
                  name: basename(img),
                  originalSize: original,
                  newSize: fs.statSync(img).size,
                  compressionPercent: Math.round(
                    (1 - fs.statSync(img).size / original) * 100
                  ),
                  success: true,
                });
              } catch (e) {
                chunkResults.push({ path: img, error: e.message });
              }
              process.stdout.write(
                `\r\x1b[36mOptimizing: ${Math.round(
                  (++processed / images.length) * 100
                )}% (${processed}/${images.length}) - ${(
                  (Date.now() - start) /
                  1000
                ).toFixed(1)}s\x1b[0m`
              );
            }
            return chunkResults;
          })
        )
      ).flat();

      const optimized = results.filter((r) => r.success);
      if (optimized.length) {
        const totalSaved = optimized.reduce(
          (sum, img) => sum + (img.originalSize - img.newSize),
          0
        );
        console.log(
          `\n\x1b[32mSaved ${fsUtils.formatFileSize(totalSaved)} (${Math.round(
            (totalSaved /
              optimized.reduce((sum, img) => sum + img.originalSize, 0)) *
              100
          )}%)\x1b[0m`
        );
      }
    },
  }),

  scssAlias: () => ({
    name: 'scss-alias-plugin',
    transform: (code, id) =>
      id.match(/\.(scss|sass|css)$/)
        ? {
            code: Object.entries(SCSS_ALIASES).reduce(
              (result, [alias, path]) =>
                result
                  .replace(
                    new RegExp(
                      `(@import|@use|@forward)\\s+["']${alias.replace(
                        '@',
                        ''
                      )}/([^"']+)["']`,
                      'g'
                    ),
                    `$1 "${path}/$2"`
                  )
                  .replace(
                    new RegExp(
                      `url\\(["']?${alias.replace('@', '')}/([^"')]+)["']?\\)`,
                      'g'
                    ),
                    `url("${path}/$1")`
                  ),
              code
            ),
            map: null,
          }
        : null,
  }),
};

const createConfig = (minify = false, imageOptimization = false) => ({
  root: APP_DIR,
  build: {
    outDir: '../dist',
    emptyOutDir: true,
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
        assetFileNames: ({ name }) => {
          const ext = name.split('.').pop();
          return /css/i.test(ext)
            ? 'css/app.css'
            : /(png|jpe?g|gif|svg|webp|ico)/i.test(ext)
            ? 'img/[name][extname]'
            : /(woff|woff2|eot|ttf|otf)/i.test(ext)
            ? 'fonts/[name][extname]'
            : 'assets/[name][extname]';
        },
      },
    },
  },
  publicDir: '../public',
  plugins: [
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
    plugins.fixAssetsPaths(),
    plugins.renameJs(),
    plugins.htmlReload(),
    ...(imageOptimization ? [plugins.imageOptimization()] : []),
  ],
  resolve: { alias: PROJECT_ALIASES },
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        quietDeps: true,
        logger: { warn: () => {} },
        additionalData: Object.entries(SCSS_ALIASES)
          .map(([alias, path]) => `$${alias.substring(1)}-path: "${path}";`)
          .join('\n'),
      },
    },
    postcss: {
      plugins: [
        autoprefixer({
          overrideBrowserslist: ['last 5 versions'],
          grid: false,
          flexbox: false,
          remove: false,
        }),
        postcssSortMediaQueries({ sort: 'mobile-first' }),
      ],
    },
  },
});

export default defineConfig(({ mode }) => {
  console.log(`\x1b[32mMode: ${mode}\x1b[0m`);
  return createConfig(mode === 'production-min', mode === 'production-min');
});
