import fs from 'fs';
import { join } from 'path';
import { PATHS } from '../config/paths.js';
import { collectFiles } from '../utils/fs-utils.js';
import { MAX_PARALLEL_PROCESSES, DEFAULT_CHUNK_SIZE, CONSOLE_COLORS } from '../config/constants.js';

/**
 * Функция для копирования файла
 * @param {Object} file - Объект с информацией о файле
 * @returns {Object} Результат копирования
 */
function copyFile(file) {
  try {
    fs.copyFileSync(file.src, file.dest);
    return { success: true, file };
  } catch (error) {
    console.error(`Ошибка при копировании ${file.src}:`, error);
    return { success: false, file, error };
  }
}

/**
 * Разделение массива на чанки
 * @param {Array} array - Исходный массив
 * @param {number} size - Размер чанка
 * @returns {Array} Массив чанков
 */
function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Плагин для копирования ресурсов
 * @param {string} type - Тип ресурса ('images', 'vendor', 'fonts', 'files')
 * @returns {Object} Vite плагин
 */
export function copyResourcesPlugin(type) {
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
          
          // Создаем каталог назначения, если его нет
          if (!fs.existsSync(config.dest)) {
            fs.mkdirSync(config.dest, { recursive: true });
          }
          
          // Собираем список файлов для копирования
          const filesToCopy = collectFiles(config.src, config.dest, config.src, config.dest);
          
          // Если файлов много, используем параллельное копирование
          if (filesToCopy.length > DEFAULT_CHUNK_SIZE) {
            console.log(`${CONSOLE_COLORS.cyan}Начинаем копирование ${filesToCopy.length} файлов типа ${type}...${CONSOLE_COLORS.reset}`);
            
            // Определяем оптимальный размер чанка
            const CHUNK_SIZE = Math.max(1, Math.ceil(filesToCopy.length / MAX_PARALLEL_PROCESSES));
            const fileChunks = chunkArray(filesToCopy, CHUNK_SIZE);
            
            console.log(`${CONSOLE_COLORS.cyan}Использую ${fileChunks.length} параллельных потоков${CONSOLE_COLORS.reset}`);
            
            // Счетчики для отображения прогресса
            let processedCount = 0;
            const total = filesToCopy.length;
            
            // Функция обновления прогресса
            function updateProgress() {
              processedCount++;
              const percent = Math.round((processedCount / total) * 100);
              const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
              process.stdout.write(`\r${CONSOLE_COLORS.cyan}Копирование ${type}: ${percent}% (${processedCount}/${total}) - ${elapsed}с${CONSOLE_COLORS.reset}`);
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
              console.log(`${CONSOLE_COLORS.green}${config.logMessage} (${successCount} файлов за ${timeElapsed}с)${CONSOLE_COLORS.reset}`);
            } else {
              console.log(`${CONSOLE_COLORS.yellow}${config.logMessage} частично (${successCount} успешно, ${failedCount} с ошибками) за ${timeElapsed}с${CONSOLE_COLORS.reset}`);
            }
          } else {
            // Для небольшого количества файлов используем простое копирование
            for (const file of filesToCopy) {
              copyFile(file);
            }
            console.log(`${CONSOLE_COLORS.green}${config.logMessage}${CONSOLE_COLORS.reset}`);
          }
        }
      } catch (error) {
        console.error(`Ошибка при копировании ${type}:`, error);
      }
    }
  };
} 