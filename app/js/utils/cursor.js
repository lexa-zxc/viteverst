// Импортируем константы
import { device_width, gsap_ease } from '@utils/constants.js';

//==============================//
//======== КУРСОР =========//
//==============================//

// Объявляем переменные в глобальной области видимости модуля
let $bigCircle;
let $smallCircle;
let $smallPlus;
let $smallPlusArea;
let $hoverables;
let hoverablesArea;

/**
 * Инициализирует кастомный курсор
 */
export function initCursor() {
  // Проверяем размер экрана
  if (device_width <= 1100) return;

  // Инициализируем элементы
  $bigCircle = document.querySelector('.cursor__circle--big');
  $smallCircle = document.querySelector('.cursor__circle--small');
  $smallPlus = document.querySelector('.cursor__plus');
  $smallPlusArea = document.querySelector('.cursor__plus--area');
  $hoverables = document.querySelectorAll(
    'a:not([class*="gallery-item"]):not(.reviews-card__link):not(.hoverable-area), .btn, .nav-next, .nav-prev'
  );
  hoverablesArea = document.querySelectorAll('.hoverable-area');

  // Добавляем обработчики событий
  addEventListeners();

  // Обновляем цвета курсора
  updateCursorColors();
}

/**
 * Добавляет все необходимые обработчики событий
 */
function addEventListeners() {
  // Основное перемещение курсора
  document.body.addEventListener('mousemove', onMouseMove);

  // Обработчики для интерактивных элементов
  for (let i = 0; i < $hoverables.length; i++) {
    $hoverables[i].addEventListener('mouseenter', onMouseHover);
    $hoverables[i].addEventListener('mouseleave', onMouseHoverOut);
  }

  for (let i = 0; i < hoverablesArea.length; i++) {
    hoverablesArea[i].addEventListener('mouseenter', onMouseHoverArea);
    hoverablesArea[i].addEventListener('mouseleave', onMouseHoverAreaOut);
  }

  // Обработчик изменения темы
  document.addEventListener('themeChange', updateCursorColors);
}

/**
 * Обновляет цвета курсора в соответствии с текущей темой
 */
function updateCursorColors() {
  const rootStyles = getComputedStyle(document.documentElement);
  const cursorSmallFill = rootStyles
    .getPropertyValue('--cursor-small-fill')
    .trim();
  const cursorBigFill = rootStyles.getPropertyValue('--cursor-big-fill').trim();

  gsap.to('.cursor__circle--small', {
    fill: cursorSmallFill,
    duration: 0.3,
  });

  gsap.to($bigCircle, {
    fill: cursorBigFill,
    duration: 0.3,
  });
}

/**
 * Перемещает элементы курсора за указателем мыши
 */
function onMouseMove(e) {
  gsap.to($bigCircle, 0.4, {
    x: e.clientX,
    y: e.clientY,
  });
  gsap.to($smallCircle, 0.15, {
    x: e.clientX,
    y: e.clientY,
  });
  gsap.to($smallPlus, 0.1, {
    x: e.clientX,
    y: e.clientY,
  });
}

/**
 * Изменяет стиль курсора при наведении на элемент
 */
function onMouseHover() {
  gsap.to('#bigCircle', {
    attr: {
      r: 0,
    },
  });
  gsap.to('.cursor__circle--small', {
    scale: 7,
    fill: document.body.classList.contains('dark') ? '#333' : '#fff',
  });
}

/**
 * Возвращает стиль курсора после наведения на элемент
 */
function onMouseHoverOut() {
  gsap.to('#bigCircle', {
    attr: {
      r: 18,
    },
  });
  gsap.to('.cursor__circle--small', {
    scale: 1,
    fill: getComputedStyle(document.documentElement)
      .getPropertyValue('--cursor-small-fill')
      .trim(),
  });
}

/**
 * Изменяет стиль курсора при наведении на область с классом hoverable-area
 */
function onMouseHoverArea() {
  gsap.to($bigCircle, {
    fill: document.body.classList.contains('dark') ? '#f1f1f1' : '#212121',
    mixBlendMode: 'normal',
    duration: 0.3,
    scale: 1.5,
  });
  gsap.to($smallCircle, {
    fill: 'transparent',
    duration: 0.3,
  });
  gsap.to($smallPlusArea, {
    stroke: getComputedStyle(document.documentElement)
      .getPropertyValue('--cursor-small-fill')
      .trim(),
    duration: 0.3,
  });
}

/**
 * Возвращает стиль курсора после наведения на область с классом hoverable-area
 */
function onMouseHoverAreaOut() {
  gsap.to($bigCircle, {
    fill: 'transparent',
    mixBlendMode: 'difference',
    duration: 0.3,
    scale: 1,
  });
  gsap.to($smallCircle, {
    fill: getComputedStyle(document.documentElement)
      .getPropertyValue('--cursor-small-fill')
      .trim(),
    duration: 0.3,
  });
  gsap.to($smallPlusArea, {
    stroke: 'transparent',
    duration: 0.3,
  });
}

//=============== end ===============//
