// Импортируем константы
import { device_width, gsap_ease } from '@utils/constats.js';

//==============================//
//======== КУРСОР =========//
//==============================//

if (device_width > 1100) {
  const $bigCircle = document.querySelector('.cursor__circle--big');
  const $smallCircle = document.querySelector('.cursor__circle--small');
  const $smallPlus = document.querySelector('.cursor__plus');
  const $smallPlusArea = document.querySelector('.cursor__plus--area');
  const $hoverables = document.querySelectorAll(
    'a:not([class*="gallery-item"]):not(.reviews-card__link):not(.hoverable-area), .btn, .nav-next, .nav-prev'
  );
  const hoverablesArea = document.querySelectorAll('.hoverable-area');

  // Listeners
  document.body.addEventListener('mousemove', onMouseMove);

  for (let i = 0; i < $hoverables.length; i++) {
    $hoverables[i].addEventListener('mouseenter', onMouseHover);
    $hoverables[i].addEventListener('mouseleave', onMouseHoverOut);
  }

  for (let i = 0; i < hoverablesArea.length; i++) {
    hoverablesArea[i].addEventListener('mouseenter', onMouseHoverArea);
    hoverablesArea[i].addEventListener('mouseleave', onMouseHoverAreaOut);
  }

  // Обновление цветов курсора при изменении темы
  function updateCursorColors() {
    const rootStyles = getComputedStyle(document.documentElement);
    const cursorSmallFill = rootStyles.getPropertyValue('--cursor-small-fill').trim();
    const cursorBigFill = rootStyles.getPropertyValue('--cursor-big-fill').trim();

    gsap.to('.cursor__circle--small', {
      fill: cursorSmallFill,
      duration: 0.3
    });

    gsap.to($bigCircle, {
      fill: cursorBigFill,
      duration: 0.3
    });
  }

  // Вызываем функцию при загрузке и при изменении темы
  document.addEventListener('DOMContentLoaded', updateCursorColors);
  document.addEventListener('themeChange', updateCursorColors);

  // Move the cursor
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

  // Hover an element
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
  function onMouseHoverOut() {
    gsap.to('#bigCircle', {
      attr: {
        r: 18,
      },
    });
    gsap.to('.cursor__circle--small', {
      scale: 1,
      fill: getComputedStyle(document.documentElement).getPropertyValue('--cursor-small-fill').trim(),
    });
  }

  // Hover img an element
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
      stroke: getComputedStyle(document.documentElement).getPropertyValue('--cursor-small-fill').trim(),
      duration: 0.3,
    });
  }

  function onMouseHoverAreaOut() {
    gsap.to($bigCircle, {
      fill: 'transparent',
      mixBlendMode: 'difference',
      duration: 0.3,
      scale: 1,
    });
    gsap.to($smallCircle, {
      fill: getComputedStyle(document.documentElement).getPropertyValue('--cursor-small-fill').trim(),
      duration: 0.3,
    });
    gsap.to($smallPlusArea, {
      stroke: 'transparent',
      duration: 0.3,
    });
  }
}

//=============== end ===============//
