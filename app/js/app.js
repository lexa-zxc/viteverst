// Импортируем константы
import { device_width, gsap_ease } from '@utils/constats.js';

// Импортируем анимацию wrapper
import '@utils/wrapperFade.js';

// Импортируем функцию анимации текста
import { animateText } from '@utils/splitAnimationText.js';

// Импортируем курсор
import '@utils/cursor.js';

// Импортируем модуль переключения тем
import { toggleThemeByTime } from '@utils/themeToggle.js';

document.addEventListener('DOMContentLoaded', () => {
  // Инициализируем переключение темы
  toggleThemeByTime();

  // Анимируем заголовок
  animateText('.home__name');

  // Анимируем дату с задержкой
  setTimeout(() => {
    animateText('.home__2112');
  }, 150);

  gsap.set('.home__link', {
    y: '1rem',
    opacity: 0,
  });

  gsap.to('.home__link', {
    y: '0',
    opacity: 1,
    duration: 0.2,
    ease: gsap_ease,
    delay: 0.4,
  });

  // Прогресс-бар скролла для страницы about
  const scrollProgress = document.getElementById('scrollProgress');
  if (scrollProgress) {
    // Функция для плавного обновления прогресс-бара
    function updateProgressBar() {
      // Рассчитываем процент прокрутки страницы
      const scrollTop =
        document.documentElement.scrollTop || document.body.scrollTop;
      const scrollHeight =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      const scrollPercentage = (scrollTop / scrollHeight) * 100;

      // Обновляем ширину прогресс-бара
      scrollProgress.style.width = scrollPercentage + '%';

      // Продолжаем анимацию
      requestAnimationFrame(updateProgressBar);
    }

    // Запускаем анимацию прогресс-бара
    requestAnimationFrame(updateProgressBar);
  }
});
