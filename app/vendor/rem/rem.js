/**
 * REM калькулятор - адаптивно меняет размер шрифта в зависимости от разрешения экрана
 */

// Исходное разрешение
const INITIAL_RESOLUTION = 1920 * 1080;
const HTML_ELEMENT = document.querySelector('html');

// Коэффициенты для разных разрешений экрана
const FONT_SIZE_COEFFICIENTS = [
  { minWidth: 2560, maxWidth: Infinity, coefficient: 10.8 }, // 2K+ разрешения
  { minWidth: 1600, maxWidth: 2560, coefficient: 10.8 }, // Десктоп (стандартный)
  { minWidth: 1400, maxWidth: 1600, coefficient: 12.5 }, // Большие ноутбуки
  { minWidth: 1300, maxWidth: 1400, coefficient: 12 }, // Стандартные ноутбуки
  { minWidth: 1200, maxWidth: 1300, coefficient: 13.0 }, // Маленькие ноутбуки
  { minWidth: 1100, maxWidth: 1200, coefficient: 13.0 }, // Большие планшеты (альбомная)
  { minWidth: 960, maxWidth: 1100, coefficient: 12.0 }, // Средние планшеты
  { minWidth: 767, maxWidth: 960, coefficient: 10.0 }, // Маленькие планшеты
  { minWidth: 0, maxWidth: 767, coefficient: null }, // Мобильные (сброс до 10px)
];

/**
 * Вычисляет коэффициент масштабирования на основе отношения к исходному разрешению
 * @param {number} windowWidth - Ширина окна браузера
 * @param {number} windowHeight - Высота окна браузера
 * @returns {number} - Коэффициент масштабирования
 */
function calculateSqrt(windowWidth, windowHeight) {
  return Math.sqrt((windowWidth * windowHeight) / INITIAL_RESOLUTION);
}

/**
 * Применяет рассчитанный размер шрифта к HTML элементу
 * @param {number} fontSize - Размер шрифта в пикселях
 */
function applyFontSize(fontSize) {
  HTML_ELEMENT.style.fontSize = `${fontSize.toFixed(1)}px`;
}

/**
 * Обработчик изменения размера окна
 */
function handleResize() {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  // Для мобильных устройств используем фиксированный размер шрифта
  if (windowWidth <= 767) {
    applyFontSize(10);
    return;
  }

  // Находим подходящий коэффициент для текущего разрешения
  const { coefficient } = FONT_SIZE_COEFFICIENTS.find(
    ({ minWidth, maxWidth }) =>
      windowWidth >= minWidth && windowWidth < maxWidth
  );

  // Рассчитываем размер шрифта
  const scaleFactor = calculateSqrt(windowWidth, windowHeight);
  const fontSize = coefficient * scaleFactor;

  applyFontSize(fontSize);
}

// Применяем размер шрифта сразу (до загрузки всех элементов)
handleResize();

// Обновляем размер шрифта при изменении размера окна
window.addEventListener('resize', handleResize);
