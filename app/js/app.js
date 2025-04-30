// Импортируем анимацию wrapper
import '@utils/wrapperFade.js';

// Импортируем функцию анимации текста
import { animateText } from '@utils/splitAnimationText.js';

document.addEventListener('DOMContentLoaded', () => {
  // Анимируем заголовок
  animateText('.home__name');

  // Анимируем дату с задержкой
  setTimeout(() => {
    animateText('.home__2112');
  }, 200);
});
