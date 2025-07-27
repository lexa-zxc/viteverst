/*
  Адаптивный размер шрифта для rem единиц
  
  initRes - базовое разрешение (1920x1080) для расчета масштаба
  width - ширина окна браузера (window.innerWidth)
  height - высота окна браузера (window.innerHeight)
  koeff - коэффициент масштабирования относительно базового разрешения
  fontSize - итоговый размер шрифта в px для html элемента
  
  Функция rem() пересчитывает базовый размер шрифта при изменении размера окна,
  что позволяет использовать rem единицы для адаптивной верстки
*/

const initRes = 1920 * 1080;
const html = document.documentElement;

const calculateScale = (width, height) => Math.sqrt((width * height) / initRes);
const setFontSize = fontSize => html.style.fontSize = `${fontSize.toFixed(1)}px`;

function rem() {
  const width = window.innerWidth, height = window.innerHeight;
  const koeff = calculateScale(width, height);

  // Стандартное масштабирование
  let fontSize = 10.8 * koeff; // Базовый размер для десктопов (1920x1080 в большую и меньшую сторону)

  // Кастомное мастшабирование для определенных устройств
  if (width <= 1600) fontSize = 11 * koeff;    // Большие ноутбуки
  if (width <= 1400) fontSize = 12.5 * koeff;  // Средние ноутбуки
  if (width <= 1300) fontSize = 10.5 * koeff;  // Маленькие ноутбуки
  if (width <= 1200) fontSize = 13 * koeff;    // Большие планшеты
  if (width <= 1100) fontSize = 12 * koeff;    // Средние планшеты
  if (width <= 960) fontSize = 10 * koeff;     // Маленькие планшеты
  if (width <= 767) fontSize = 10;             // Мобильные устройства (фиксированный размер)

  // Для примера
  // if (width <= 1920 && height <= 1080) fontSize = 15 * koeff;  // С высотой
  // if (width > 2560) fontSize = 12 * koeff;  // Кастомная настройка для 2K+

  setFontSize(fontSize);
}

rem();
window.addEventListener('resize', rem);