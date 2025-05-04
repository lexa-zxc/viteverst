import fs from 'fs';
import { join, extname, basename } from 'path';
import { PATHS } from '../config/paths.js';
import { findAllImages, formatFileSize } from '../utils/fs-utils.js';
import { MAX_PARALLEL_PROCESSES, CONSOLE_COLORS, IMAGE_OPTIMIZATION } from '../config/constants.js';

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
 * Плагин для оптимизации изображений
 * @returns {Object} Vite плагин
 */
export async function imageOptimizationPlugin() {
  return {
    name: 'optimize-images-plugin',
    apply: 'build',
    enforce: 'post',
    closeBundle: async () => {
      try {
        const imgDistDir = join(PATHS.dist, 'img');
        if (!fs.existsSync(imgDistDir)) return;

        console.log(`${CONSOLE_COLORS.green}Начинаем оптимизацию изображений...${CONSOLE_COLORS.reset}`);

        // Находим все изображения (кроме SVG)
        const allImages = findAllImages(imgDistDir);

        if (allImages.length === 0) {
          console.log(`${CONSOLE_COLORS.yellow}Изображения для оптимизации не найдены${CONSOLE_COLORS.reset}`);
          return;
        }

        // Импортируем модули для оптимизации динамически
        const imagemin = (await import('imagemin')).default;
        const imageminMozjpeg = (await import('imagemin-mozjpeg')).default;
        const imageminPngquant = (await import('imagemin-pngquant')).default;
        const imageminGifsicle = (await import('imagemin-gifsicle')).default;
        
        console.log(`${CONSOLE_COLORS.cyan}Найдено изображений для оптимизации: ${allImages.length}${CONSOLE_COLORS.reset}`);
        
        // Создаем функцию для оптимизации одного изображения
        async function optimizeImage(imagePath) {
          const imageExt = extname(imagePath).toLowerCase();
          let plugins = [];
          let result = { path: imagePath, success: false, skipped: false };

          // Подбираем плагины в зависимости от типа файла
          if (['.jpg', '.jpeg'].includes(imageExt)) {
            plugins.push(imageminMozjpeg({ quality: IMAGE_OPTIMIZATION.jpeg.quality }));
          } else if (imageExt === '.png') {
            plugins.push(imageminPngquant({ quality: IMAGE_OPTIMIZATION.png.quality }));
          } else if (imageExt === '.gif') {
            plugins.push(imageminGifsicle({ optimizationLevel: IMAGE_OPTIMIZATION.gif.optimizationLevel }));
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
        
        // Определяем оптимальное количество изображений на поток
        const CHUNK_SIZE = Math.max(1, Math.ceil(allImages.length / MAX_PARALLEL_PROCESSES));
        const imageChunks = chunkArray(allImages, CHUNK_SIZE);
        
        console.log(`${CONSOLE_COLORS.cyan}Использую ${imageChunks.length} параллельных потоков для обработки${CONSOLE_COLORS.reset}`);
        
        // Счетчики для отображения прогресса
        let processedCount = 0;
        let startTime = Date.now();
        
        // Функция обновления прогресса
        function updateProgress() {
          processedCount++;
          const percent = Math.round((processedCount / allImages.length) * 100);
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          process.stdout.write(`\r${CONSOLE_COLORS.cyan}Оптимизация изображений: ${percent}% (${processedCount}/${allImages.length}) - ${elapsed}с${CONSOLE_COLORS.reset}`);
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
          console.log(`\n${CONSOLE_COLORS.green}----- Статистика оптимизации -----${CONSOLE_COLORS.reset}`);

          // Информация по каждому изображению
          optimizedImages.forEach((img) => {
            const originalSizeFormatted = formatFileSize(img.originalSize);
            const newSizeFormatted = formatFileSize(img.newSize);
            const arrowColor = img.compressionPercent >= 10 ? CONSOLE_COLORS.green : CONSOLE_COLORS.yellow;

            console.log(
              `${CONSOLE_COLORS.cyan}${img.name}${CONSOLE_COLORS.reset}: ${originalSizeFormatted} ${arrowColor}→${CONSOLE_COLORS.reset} ${newSizeFormatted} (${CONSOLE_COLORS.green}-${img.compressionPercent}%${CONSOLE_COLORS.reset})`
            );
          });

          // Общая статистика
          const totalSaved = totalOriginalSize - totalOptimizedSize;
          const totalPercent = Math.round((1 - totalOptimizedSize / totalOriginalSize) * 100);

          console.log(
            `\n${CONSOLE_COLORS.cyan}Общая экономия:${CONSOLE_COLORS.reset} ${formatFileSize(totalSaved)} (${CONSOLE_COLORS.green}-${totalPercent}%${CONSOLE_COLORS.reset})`
          );
          console.log(`${CONSOLE_COLORS.cyan}Успешно оптимизировано:${CONSOLE_COLORS.reset} ${optimizedImages.length}`);
          
          if (skippedImages.length > 0) {
            console.log(`${CONSOLE_COLORS.cyan}Пропущено (не требуется оптимизация):${CONSOLE_COLORS.reset} ${skippedImages.length}`);
          }
          
          if (failedImages.length > 0) {
            console.log(`${CONSOLE_COLORS.yellow}Не удалось оптимизировать:${CONSOLE_COLORS.reset} ${failedImages.length}`);
          }
          
          console.log(`${CONSOLE_COLORS.cyan}Время выполнения:${CONSOLE_COLORS.reset} ${((Date.now() - startTime) / 1000).toFixed(2)}с`);
          console.log(`${CONSOLE_COLORS.green}---------------------------------${CONSOLE_COLORS.reset}`);
        } else {
          console.log(`${CONSOLE_COLORS.yellow}Изображения не нуждаются в оптимизации${CONSOLE_COLORS.reset}`);
        }
      } catch (error) {
        console.error('Ошибка при оптимизации изображений:', error);
      }
    }
  };
} 