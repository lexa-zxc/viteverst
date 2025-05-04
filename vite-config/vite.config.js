import { createBuildConfig } from './config/build-config.js';
import {
  getAllPlugins,
  getBasePlugins
} from './plugins/index.js';
import { CONSOLE_COLORS } from './config/constants.js';

/**
 * Определение режима сборки и параметров конфигурации
 * @param {Object} env - Переменные окружения
 * @returns {Object} - Конфигурация Vite
 */
export default async function ({ mode }) {
  console.log(
    `${CONSOLE_COLORS.cyan}Режим сборки: ${CONSOLE_COLORS.green}${mode}${CONSOLE_COLORS.reset}`
  );

  const isDev = mode === 'development';
  const isProd = mode === 'production' || mode === 'production-min';
  const isMinify = mode === 'production-min';
  // Включаем оптимизацию изображений автоматически для режима production-min
  // или если установлена переменная окружения OPTIMIZE
  const withOptimization = isMinify || process.env.OPTIMIZE === 'true';

  // В режиме разработки используем только базовые плагины
  const plugins = isDev 
    ? await getBasePlugins() 
    : await getAllPlugins(withOptimization);

  // Создаем конфигурацию сборки с плагинами
  const config = createBuildConfig(isMinify, plugins);

  if (withOptimization) {
    console.log(
      `${CONSOLE_COLORS.yellow}Включена оптимизация изображений${CONSOLE_COLORS.reset}`
    );
  }

  if (isMinify) {
    console.log(
      `${CONSOLE_COLORS.yellow}Включена минификация кода${CONSOLE_COLORS.reset}`
    );
  }

  return config;
} 