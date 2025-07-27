/*
  Адаптивный размер шрифта для rem единиц
  
  initRes - базовое разрешение (1920x1080) для расчета масштаба
  w - ширина окна браузера (window.innerWidth)
  h - высота окна браузера (window.innerHeight)
  k - коэффициент масштабирования относительно базового разрешения
  size - итоговый размер шрифта в px для html элемента
  
  Функция rem() пересчитывает базовый размер шрифта при изменении размера окна,
  что позволяет использовать rem единицы для адаптивной верстки
*/

const initRes = 1920 * 1080;
const html = document.documentElement;

const scale = (w, h) => Math.sqrt((w * h) / initRes);
const setFontSize = size => html.style.fontSize = `${size.toFixed(1)}px`;

function rem() {
  const w = window.innerWidth, h = window.innerHeight;
  const k = scale(w, h);
  // Стандартное масштабирование
  let size = 10.8 * k; // Базовый размер для десктопов (1920x1080 в большую и меньшую сторону)

  // Кастомное мастшабирование для определенных устройств
  if (w <= 1600) size = 11 * k;    // Большие ноутбуки
  if (w <= 1400) size = 12.5 * k;  // Средние ноутбуки
  if (w <= 1300) size = 10.5 * k;  // Маленькие ноутбуки
  if (w <= 1200) size = 13 * k;    // Большие планшеты
  if (w <= 1100) size = 12 * k;    // Средние планшеты
  if (w <= 960) size = 10 * k;     // Маленькие планшеты
  if (w <= 767) size = 10;         // Мобильные устройства (фиксированный размер)

  // Для примера
  // if (w <= 1920 && h <= 1080) size = 15 * k;  // С высотой
  // if (w > 2560) size = 12 * k;  // Кастомная настройка для 2K+

  setFontSize(size);
}

rem();
window.addEventListener('resize', rem);