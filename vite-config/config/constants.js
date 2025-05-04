import { cpus } from 'node:os';

// Максимальное количество параллельных процессов
export const MAX_PARALLEL_PROCESSES = Math.max(1, cpus().length - 1);

// Размер чанка файлов для многопоточной обработки
export const DEFAULT_CHUNK_SIZE = 100;

// Цвета для вывода в консоль
export const CONSOLE_COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

// Конфигурация оптимизации изображений
export const IMAGE_OPTIMIZATION = {
  jpeg: {
    quality: 80
  },
  png: {
    quality: [0.6, 0.8]
  },
  gif: {
    optimizationLevel: 7
  }
};

// Список поддерживаемых форматов изображений
export const SUPPORTED_IMAGE_FORMATS = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.ico']; 