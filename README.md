# 🚀 ViteVerst - ультимативная сборка для верстки на Vite

![Vite](https://img.shields.io/badge/Vite-6.3.4-purple?style=flat-square&logo=vite)
![SCSS](https://img.shields.io/badge/SCSS-Support-pink?style=flat-square&logo=sass)
![Optimization](https://img.shields.io/badge/Image_Optimization-Yes-green?style=flat-square)
![HTML Includes](https://img.shields.io/badge/HTML_Includes-Yes-blue?style=flat-square)
![Adaptive REM](https://img.shields.io/badge/Adaptive_REM-Yes-orange?style=flat-square)

Современная **сверхбыстрая** сборка для верстки сайтов на базе Vite с поддержкой директив включения файлов (@@include), как в Gulp, но в **10-100x раз быстрее**! Забудьте о длительной компиляции - получите мгновенный результат.

🌐 **[Демо-сайт сборки](https://web-2112.ru/vite/)**

## ✨ Ключевые особенности

- **Молниеносная скорость** разработки, моментальный Hot Reload
- **Поддержка @@include** - работайте с компонентами без фреймворков
- **Алиасы для путей** (@scss, @js, @img) - никакой путаницы с ../../../../
- **Автоматическая оптимизация** изображений, CSS и JS
- **Адаптивная система REM** - верстайте без медиа-запросов под любые разрешения
- **Многопоточная обработка** ресурсов - быстрая сборка даже для больших проектов
- **Никакого Webpack или Gulp** - только современный и быстрый Vite
- **Понятная структура** проекта для удобной верстки
- **Поддержка многостраничных** сайтов из коробки

## 💡 Для кого эта сборка?

- **Верстальщикам**, которые хотят ускорить свой рабочий процесс
- **Frontend-разработчикам**, которые работают с многостраничными сайтами
- **Web-студиям**, которым нужна надежная сборка для верстки
- **Всем, кто устал** от медленной работы Gulp и сложности Webpack

## 📁 Структура проекта

- `app/` - исходные файлы проекта
  - `html/` - HTML компоненты для включения
  - `scss/` - SCSS стили
  - `js/` - JavaScript файлы
  - `img/` - изображения
  - `fonts/` - шрифты
  - `vendor/` - сторонние библиотеки
  - `files/` - файлы для скачивания (документы, архивы и т.д.)
- `dist/` - собранный проект
- `public/` - статические файлы, которые копируются в сборку без изменений

## 🛠 Особенности сборки

В проекте реализованы следующие функции:
- ⚡ Обработка директив @@include в HTML файлах
- 🔄 Преобразование путей к ресурсам (@scss, @js, @img, @files и др.)
- 📦 Автоматическое копирование изображений, файлов и vendor-файлов в dist
- 🌐 Вендорные префиксы через Autoprefixer
- 📱 Сортировка и объединение медиа-запросов
- 🚄 Параллельная обработка ресурсов для оптимальной скорости сборки
- 🔥 Горячая перезагрузка при изменении HTML файлов
- 📂 В стандартной production-сборке (build):
  - Удаление атрибутов crossorigin и type="module"
  - Добавление атрибута defer для скриптов
  - Замена подключений scss на css/app.css
  - Фиксированные имена файлов (app.js и app.css) без хешей
- 🚀 В минифицированной production-сборке (build-min):
  - Все преимущества стандартной сборки
  - Минификация HTML, CSS и JavaScript
  - Автоматическая оптимизация растровых изображений:
    - JPEG/JPG: сжатие с сохранением 80% качества
    - PNG: оптимизация с настройками качества 60-80%
    - GIF: оптимизация с уровнем 7
    - SVG: не оптимизируются (для сохранения их структуры и функциональности)
    
## ⚙️ Установка

```bash
# Клонирование репозитория
git clone https://github.com/lexa-zxc/viteverst.git

# Установка зависимостей
npm install

# Запуск режима разработки
npm run dev
```

Для удобства в проекте предусмотрены BAT-файлы, которые позволяют запускать команды одним кликом:
- `dev.bat` - запуск режима разработки
- `build.bat` - сборка проекта без минификации
- `build-min.bat` - сборка проекта с минификацией
- `preview.bat` - предпросмотр собранного проекта
- `fonts.bat` - конвертация TTF шрифтов в WOFF2

Также можно использовать короткие команды в консоли:
```bash
dev       # эквивалентно npm run dev
build     # эквивалентно npm run build
build-min # эквивалентно npm run build-min
preview   # эквивалентно npm run preview
fonts     # эквивалентно npm run fonts
```

## 🔄 Адаптивная система REM

В сборке реализована уникальная система адаптивной верстки на основе REM единиц, которая:

- **Исключает необходимость** в медиа-запросах для большинства случаев
- **Автоматически масштабирует** интерфейс под разные размеры экранов
- **Точно настраивается** для конкретных диапазонов разрешений
- **Учитывает не только ширину**, но и высоту экрана для естественного масштабирования
- **Упрощает расчеты**: базовое значение настроено так, что 1rem = 10px для удобства верстки

### Как это работает

1. **Интеллектуальное масштабирование**: Скрипт `app/vendor/rem/rem.js` автоматически устанавливает размер шрифта для тега `<html>` в зависимости от разрешения экрана:
   ```javascript
   // Примеры коэффициентов масштабирования для разных устройств
   if (width > 2000) fontSize = 12 * koeff;  // 2K+ разрешения
   if (width <= 1600) fontSize = 10.8 * koeff;  // Большие ноутбуки
   if (width <= 1400) fontSize = 12.5 * koeff;  // Маленькие ноутбуки
   // ...и т.д. для других размеров экранов
   ```

2. **Удобный перевод из PX в REM**: Система настроена так, что на стандартных разрешениях **1rem ≈ 10px**, что делает расчеты предельно простыми:
   ```css
   /* Вместо этого */
   .button {
     padding: 15px 20px; /* px */
     font-size: 16px;
     margin-bottom: 20px;
   }
   
   /* Пишем так */
   .button {
     padding: 1.5rem 2rem; /* 15px 20px */
     font-size: 1.6rem; /* 16px */
     margin-bottom: 2rem; /* 20px */
   }
   ```

3. **Проверка адаптивности**: Просто растяните окно браузера или измените масштаб, чтобы увидеть, как все элементы интерфейса масштабируются пропорционально без единого медиа-запроса.

4. **Точная настройка**: Вы можете легко изменить коэффициенты масштабирования в файле `app/vendor/rem/rem.js` для разных диапазонов разрешений.

### Преимущества перед медиа-запросами

- **Меньше кода**: Нет необходимости писать десятки медиа-запросов для разных разрешений
- **Естественное масштабирование**: Все элементы масштабируются пропорционально и плавно
- **Легкость поддержки**: Изменения в одном файле влияют на всю адаптивность сайта
- **Отзывчивость**: Сайт выглядит хорошо даже на нестандартных разрешениях и при изменении масштаба

### Советы по тестированию

- **Растяните окно браузера** горизонтально и вертикально, чтобы увидеть, как все элементы масштабируются
- **Измените масштаб страницы** (Ctrl+/- или колесико мыши с Ctrl), чтобы проверить различные размеры экрана
- **Проверьте на 2K+ мониторах** или измените масштаб для симуляции таких разрешений
- **Используйте инструменты разработчика** для инспектирования стилей и проверки, что все элементы используют rem

> **Примечание**: Для очень специфичных элементов и мобильных устройств все еще рекомендуется использовать точечные медиа-запросы, но основная адаптивность достигается без них.

## Использование

### Запуск проекта
```bash
# Режим разработки (также можно использовать dev.bat или просто команду dev)
npm run dev

# Сборка проекта без минификации (также build.bat или команда build)
npm run build

# Сборка проекта с минификацией и оптимизацией изображений (build-min.bat или команда build-min)
npm run build-min

# Предпросмотр собранного проекта (preview.bat или команда preview)
npm run preview
```

### Директивы включения

В HTML файлах можно использовать следующие директивы:

#### Простое включение
```html
@@include('html/header.html')
```

#### Включение с параметрами
```html
@@include('html/header.html', {"title":"Главная страница"})
```

В файле `header.html` можно использовать параметры через синтаксис `@@имя_параметра`. Например:
```html
<title>@@title</title>
```

### Пути к ресурсам

Вы можете использовать специальные префиксы для указания путей к ресурсам:

```html
<link rel="stylesheet" href="@scss/main.scss">
<script src="@js/app.js"></script>
<img src="@img/logo.png">
<script src="@vendor/jquery/jquery.min.js"></script>
<script type="module" src="@utils/helper.js"></script>
<a href="@files/documents/sample.pdf">Скачать документ</a>
```

Эти префиксы будут автоматически преобразованы в соответствующие пути при сборке.

### SCSS алиасы

В SCSS файлах также доступны алиасы для импорта:

```scss
// Импорт с алиасами
@import "@scss/variables"; 
@import "@scss/mixins";

.element {
  background-image: url("@img/background.jpg");
}
```

## 🔡 Конвертация шрифтов

В проекте реализована удобная функция конвертации шрифтов из формата TTF в более оптимизированный WOFF2, который обеспечивает лучшую производительность и меньший размер файлов.

### Как использовать

Для конвертации шрифтов используйте одну из следующих команд:

```bash
# Через BAT-файл (Windows)
fonts.bat

# Или через npm скрипт
npm run fonts:convert
```

### Что делает конвертер шрифтов

1. Ищет TTF файлы в директории `app/fonts/`
2. Для каждого TTF файла создаёт соответствующий WOFF2 файл рядом с ним
3. Если WOFF2 файл уже существует, он не будет создан повторно (чтобы перезаписать существующие файлы, используйте опцию `--force`)

### Дополнительные опции

При использовании команды `npm run fonts:convert` можно указать дополнительные параметры:

```bash
# Указать другую директорию шрифтов
npm run fonts:convert -- --fonts-dir путь/к/шрифтам

# Принудительная конвертация (перезаписать существующие WOFF2 файлы)
npm run fonts:convert -- --force
```

## 🔥 Почему лучше чем Gulp?

- **В 10-100 раз быстрее** запуск сервера разработки
- **Мгновенное** применение изменений благодаря ESM
- **Нативная поддержка** SCSS, PostCSS из коробки
- **Никаких длинных цепочек** .pipe().pipe().pipe()...
- **Меньше зависимостей**, меньше проблем с устареванием плагинов
- **Простая конфигурация** и расширяемость

## 🎉 Приятного кодинга!

Надеемся, что эта сборка сделает вашу работу не только эффективнее, но и приятнее! Если у вас есть идеи по улучшению сборки или вы нашли ошибку - создайте issue или присылайте pull request.

## 📋 Требования

- Node.js >= 16
- npm или yarn

## 🏷️ Теги

`vite` `vite-config` `vite-for-html` `html-include` `file-include` `vite-file-include` `верстка` `сборка для верстки` `frontend` `html-components` `scss` `sass` `web-dev` `imagemin` `multi-page` `web-optimization` `adaptive-rem` `responsive` `no-media-queries` `fluid-layout` `rem-based` `auto-adaptive` `ttf-to-woff2` `font-converter`

---

# 🚀 ViteVerst - Ultimate Vite Setup for HTML/CSS Development

![Vite](https://img.shields.io/badge/Vite-6.3.4-purple?style=flat-square&logo=vite)
![SCSS](https://img.shields.io/badge/SCSS-Support-pink?style=flat-square&logo=sass)
![Optimization](https://img.shields.io/badge/Image_Optimization-Yes-green?style=flat-square)
![HTML Includes](https://img.shields.io/badge/HTML_Includes-Yes-blue?style=flat-square)
![Adaptive REM](https://img.shields.io/badge/Adaptive_REM-Yes-orange?style=flat-square)

A modern **ultra-fast** setup for website development based on Vite with support for file inclusion directives (@@include), like in Gulp, but **10-100x times faster**! Forget about long compilation times - get instant results.

🌐 **[Demo Site](https://web-2112.ru/vite/)**

## ✨ Key Features

- **Lightning-fast** development, instant Hot Reload
- **@@include support** - work with components without frameworks
- **Path aliases** (@scss, @js, @img) - no more confusion with ../../../../
- **Automatic optimization** of images, CSS, and JS
- **Adaptive REM system** - build responsive websites without media queries for any resolution
- **Multi-threaded processing** of resources - fast builds even for large projects
- **No Webpack or Gulp** - only modern and fast Vite
- **Clear structure** of the project for convenient development
- **Support for multi-page** sites out of the box

## 💡 Who Is This Setup For?

- **HTML/CSS developers** who want to speed up their workflow
- **Frontend developers** who work with multi-page sites
- **Web studios** that need a reliable setup for HTML/CSS development
- **Anyone tired** of Gulp's slow performance and Webpack's complexity

## 📁 Project Structure

- `app/` - source files
  - `html/` - HTML components for inclusion
  - `scss/` - SCSS styles
  - `js/` - JavaScript files
  - `img/` - images
  - `fonts/` - fonts
  - `vendor/` - third-party libraries
  - `files/` - downloadable files (documents, archives, etc.)
- `dist/` - compiled project
- `public/` - static files that are copied to the build without changes

## 🛠 Build Features

The project implements the following features:
- ⚡ Processing @@include directives in HTML files
- 🔄 Resource path transformation (@scss, @js, @img, @files, etc.)
- 📦 Automatic copying of images, files, and vendor files to dist
- 🌐 Vendor prefixes via Autoprefixer
- 📱 Sorting and combining media queries
- 🚄 Parallel resource processing for optimal build speed
- 🔥 Hot reload when HTML files change
- 📂 In standard production build (build):
  - Removal of crossorigin and type="module" attributes
  - Adding defer attribute to scripts
  - Replacing scss connections with css/app.css
  - Fixed file names (app.js and app.css) without hashes
- 🚀 In minified production build (build-min):
  - All the benefits of the standard build
  - HTML, CSS, and JavaScript minification
  - Automatic optimization of raster images:
    - JPEG/JPG: compression with 80% quality preservation
    - PNG: optimization with 60-80% quality settings
    - GIF: optimization with level 7
    - SVG: not optimized (to preserve their structure and functionality)
    
## ⚙️ Installation

```bash
# Clone repository
git clone https://github.com/lexa-zxc/viteverst.git

# Install dependencies
npm install

# Start development mode
npm run dev
```

For convenience, the project includes BAT files that allow you to run commands with a single click:
- `dev.bat` - start development mode
- `build.bat` - build project without minification
- `build-min.bat` - build project with minification
- `preview.bat` - preview the built project
- `fonts.bat` - convert TTF fonts to WOFF2

You can also use short commands in the console:
```bash
dev       # equivalent to npm run dev
build     # equivalent to npm run build
build-min # equivalent to npm run build-min
preview   # equivalent to npm run preview
fonts     # equivalent to npm run fonts
```

## 🔄 Adaptive REM System

The build implements a unique adaptive layout system based on REM units, which:

- **Eliminates the need** for media queries in most cases
- **Automatically scales** the interface for different screen sizes
- **Can be precisely configured** for specific resolution ranges
- **Takes into account not only width** but also screen height for natural scaling
- **Simplifies calculations**: base value is set so that 1rem = 10px for easy development

### How It Works

1. **Intelligent scaling**: The `app/vendor/rem/rem.js` script automatically sets the font size for the `<html>` tag based on screen resolution:
   ```javascript
   // Examples of scaling coefficients for different devices
   if (width > 2000) fontSize = 12 * koeff;  // 2K+ resolutions
   if (width <= 1600) fontSize = 10.8 * koeff;  // Large laptops
   if (width <= 1400) fontSize = 12.5 * koeff;  // Small laptops
   // ...and so on for other screen sizes
   ```

2. **Easy conversion from PX to REM**: The system is configured so that on standard resolutions **1rem ≈ 10px**, which makes calculations extremely simple:
   ```css
   /* Instead of this */
   .button {
     padding: 15px 20px; /* px */
     font-size: 16px;
     margin-bottom: 20px;
   }
   
   /* Write like this */
   .button {
     padding: 1.5rem 2rem; /* 15px 20px */
     font-size: 1.6rem; /* 16px */
     margin-bottom: 2rem; /* 20px */
   }
   ```

3. **Testing adaptivity**: Just stretch the browser window or change the zoom level to see how all interface elements scale proportionally without a single media query.

4. **Fine-tuning**: You can easily change the scaling coefficients in `app/vendor/rem/rem.js` for different resolution ranges.

### Advantages Over Media Queries

- **Less code**: No need to write dozens of media queries for different resolutions
- **Natural scaling**: All elements scale proportionally and smoothly
- **Easy maintenance**: Changes in one file affect the entire site adaptivity
- **Responsiveness**: The site looks good even on non-standard resolutions and when zooming

### Testing Tips

- **Stretch the browser window** horizontally and vertically to see how all elements scale
- **Change the page zoom** (Ctrl+/- or mouse wheel with Ctrl) to test different screen sizes
- **Check on 2K+ monitors** or change zoom to simulate such resolutions
- **Use developer tools** to inspect styles and verify that all elements use rem

> **Note**: For very specific elements and mobile devices, it's still recommended to use targeted media queries, but the main adaptivity is achieved without them.

## Usage

### Running the Project
```bash
# Development mode (also can use dev.bat or simply dev command)
npm run dev

# Build project without minification (also build.bat or build command)
npm run build

# Build project with minification and image optimization (build-min.bat or build-min command)
npm run build-min

# Preview the built project (preview.bat or preview command)
npm run preview
```

### Include Directives

You can use the following directives in HTML files:

#### Simple Include
```html
@@include('html/header.html')
```

#### Include with Parameters
```html
@@include('html/header.html', {"title":"Home Page"})
```

In the `header.html` file, you can use parameters with the `@@parameter_name` syntax. For example:
```html
<title>@@title</title>
```

### Resource Paths

You can use special prefixes to specify paths to resources:

```html
<link rel="stylesheet" href="@scss/main.scss">
<script src="@js/app.js"></script>
<img src="@img/logo.png">
<script src="@vendor/jquery/jquery.min.js"></script>
<script type="module" src="@utils/helper.js"></script>
<a href="@files/documents/sample.pdf">Download document</a>
```

These prefixes will be automatically converted to appropriate paths during the build.

### SCSS Aliases

Aliases are also available in SCSS files for imports:

```scss
// Imports with aliases
@import "@scss/variables"; 
@import "@scss/mixins";

.element {
  background-image: url("@img/background.jpg");
}
```

## 🔡 Font Conversion

The project implements a convenient function for converting fonts from the TTF format to a more optimized WOFF2 format, which provides better performance and smaller file size.

### How to use

To convert fonts, use one of the following commands:

```bash
# Through BAT file (Windows)
fonts.bat

# Or through npm script
npm run fonts:convert
```

### What the font converter does

1. Searches for TTF files in the `app/fonts/` directory
2. For each TTF file, creates a corresponding WOFF2 file next to it
3. If a WOFF2 file already exists, it will not be created again (to overwrite existing files, use the `--force` option)

### Additional options

When using the `npm run fonts:convert` command, you can specify additional parameters:

```bash
# Specify a different fonts directory
npm run fonts:convert -- --fonts-dir path/to/fonts

# Force conversion (overwrite existing WOFF2 files)
npm run fonts:convert -- --force
```

## 🔥 Why Better Than Gulp?

- **10-100x faster** development server startup
- **Instant** application of changes thanks to ESM
- **Native support** for SCSS, PostCSS out of the box
- **No long chains** of .pipe().pipe().pipe()...
- **Fewer dependencies**, fewer problems with outdated plugins
- **Simple configuration** and extensibility

## 🎉 Happy Coding!

We hope this setup will make your work not only more efficient but also more enjoyable! If you have ideas for improving the setup or you find a bug - create an issue or send a pull request.

## 📋 Requirements

- Node.js >= 16
- npm or yarn

## 🏷️ Tags

`vite` `vite-config` `vite-for-html` `html-include` `file-include` `vite-file-include` `html-css` `frontend-build` `frontend` `html-components` `scss` `sass` `web-dev` `imagemin` `multi-page` `web-optimization` `adaptive-rem` `responsive` `no-media-queries` `fluid-layout` `rem-based` `auto-adaptive` `ttf-to-woff2` `font-converter`