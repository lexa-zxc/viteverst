import fs from 'fs';
import { resolve, dirname, isAbsolute } from 'path';

/**
 * Функция для экранирования тегов code и pre
 * @param {string} html - Исходный HTML
 * @returns {string} HTML с экранированными блоками кода
 */
export function escapeCodeAndPre(html) {
  // Функция для кодирования содержимого тегов code и pre
  const escapeContent = (content) => {
    return Buffer.from(content).toString('base64');
  };

  // Функция для маркировки тегов
  const markTags = (html) => {
    // Маркируем код внутри pre>code
    return html.replace(
      /(<pre[^>]*>)(\s*)(<code[^>]*>)([\s\S]*?)(<\/code>)(\s*)(<\/pre>)/gi,
      (match, preBefore, wsBeforeCode, codeBefore, content, codeAfter, wsAfterCode, preAfter) => {
        const escapedContent = escapeContent(content);
        return `${preBefore}${wsBeforeCode}${codeBefore}<!-- VITE_IGNORE_START -->${escapedContent}<!-- VITE_IGNORE_END -->${codeAfter}${wsAfterCode}${preAfter}`;
      }
    );
  };

  return markTags(html);
}

/**
 * Функция для восстановления экранированного кода
 * @param {string} html - HTML с экранированными блоками кода
 * @returns {string} Исходный HTML
 */
export function unescapeCodeAndPre(html) {
  return html.replace(
    /<!-- VITE_IGNORE_START -->([^<]*)<!-- VITE_IGNORE_END -->/g,
    (match, encodedContent) => {
      try {
        return Buffer.from(encodedContent, 'base64').toString();
      } catch (e) {
        console.error('Ошибка декодирования:', e);
        return encodedContent;
      }
    }
  );
}

/**
 * Оборачивает функцию для защиты кода при обработке HTML
 * @param {Function} originalFunc - Исходная функция обработки HTML
 * @returns {Function} Обёрнутая функция
 */
export function wrapHtmlProcessor(originalFunc) {
  return function(html, ...args) {
    // Экранируем код перед обработкой
    const escapedHtml = escapeCodeAndPre(html);
    
    // Обрабатываем HTML, игнорируя экранированные участки
    const resultHtml = originalFunc.apply(this, [escapedHtml, ...args]);
    
    // Восстанавливаем экранированный код
    return unescapeCodeAndPre(resultHtml);
  };
}

/**
 * Получение содержимого файла с обработкой вложенных include
 * @param {string} filePath - Путь к файлу
 * @param {Object} params - Параметры для шаблонизации
 * @param {string} parentPath - Родительский путь
 * @param {string} filename - Текущий файл
 * @returns {string} Обработанное содержимое
 */
export function getFileContent(filePath, params = {}, parentPath = null, filename) {
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
      console.error(`Файл не найден: ${fullPath}`);
      return `<!-- Ошибка: файл не найден ${filePath} -->`;
    }

    let content = fs.readFileSync(fullPath, 'utf-8');

    // Рекурсивно обрабатываем вложенные include СНАЧАЛА
    content = processIncludes(content, dirname(fullPath), filename);
    
    // Заменяем параметры в шаблоне ПОСЛЕ обработки вложенных include
    Object.keys(params).forEach((key) => {
      const value = params[key] !== undefined ? params[key] : '';
      content = content.replace(
        new RegExp(`@@${key}`, 'g'),
        value
      );
    });
    
    // Удаляем все оставшиеся одиночные директивы @@, которые не были заменены
    // Но НЕ трогаем @@include(...)
    content = content.replace(/@@([a-zA-Z0-9_-]+)(?!\()/g, '');

    return content;
  } catch (error) {
    console.error(`Ошибка при чтении файла ${filePath}:`, error);
    return `<!-- Ошибка: не удалось включить файл ${filePath} -->`;
  }
}

/**
 * Обработка всех @@include в строке, игнорируя игнорируемые части
 * @param {string} content - Содержимое для обработки
 * @param {string} currentPath - Текущий путь
 * @param {string} filename - Текущий файл
 * @returns {string} Обработанное содержимое
 */
export function processIncludes(content, currentPath = null, filename) {
  // Разбиваем контент на части (ignored и не ignored)
  const parts = [];
  const regex = /<!-- VITE_IGNORE_START -->[\s\S]*?<!-- VITE_IGNORE_END -->/g;
  let lastIndex = 0;
  let match;

  // Собираем все игнорируемые части
  while ((match = regex.exec(content)) !== null) {
    // Добавляем часть до игнорируемого участка
    if (match.index > lastIndex) {
      parts.push({
        text: content.substring(lastIndex, match.index),
        ignore: false
      });
    }
    
    // Добавляем игнорируемый участок
    parts.push({
      text: match[0],
      ignore: true
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Добавляем оставшуюся часть после последнего игнорируемого участка
  if (lastIndex < content.length) {
    parts.push({
      text: content.substring(lastIndex),
      ignore: false
    });
  }
  
  // Обрабатываем только не игнорируемые части
  for (let i = 0; i < parts.length; i++) {
    if (!parts[i].ignore) {
      let part = parts[i].text;
      let hasChanges = true;
      
      // Повторяем обработку пока есть изменения (для вложенных include)
      while (hasChanges) {
        hasChanges = false;
        
        // Ищем первый @@include с его слотами
        const includeMatch = part.match(/@@include\(['"]([^'"]+)['"](,\s*({[^}]+}))?\)/);
        
        if (includeMatch) {
          const fullInclude = includeMatch[0];
          const filePath = includeMatch[1];
          const paramsStr = includeMatch[3];
          const includeIndex = part.indexOf(fullInclude);
          
          // Находим контент после @@include до следующего @@include или конца
          const afterInclude = part.substring(includeIndex + fullInclude.length);
          const nextIncludeIndex = afterInclude.search(/@@include\(/);
          const contentToCheck = nextIncludeIndex >= 0 
            ? afterInclude.substring(0, nextIncludeIndex)
            : afterInclude;
          
          // Извлекаем слоты из этого контента
          const slots = extractSlots(contentToCheck);
          
          // Удаляем слоты из контента
          const contentWithoutSlots = removeSlots(contentToCheck);
          
          // Парсим параметры
          let params = {};
          if (paramsStr) {
            try {
              params = JSON.parse(paramsStr);
            } catch (e) {
              console.error('Ошибка парсинга параметров:', e);
            }
          }
          
          // Добавляем слоты в параметры
          params = { ...params, ...slots };
          
          // Получаем содержимое файла
          const fileContent = getFileContent(filePath, params, currentPath, filename);
          
          // Собираем новый контент
          const beforeInclude = part.substring(0, includeIndex);
          const afterContent = nextIncludeIndex >= 0 
            ? afterInclude.substring(nextIncludeIndex)
            : '';
          
          part = beforeInclude + fileContent + contentWithoutSlots + afterContent;
          hasChanges = true;
        }
      }
      
      // Сохраняем обработанную часть
      parts[i].text = part;
    }
  }
  
  // Собираем все части обратно
  return parts.map(part => part.text).join('');
}

/**
 * Извлечение слотов из контента
 * @param {string} content - Содержимое для обработки
 * @returns {Object} Объект со слотами
 */
function extractSlots(content) {
  const slots = {};
  // Ищем паттерн: @@slotName\n...контент...\n-@@slotName
  const slotRegex = /@@([a-zA-Z0-9_-]+)\s*([\s\S]*?)\s*-@@\1/g;
  
  let match;
  while ((match = slotRegex.exec(content)) !== null) {
    const slotName = match[1];
    const slotContent = match[2].trim();
    slots[slotName] = slotContent;
  }
  
  return slots;
}

/**
 * Удаление слотов из контента
 * @param {string} content - Содержимое для обработки
 * @returns {string} Контент без слотов
 */
function removeSlots(content) {
  // Удаляем все слоты из контента
  const slotRegex = /@@([a-zA-Z0-9_-]+)\s*[\s\S]*?\s*-@@\1/g;
  return content.replace(slotRegex, '');
} 