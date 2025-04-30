// Импортируем константы
import { device_width, gsap_ease } from '@utils/constats.js';

// Импортируем анимацию wrapper
import '@utils/wrapperFade.js';

// Импортируем функцию анимации текста
import { animateText } from '@utils/splitAnimationText.js';

// Импортируем функцию анимации текста
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
  
  // Добавляем кнопки копирования к блокам кода на странице about
  if (document.querySelector('.about')) {
    initCodeCopy();
  }
});

// Функция для добавления кнопок копирования к блокам кода
function initCodeCopy() {
  const codeBlocks = document.querySelectorAll('.about__code');
  
  codeBlocks.forEach(block => {
    // Создаем кнопку копирования
    const copyButton = document.createElement('button');
    copyButton.className = 'about__code-copy';
    copyButton.innerHTML = 'Копировать';
    
    // Добавляем кнопку в блок кода
    block.appendChild(copyButton);
    
    // Добавляем обработчик события для копирования
    copyButton.addEventListener('click', () => {
      const code = block.querySelector('code').innerText;
      
      // Копируем текст в буфер обмена
      navigator.clipboard.writeText(code).then(() => {
        copyButton.innerHTML = 'Скопировано!';
        
        // Возвращаем обратно текст кнопки через 2 секунды
        setTimeout(() => {
          copyButton.innerHTML = 'Копировать';
        }, 2000);
      }).catch(err => {
        console.error('Не удалось скопировать текст: ', err);
      });
    });
  });
}
