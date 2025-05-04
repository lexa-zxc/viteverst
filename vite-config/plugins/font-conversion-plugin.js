/**
 * Плагин для конвертации шрифтов TTF в WOFF2
 * Использует библиотеку ttf2woff2 для конвертации
 */
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import ttf2woff2 from 'ttf2woff2';

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat);

/**
 * Проверяет существование директории
 * @param {string} dir - Путь к директории
 * @returns {Promise<boolean>} - Существует ли директория
 */
async function directoryExists(dir) {
  try {
    const stats = await stat(dir);
    return stats.isDirectory();
  } catch (err) {
    return false;
  }
}

/**
 * Проверяет, существует ли файл
 * @param {string} filePath - Путь к файлу
 * @returns {Promise<boolean>} - Существует ли файл
 */
async function fileExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Конвертирует TTF файлы в WOFF2
 * @param {Object} options - Опции конвертации
 * @param {string} options.fontsDir - Путь к директории с шрифтами
 * @param {boolean} options.force - Принудительно пересоздавать WOFF2 файлы, даже если они уже существуют
 * @returns {Promise<{success: boolean, message: string, convertedFonts?: string[]}>} Результат операции
 */
export async function convertFonts({
  fontsDir = 'app/fonts',
  force = false
} = {}) {
  try {
    // Проверяем существование директории со шрифтами
    if (!(await directoryExists(fontsDir))) {
      return { 
        success: false, 
        message: `Директория ${fontsDir} не найдена` 
      };
    }
    
    // Получаем список файлов TTF в директории
    const files = await readdir(fontsDir);
    const ttfFiles = files.filter(file => path.extname(file).toLowerCase() === '.ttf');
    
    if (ttfFiles.length === 0) {
      return { 
        success: false, 
        message: `TTF файлы не найдены в директории ${fontsDir}` 
      };
    }
    
    const convertedFonts = [];
    const skippedFonts = [];
    
    // Обрабатываем каждый TTF файл
    for (const ttfFile of ttfFiles) {
      const sourceTtfPath = path.join(fontsDir, ttfFile);
      const fontName = path.basename(ttfFile, '.ttf');
      const targetWoff2Path = path.join(fontsDir, `${fontName}.woff2`);
      
      // Проверяем, нужно ли конвертировать файл
      const woff2Exists = await fileExists(targetWoff2Path);
      
      if (woff2Exists && !force) {
        skippedFonts.push(fontName);
        continue;
      }
      
      // Конвертируем TTF в WOFF2
      const ttfBuffer = await readFile(sourceTtfPath);
      const woff2Buffer = ttf2woff2(ttfBuffer);
      await writeFile(targetWoff2Path, woff2Buffer);
      
      convertedFonts.push(fontName);
    }
    
    // Формируем сообщение о результате
    if (convertedFonts.length === 0 && skippedFonts.length > 0) {
      return {
        success: true,
        message: `Все ${skippedFonts.length} WOFF2 шрифтов уже существуют. Используйте опцию --force для пересоздания`,
        convertedFonts: [],
        skippedFonts
      };
    } else if (convertedFonts.length > 0 && skippedFonts.length > 0) {
      return {
        success: true,
        message: `Сконвертировано ${convertedFonts.length} шрифтов, пропущено ${skippedFonts.length} шрифтов`,
        convertedFonts,
        skippedFonts
      };
    } else {
      return { 
        success: true, 
        message: `Успешно сконвертировано ${convertedFonts.length} шрифтов в формат WOFF2`,
        convertedFonts
      };
    }
  } catch (error) {
    return { 
      success: false, 
      message: `Ошибка при конвертации шрифтов: ${error.message}` 
    };
  }
}

/**
 * Создаёт Vite плагин для конвертации шрифтов
 * @param {Object} options - Опции плагина
 * @returns {Object} Vite плагин
 */
export function fontConversionPlugin(options = {}) {
  return {
    name: 'vite-plugin-font-conversion',
    enforce: 'pre',
    
    async buildStart() {
      const result = await convertFonts(options);
      console.log(`[Font Conversion] ${result.message}`);
      
      if (result.success && result.convertedFonts && result.convertedFonts.length > 0) {
        console.log(`[Font Conversion] Сконвертированные шрифты: ${result.convertedFonts.join(', ')}`);
      }
      
      if (result.success && result.skippedFonts && result.skippedFonts.length > 0) {
        console.log(`[Font Conversion] Пропущенные шрифты: ${result.skippedFonts.join(', ')}`);
      }
    }
  };
}

export default fontConversionPlugin; 