/**
 * Скрипт для прямой сборки JavaScript с сохранением комментариев
 * Использует прямое копирование и обработку файлов
 */
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import fs from 'fs';

// Получаем dirname для ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Пути - обновлены для работы из директории vite-config/scripts
const PROJECT_ROOT = path.join(__dirname, '..', '..');
const SRC_DIR = path.join(PROJECT_ROOT, 'app', 'js');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist', 'js');
const MAIN_JS = path.join(SRC_DIR, 'app.js');
const OUTPUT_JS = path.join(DIST_DIR, 'app.js');

console.log('🚀 Прямая сборка JS с сохранением комментариев...');

// Убеждаемся, что выходная директория существует
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

/**
 * Рекурсивно преобразует импорты в файлах
 * @param {string} filePath - Путь к файлу
 * @param {Set<string>} visitedFiles - Множество посещенных файлов
 * @param {Map<string, string>} processedFiles - Кеш уже обработанных файлов
 * @returns {string} - Обработанное содержимое файла
 */
async function processFile(
  filePath,
  visitedFiles = new Set(),
  processedFiles = new Map()
) {
  if (visitedFiles.has(filePath)) {
    // Если файл уже был обработан в текущей цепочке импортов, возвращаем только ссылку
    return `/* Циклический импорт из ${path.relative(SRC_DIR, filePath)} */`;
  }

  // Если файл уже полностью обработан ранее, возвращаем его содержимое
  if (processedFiles.has(filePath)) {
    return processedFiles.get(filePath);
  }

  visitedFiles.add(filePath);

  // Читаем содержимое файла
  let content = fs.readFileSync(filePath, { encoding: 'utf8' });

  // Ищем импорты и подставляем их содержимое инлайн
  const importRegex = /import\s+(?:{([^}]+)}\s+from\s+)?['"]([^'"]+)['"]/g;
  const imports = [...content.matchAll(importRegex)];

  for (const importMatch of imports) {
    const [fullImport, namedImports, importPath] = importMatch;

    // Определяем путь к импортируемому файлу
    let resolvedPath;
    if (importPath.startsWith('@utils/')) {
      resolvedPath = path.join(
        SRC_DIR,
        'utils',
        importPath.replace('@utils/', '')
      );
    } else if (importPath.startsWith('@js/')) {
      resolvedPath = path.join(SRC_DIR, importPath.replace('@js/', ''));
    } else if (importPath.startsWith('./')) {
      resolvedPath = path.join(path.dirname(filePath), importPath);
    } else {
      // Пропускаем внешние импорты
      continue;
    }

    // Добавляем .js расширение если нет
    if (!resolvedPath.endsWith('.js')) {
      resolvedPath += '.js';
    }

    // Обрабатываем импортированный файл рекурсивно
    const newVisited = new Set(visitedFiles);
    const importedContent = await processFile(
      resolvedPath,
      newVisited,
      processedFiles
    );

    // Заменяем импорт содержимым файла
    content = content.replace(
      fullImport,
      `/* Инлайн импорт из ${path.relative(
        SRC_DIR,
        resolvedPath
      )} */\n${importedContent}\n`
    );
  }

  // Сохраняем обработанное содержимое файла в кеше
  processedFiles.set(filePath, content);

  return content;
}

// Запуск сборки
async function build() {
  try {
    const processedFiles = new Map(); // Кеш для предотвращения дублирования

    // Сначала обрабатываем главный файл для построения полного дерева зависимостей
    const processedContent = await processFile(
      MAIN_JS,
      new Set(),
      processedFiles
    );

    // Post-processing для удаления экспортов и повторяющихся определений
    let finalContent = processedContent
      // Заменяем экспорты на обычные объявления переменных в начале файла
      .replace(/export const ([^=]+)\s*=\s*([^;]+);/g, 'const $1 = $2;')
      .replace(/export function ([^\(]+)/g, 'function $1')
      // Собираем все экспорты в конец файла
      .replace(/export \{ [^\}]+ \};/g, '')
      // Исправляем дублирующиеся определения констант
      .replace(
        /\/\/ Константы проекта\s*const device_width[\s\S]*?const gsap_ease[\s\S]*?;/g,
        function (match, offset) {
          // Сохраняем только первое определение
          return offset === processedContent.indexOf(match)
            ? match
            : '// (Определение констант уже было добавлено ранее)';
        }
      );

    // Добавляем определения основных констант в начало файла, чтобы они точно были доступны
    finalContent =
      '// Основные константы проекта\nconst device_width = window.innerWidth;\nconst gsap_ease = "power4.out";\n\n' +
      finalContent;

    // Удаляем пустые блоки импортов и комментарии о повторных определениях
    finalContent = finalContent
      .replace(
        /\/\* Инлайн импорт из utils\\constants.js \*\/\s*\/\/ \(Определение констант уже было добавлено ранее\)\s*;/g,
        ''
      )
      .replace(/\n\s*;\s*\n/g, '\n\n')
      .replace(/\n\n\n+/g, '\n\n');

    // Оборачиваем в IIFE
    let wrappedContent = `(function() {\n${finalContent}\n})();`;

    // Добавляем BOM-метку для корректного отображения UTF-8 в Windows
    const bomPrefix = '\ufeff';

    // Записываем результат
    fs.writeFileSync(OUTPUT_JS, bomPrefix + wrappedContent, {
      encoding: 'utf8',
    });

    const fileSize = Math.round(fs.statSync(OUTPUT_JS).size / 1024);
    console.log(`✅ Сборка JS успешно завершена!`);
    console.log(`📄 Файл: ${path.basename(OUTPUT_JS)}`);
    console.log(`📏 Размер файла: ${fileSize} KB`);
  } catch (error) {
    console.error('❌ Ошибка при сборке JS:', error);
    process.exit(1);
  }
}

// Запускаем сборку
build();
