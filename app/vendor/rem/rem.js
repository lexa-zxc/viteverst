// Исходное разрешение
const initialResolution = 1920 * 1080;
const htmlElement = document.querySelector('html');

// Функция для рассчета размера шрифта
function calculateFontSize(windowWidth, windowHeight) {
  return 10.8 * calculateSqrt(windowWidth, windowHeight);
}

// Функция для вычисления квадратного корня
function calculateSqrt(windowWidth, windowHeight) {
  return Math.sqrt((windowWidth * windowHeight) / initialResolution);
}

// Функция для применения размера шрифта к элементу
function applyFontSize(fontSize) {
  fontSize = fontSize.toFixed(1); // Округляем до одного знака после запятой
  htmlElement.style.fontSize = `${fontSize}px`;
}

// Функция для обработки изменения размера окна
function handleResize() {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  let fontSize = calculateFontSize(windowWidth, windowHeight);

  if (windowWidth < 1600) {
    fontSize = 12.5 * calculateSqrt(windowWidth, windowHeight); // Большие ноуты
  }
  if (windowWidth < 1400) {
    fontSize = 13.5 * calculateSqrt(windowWidth, windowHeight); // Маленькие ноуты
  }
  if (windowWidth < 1300) {
    fontSize = 13 * calculateSqrt(windowWidth, windowHeight); // Супер мини ноуты
  }
  if (windowWidth < 1200) {
    fontSize = 13 * calculateSqrt(windowWidth, windowHeight); // Большие планшеты
  }
  if (windowWidth < 1100) {
    fontSize = 12 * calculateSqrt(windowWidth, windowHeight); // Большие планшеты
  }
  if (windowWidth < 960) {
    fontSize = 10 * calculateSqrt(windowWidth, windowHeight); // Маленькине планшеты
  }
  if (windowWidth <= 767) {
    fontSize = 10; // Сбрасываем размер шрифта к 10px на мобильных устройствах
  }

  applyFontSize(fontSize);
}

handleResize(); // Не дожидаемся загрузки всех элементв и сразу вызываем (что-бы не было артефактов)
window.addEventListener('resize', handleResize); // Слушатель события изменения размера окна
