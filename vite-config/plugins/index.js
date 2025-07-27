import sassGlobImports from 'vite-plugin-sass-glob-import';
import { fileIncludePlugin } from './file-include-plugin.js';
import { htmlAliasPlugin } from './html-alias-plugin.js';
import { copyResourcesPlugin } from './copy-resources-plugin.js';
import {
  fixFontPathsPlugin,
  processHtmlPlugin,
  fixAssetsPathsPlugin,
  renameJsPlugin
} from './html-processing-plugins.js';
import {
  scssEntryPlugin,
  htmlReloadPlugin,
  scssAliasPlugin,
  scssFileWatcherPlugin
} from './scss-plugins.js';
import { imageOptimizationPlugin } from './image-optimization-plugin.js';
import { HTML_ALIASES } from '../config/paths.js';

/**
 * Возвращает базовый набор плагинов для разработки
 * @returns {Array} Массив плагинов
 */
export async function getBasePlugins() {
  return [
    sassGlobImports(),
    fileIncludePlugin(),
    htmlAliasPlugin(HTML_ALIASES),
    scssEntryPlugin(),
    scssAliasPlugin(),
    htmlReloadPlugin(),
    scssFileWatcherPlugin()
  ];
}

/**
 * Возвращает плагины для копирования ресурсов
 * @returns {Array} Массив плагинов
 */
export function getResourcePlugins() {
  return [
    copyResourcesPlugin('images'),
    copyResourcesPlugin('vendor'),
    copyResourcesPlugin('fonts'),
    copyResourcesPlugin('files')
  ];
}

/**
 * Возвращает плагины для постобработки файлов
 * @returns {Array} Массив плагинов
 */
export function getPostProcessPlugins() {
  return [
    fixFontPathsPlugin(),
    processHtmlPlugin(),
    fixAssetsPathsPlugin(),
    renameJsPlugin()
  ];
}

/**
 * Возвращает все плагины для продакшн сборки
 * @param {boolean} withImageOptimization - Флаг оптимизации изображений
 * @returns {Array} Массив плагинов
 */
export async function getAllPlugins(withImageOptimization = false) {
  const basePlugins = await getBasePlugins();
  const allPlugins = [
    ...basePlugins,
    ...getResourcePlugins(),
    ...getPostProcessPlugins(),
  ];

  if (withImageOptimization) {
    allPlugins.push(await imageOptimizationPlugin());
  }

  return allPlugins;
} 