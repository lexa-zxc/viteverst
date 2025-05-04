import fs from 'fs';
import { join, extname, resolve } from 'path';
import { PATHS } from '../config/paths.js';
import { SUPPORTED_IMAGE_FORMATS } from '../config/constants.js';

/**
 * Рекурсивное копирование директории
 * @param {string} src - Исходная директория
 * @param {string} dest - Целевая директория
 */
export function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
    
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Поиск HTML файлов для точек входа
 * @returns {Object} Объект с точками входа
 */
export function findHtmlEntries() {
  const entries = {};
  if (!fs.existsSync(PATHS.app)) return entries;

  fs.readdirSync(PATHS.app)
    .filter(file => file.endsWith('.html'))
    .forEach(file => {
      const name = file.replace('.html', '');
      entries[name] = resolve(PATHS.app, file);
    });

  return entries;
}

/**
 * Проверка является ли файл изображением
 * @param {string} filename - Имя файла
 * @returns {boolean} Результат проверки
 */
export function isImageFile(filename) {
  const ext = extname(filename).toLowerCase();
  return SUPPORTED_IMAGE_FORMATS.includes(ext);
}

/**
 * Форматирование размера файла
 * @param {number} bytes - Размер в байтах
 * @returns {string} Форматированный размер
 */
export function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Рекурсивный поиск всех изображений (кроме SVG)
 * @param {string} dir - Директория для поиска
 * @param {Array} fileList - Аккумулятор для результатов
 * @returns {Array} Массив путей к изображениям
 */
export function findAllImages(dir, fileList = []) {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = join(dir, file.name);
      
    if (file.isDirectory()) {
      findAllImages(fullPath, fileList);
    } else if (
      isImageFile(file.name) && 
      !file.name.toLowerCase().endsWith('.svg')
    ) {
      fileList.push(fullPath);
    }
  }

  return fileList;
}

/**
 * Собирает все файлы из директории для копирования
 * @param {string} src - Исходная директория
 * @param {string} dest - Целевая директория
 * @param {string} baseSrc - Базовая исходная директория
 * @param {string} baseDest - Базовая целевая директория
 * @returns {Array} Массив объектов с путями файлов
 */
export function collectFiles(src, dest, baseSrc, baseDest) {
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