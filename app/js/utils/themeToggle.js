// Функция для переключения темы в зависимости от времени суток
function toggleThemeByTime() {
  const currentHour = new Date().getHours();
  const isDarkThemeTime = currentHour >= 21 || currentHour < 9; // Темная тема с 21:00 до 9:00

  // Добавляем или удаляем класс dark
  if (isDarkThemeTime) {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }

  // Генерируем событие об изменении темы для обновления курсора
  const themeChangeEvent = new Event('themeChange');
  document.dispatchEvent(themeChangeEvent);
}

// Функция для переключения темы вручную
function toggleTheme() {
  // Добавляем класс для анимации переходов
  document.body.classList.add('theme-transition');

  // Переключаем тему
  document.body.classList.toggle('dark');

  // Генерируем событие об изменении темы для обновления курсора
  const themeChangeEvent = new Event('themeChange');
  document.dispatchEvent(themeChangeEvent);

  // Убираем класс анимации через некоторое время
  setTimeout(() => {
    document.body.classList.remove('theme-transition');
  }, 1000);
}

// Инициализация проверки времени с интервалом
function initThemeInterval() {
  // Проверяем время каждую минуту для автоматического переключения темы
  setInterval(toggleThemeByTime, 60000);
}

// Инициализация кнопки переключения темы
function initThemeToggleButton() {
  // Добавляем обработчик клика для кнопки переключения темы
  const themeToggleBtn = document.getElementById('themeToggle');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
  }
}

export { toggleTheme, toggleThemeByTime, initThemeInterval, initThemeToggleButton };
