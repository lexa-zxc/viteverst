// Импортируем константы
import { device_width, gsap_ease } from '@utils/constants.js';

/**
 * Анимирует текст, разбивая его на символы
 * @param {string} selector - CSS селектор текстового элемента
 * @returns {void}
 */
export function animateText(selector) {
  const title = document.querySelector(selector);
  if (!title) return;

  // Разбиваем текст на символы
  const splitTitle = new SplitTextJS(title);

  // Настраиваем начальное положение
  gsap.set(splitTitle.chars, {
    opacity: 0,
    x: device_width < 767 ? '1rem' : '2rem',
  });

  // Анимируем появление символов
  gsap.to(splitTitle.chars, {
    opacity: 1,
    x: 0,
    stagger: 0.08,
    duration: 0.5,
    ease: gsap_ease,
  });
}
