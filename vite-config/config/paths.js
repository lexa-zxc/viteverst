import { resolve } from 'path';

// Константы базовых директорий
export const APP_DIR = 'app';
export const DIST_DIR = 'dist';

// Объект с путями к различным директориям
export const PATHS = {
  app: resolve(process.cwd(), APP_DIR),
  dist: resolve(process.cwd(), DIST_DIR),
  public: resolve(process.cwd(), 'public'),
  js: resolve(process.cwd(), `${APP_DIR}/js`),
  scss: resolve(process.cwd(), `${APP_DIR}/scss`),
  img: resolve(process.cwd(), `${APP_DIR}/img`),
  vendor: resolve(process.cwd(), `${APP_DIR}/vendor`),
  files: resolve(process.cwd(), `${APP_DIR}/files`),
  fonts: resolve(process.cwd(), `${APP_DIR}/fonts`),
  html: resolve(process.cwd(), `${APP_DIR}/html`)
};

// Алиасы для разных контекстов
export const PROJECT_ALIASES = {
  '@scss': resolve(process.cwd(), `${APP_DIR}/scss`),
  '@js': resolve(process.cwd(), `${APP_DIR}/js`),
  '@img': resolve(process.cwd(), `${APP_DIR}/img`),
  '@utils': resolve(process.cwd(), `${APP_DIR}/js/utils`),
  '@vendor': resolve(process.cwd(), `${APP_DIR}/vendor`),
  '@files': resolve(process.cwd(), `${APP_DIR}/files`),
  '@fonts': resolve(process.cwd(), `${APP_DIR}/fonts`)
};

// Алиасы для HTML (используются в преобразовании)
export const HTML_ALIASES = {
  '@scss': 'scss',
  '@js': 'js',
  '@img': 'img',
  '@utils': 'js/utils',
  '@vendor': 'vendor',
  '@files': 'files',
  '@fonts': 'fonts'
};

// Алиасы для SCSS (относительные пути)
export const SCSS_ALIASES = {
  '@fonts': '../fonts',
  '@img': '../img',
  '@scss': '../scss',
  '@css': '../css',
  '@vendor': '../vendor',
  '@files': '../files'
}; 