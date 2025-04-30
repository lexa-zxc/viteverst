// Включить/выключить FLS (Full Logging System) (в работе)
window['FLS'] = true;

// FLS (Full Logging System)
window.FLS = function (message) {
  setTimeout(() => {
    if (window.FLS) {
      // console.log(message);
    }
  }, 0);
};

// Подключение списка активных модулей
const flsModules = {};

/* Проверка поддержки webp, добавление класса webp или no-webp для HTML */
function isWebp() {
  // Проверка поддержки webp
  function testWebP(callback) {
    let webP = new Image();
    webP.onload = webP.onerror = function () {
      callback(webP.height == 2);
    };
    webP.src =
      'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  }
  // Добавление класса _webp или _no-webp для HTML
  testWebP(function (support) {
    let className = support === true ? 'webp' : 'no-webp';
    document.documentElement.classList.add(className);
  });
}
/* Проверка мобильного браузера */
let isMobile = {
  Android: function () {
    return navigator.userAgent.match(/Android/i);
  },
  BlackBerry: function () {
    return navigator.userAgent.match(/BlackBerry/i);
  },
  iOS: function () {
    return navigator.userAgent.match(/iPhone|iPad|iPod/i);
  },
  Opera: function () {
    return navigator.userAgent.match(/Opera Mini/i);
  },
  Windows: function () {
    return navigator.userAgent.match(/IEMobile/i);
  },
  any: function () {
    return (
      isMobile.Android() ||
      isMobile.BlackBerry() ||
      isMobile.iOS() ||
      isMobile.Opera() ||
      isMobile.Windows()
    );
  },
};
/* Добавление класса touch для HTML, если браузер мобильный */
function addTouchClass() {
  // Добавление класса _touch для HTML, если браузер мобильный
  if (isMobile.any()) document.documentElement.classList.add('touch');
}
// Добавление loaded для HTML после полной загрузки страницы
function addLoadedClass() {
  if (!document.documentElement.classList.contains('loading')) {
    window.addEventListener('load', function () {
      setTimeout(function () {
        document.documentElement.classList.add('loaded');
      }, 0);
    });
  }
}
// Получение хэша на адресе сайта
function getHash() {
  if (location.hash) {
    return location.hash.replace('#', '');
  }
}
// Установка хэша на адрес сайта
function setHash(hash) {
  hash = hash ? `#${hash}` : window.location.href.split('#')[0];
  history.pushState('', '', hash);
}
// Учет плавающей панели на мобильных устройствах при 100vh
function fullVHfix() {
  const fullScreens = document.querySelectorAll('[data-fullscreen]');
  if (fullScreens.length && isMobile.any()) {
    window.addEventListener('resize', fixHeight);
    function fixHeight() {
      let vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    fixHeight();
  }
}

// Другие полезные функции ================================================================================================================================================================================================================================================================================================================

// Получить цифры из строки
function getDigFromString(item) {
  return parseInt(item.replace(/[^\d]/g, ''));
}
// Форматирование цифр типа 100 000 000
function getDigFormat(item) {
  return item.toString().replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1 ');
}
// Убрать класс у всех элементов массива
function removeClasses(array, className) {
  for (var i = 0; i < array.length; i++) {
    array[i].classList.remove(className);
  }
}
// Уникализация массива
function uniqArray(array) {
  return array.filter(function (item, index, self) {
    return self.indexOf(item) === index;
  });
}
// Функция получения индекса внутри родительского элемента
function indexInParent(parent, element) {
  const array = Array.prototype.slice.call(parent.children);
  return Array.prototype.indexOf.call(array, element);
}
// Функция проверяет, видим ли объект
function isHidden(el) {
  return el.offsetParent === null;
}
// Обработка медиа запросов из атрибутов
function dataMediaQueries(array, dataSetValue) {
  // Получение объектов с медиа-запросами
  const media = Array.from(array).filter(function (item, index, self) {
    if (item.dataset[dataSetValue]) {
      return item.dataset[dataSetValue].split(',')[0];
    }
  });
  // Инициализация объектов с медиа-запросами
  if (media.length) {
    const breakpointsArray = [];
    media.forEach((item) => {
      const params = item.dataset[dataSetValue];
      const breakpoint = {};
      const paramsArray = params.split(',');
      breakpoint.value = paramsArray[0];
      breakpoint.type = paramsArray[1] ? paramsArray[1].trim() : 'max';
      breakpoint.item = item;
      breakpointsArray.push(breakpoint);
    });
    // Получаем уникальные брейкпоинты
    let mdQueries = breakpointsArray.map(function (item) {
      return (
        '(' +
        item.type +
        '-width: ' +
        item.value +
        'px),' +
        item.value +
        ',' +
        item.type
      );
    });
    mdQueries = uniqArray(mdQueries);
    const mdQueriesArray = [];

    if (mdQueries.length) {
      // Работаем с каждым брейкпоинтом
      mdQueries.forEach((breakpoint) => {
        const paramsArray = breakpoint.split(',');
        const mediaBreakpoint = paramsArray[1];
        const mediaType = paramsArray[2];
        const matchMedia = window.matchMedia(paramsArray[0]);
        // Объекты с нужными условиями
        const itemsArray = breakpointsArray.filter(function (item) {
          if (item.value === mediaBreakpoint && item.type === mediaType) {
            return true;
          }
        });
        mdQueriesArray.push({
          itemsArray,
          matchMedia,
        });
      });
      return mdQueriesArray;
    }
  }
}
//================================================================================================================================================================================================================================================================================================================

/* Проверка поддержки webp, добавление класса webp или no-webp для HTML */
/* (i) необходимо для корректного отображения webp из css */
isWebp();
/* Добавление класса touch для HTML если браузер мобильный */
addTouchClass();
/* Добавление loaded для HTML после полной загрузки страницы */
addLoadedClass();
/* Учет плавающей панели на мобильных устройствах при 100vh */
fullVHfix();

/*
Модуль параллакса мышью
Документация: https://template.fls.guru/template-docs/modul-animacii-parallaks-obektov-pri-dvizhenii-myshi.html
*/
// Модуль параллакса мышью
// (c) Фрилансер по жизни, "Хмурый Кот"
// Документация:

/*
Предмету, который будет двигаться за мышью, указать атрибут data-prlx-mouse.

// =========
Если нужны дополнительные настройки - указать

Атрибут											Значение по умолчанию
-------------------------------------------------------------------------------------------------------------------
data-prlx-cx="коэффициент_х"					100							значение больше - меньше процент смещения
data-prlx-cy="коэффициент_y"					100							значение больше - меньше процент смещения
data-prlx-dxr																		против оси X
data-prlx-dyr																		против оси Y
data-prlx-a="скорость_анимации"				50								большее значение – большая скорость

// =========
Если нужно считывать движение мыши в блоке-родителе - указать родителю атрибут data-prlx-mouse-wrapper

Если в параллаксе картинка - растянуть ее на >100%.
Например:
	width: 130%;
	height: 130%;
	top: -15%;
	left: -15%;
*/
class MousePRLX {
  constructor(props, data = null) {
    let defaultConfig = {
      init: true,
      logging: true,
    };
    this.config = Object.assign(defaultConfig, props);
    if (this.config.init) {
      const paralaxMouse = document.querySelectorAll('[data-prlx-mouse]');
      if (paralaxMouse.length) {
        this.paralaxMouseInit(paralaxMouse);
        this.setLogging(
          `Проснулся, слежу за объектами: (${paralaxMouse.length})`
        );
      } else {
        this.setLogging('Нет ни одного объекта. Сплю...');
      }
    }
  }
  paralaxMouseInit(paralaxMouse) {
    paralaxMouse.forEach((el) => {
      const paralaxMouseWrapper = el.closest('[data-prlx-mouse-wrapper]');

      // Коэф. X
      const paramСoefficientX = el.dataset.prlxCx ? +el.dataset.prlxCx : 100;
      // Коэф. У
      const paramСoefficientY = el.dataset.prlxCy ? +el.dataset.prlxCy : 100;
      // Напр. Х
      const directionX = el.hasAttribute('data-prlx-dxr') ? -1 : 1;
      // Напр. У
      const directionY = el.hasAttribute('data-prlx-dyr') ? -1 : 1;
      // Скорость анимации
      const paramAnimation = el.dataset.prlxA ? +el.dataset.prlxA : 50;

      // Объявление переменных
      let positionX = 0,
        positionY = 0;
      let coordXprocent = 0,
        coordYprocent = 0;

      setMouseParallaxStyle();

      // Проверяю наличие родителя, в котором будет считываться положение мыши
      if (paralaxMouseWrapper) {
        mouseMoveParalax(paralaxMouseWrapper);
      } else {
        mouseMoveParalax();
      }

      function setMouseParallaxStyle() {
        const distX = coordXprocent - positionX;
        const distY = coordYprocent - positionY;
        positionX = positionX + (distX * paramAnimation) / 1000;
        positionY = positionY + (distY * paramAnimation) / 1000;
        el.style.cssText = `transform: translate3D(${
          (directionX * positionX) / (paramСoefficientX / 10)
        }%,${
          (directionY * positionY) / (paramСoefficientY / 10)
        }%,0) rotate(0.02deg);`;
        requestAnimationFrame(setMouseParallaxStyle);
      }
      function mouseMoveParalax(wrapper = window) {
        wrapper.addEventListener('mousemove', function (e) {
          const offsetTop = el.getBoundingClientRect().top + window.scrollY;
          if (
            offsetTop >= window.scrollY ||
            offsetTop + el.offsetHeight >= window.scrollY
          ) {
            // Получение ширины и высоты блока
            const parallaxWidth = window.innerWidth;
            const parallaxHeight = window.innerHeight;
            // Ноль посередине
            const coordX = e.clientX - parallaxWidth / 2;
            const coordY = e.clientY - parallaxHeight / 2;
            // Получаем проценты
            coordXprocent = (coordX / parallaxWidth) * 100;
            coordYprocent = (coordY / parallaxHeight) * 100;
          }
        });
      }
    });
  }
  // Логирование в консоль
  setLogging(message) {
    this.config.logging ? FLS(`[PRLX Mouse]: ${message}`) : null;
  }
}
// Запускаем и добавляем в объект модулей
flsModules.mousePrlx = new MousePRLX({});

// // Наблюдатель за объектами с атрибутом data-watch
// // Документация: https://template.fls.guru/template-docs/modul-nabljudatel-za-poyavleniem-elementa-pri-skrolle.html
// // Сниппет(HTML):
// Подключение функционала "Чертоги Фрилансера"

// Наблюдатель объектов [всевидящее око]
// data-watch - можно писать значение для применения кастомного кода
// data-watch-root - родительский элемент, внутри которого наблюдать за объектом
// data-watch-margin - отступ
// data-watch-threshold - процент показа объекта для срабатывания
// data-watch-once - наблюдать только один раз
// _watcher-view - класс, который добавляется при появлении объекта

class ScrollWatcher {
  constructor(props) {
    let defaultConfig = {
      logging: true,
    };
    this.config = Object.assign(defaultConfig, props);
    this.observer;
    !document.documentElement.classList.contains('watcher')
      ? this.scrollWatcherRun()
      : null;
  }
  // Обновляем конструктор
  scrollWatcherUpdate() {
    this.scrollWatcherRun();
  }
  // Запускаем конструктор
  scrollWatcherRun() {
    document.documentElement.classList.add('watcher');
    this.scrollWatcherConstructor(document.querySelectorAll('[data-watch]'));
  }
  // Конструктор наблюдателей
  scrollWatcherConstructor(items) {
    if (items.length) {
      this.scrollWatcherLogging(
        `Проснулся и наблюдаю за объектами (${items.length})...`
      );
      // Унифицируем параметры
      let uniqParams = uniqArray(
        Array.from(items).map(function (item) {
          return `${item.dataset.watchRoot ? item.dataset.watchRoot : null}|${
            item.dataset.watchMargin ? item.dataset.watchMargin : '0px'
          }|${item.dataset.watchThreshold ? item.dataset.watchThreshold : 0}`;
        })
      );
      // Получаем группы объектов с одинаковыми параметрами,
      // создаем настройки, инициализируем наблюдатель
      uniqParams.forEach((uniqParam) => {
        let uniqParamArray = uniqParam.split('|');
        let paramsWatch = {
          root: uniqParamArray[0],
          margin: uniqParamArray[1],
          threshold: uniqParamArray[2],
        };
        let groupItems = Array.from(items).filter(function (item) {
          let watchRoot = item.dataset.watchRoot
            ? item.dataset.watchRoot
            : null;
          let watchMargin = item.dataset.watchMargin
            ? item.dataset.watchMargin
            : '0px';
          let watchThreshold = item.dataset.watchThreshold
            ? item.dataset.watchThreshold
            : 0;
          if (
            String(watchRoot) === paramsWatch.root &&
            String(watchMargin) === paramsWatch.margin &&
            String(watchThreshold) === paramsWatch.threshold
          ) {
            return item;
          }
        });

        let configWatcher = this.getScrollWatcherConfig(paramsWatch);

        // Инициализация наблюдателя со своими настройками
        this.scrollWatcherInit(groupItems, configWatcher);
      });
    } else {
      this.scrollWatcherLogging('Сплю, нет объектов для наблюдения. ZzzZZzz.');
    }
  }
  // Функция создания настроек
  getScrollWatcherConfig(paramsWatch) {
    // Создаем настройки
    let configWatcher = {};
    // Родитель, за которым ведется наблюдение
    if (document.querySelector(paramsWatch.root)) {
      configWatcher.root = document.querySelector(paramsWatch.root);
    } else if (paramsWatch.root !== 'null') {
      this.scrollWatcherLogging(
        `Эмм... родительского объекта ${paramsWatch.root} нет на странице`
      );
    }
    // Отступ срабатывания
    configWatcher.rootMargin = paramsWatch.margin;
    if (
      paramsWatch.margin.indexOf('px') < 0 &&
      paramsWatch.margin.indexOf('%') < 0
    ) {
      this.scrollWatcherLogging(
        `Ой, настройки data-watch-margin нужно задавать в PX или %`
      );
      return;
    }
    // Точки срабатывания
    if (paramsWatch.threshold === 'prx') {
      // Режим параллакса
      paramsWatch.threshold = [];
      for (let i = 0; i <= 1.0; i += 0.005) {
        paramsWatch.threshold.push(i);
      }
    } else {
      paramsWatch.threshold = paramsWatch.threshold.split(',');
    }
    configWatcher.threshold = paramsWatch.threshold;

    return configWatcher;
  }
  // Функция создания нового наблюдателя со своими настройками
  scrollWatcherCreate(configWatcher) {
    this.observer = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        this.scrollWatcherCallback(entry, observer);
      });
    }, configWatcher);
  }
  // Функция инициализации наблюдателя со своими настройками
  scrollWatcherInit(items, configWatcher) {
    // Создание нового наблюдателя со своими настройками
    this.scrollWatcherCreate(configWatcher);
    // Передача наблюдателю элементов
    items.forEach((item) => this.observer.observe(item));
  }
  // Функция обработки базовых действий точек срабатывания
  scrollWatcherIntersecting(entry, targetElement) {
    if (entry.isIntersecting) {
      // Видим объект
      // Добавляем класс
      !targetElement.classList.contains('_watcher-view')
        ? targetElement.classList.add('_watcher-view')
        : null;
      this.scrollWatcherLogging(
        `Я вижу ${targetElement.classList}, добавил класс _watcher-view`
      );
    } else {
      // Не видим объект
      // Удаляем класс
      targetElement.classList.contains('_watcher-view')
        ? targetElement.classList.remove('_watcher-view')
        : null;
      this.scrollWatcherLogging(
        `Я не вижу ${targetElement.classList}, удалил класс _watcher-view`
      );
    }
  }
  // Функция отключения наблюдения за объектом
  scrollWatcherOff(targetElement, observer) {
    observer.unobserve(targetElement);
    this.scrollWatcherLogging(
      `Я перестал наблюдать за ${targetElement.classList}`
    );
  }
  // Функция вывода в консоль
  scrollWatcherLogging(message) {
    this.config.logging ? FLS(`[Наблюдатель]: ${message}`) : null;
  }
  // Функция обработки наблюдения
  scrollWatcherCallback(entry, observer) {
    const targetElement = entry.target;
    // Обработка базовых действий точек срабатывания
    this.scrollWatcherIntersecting(entry, targetElement);
    // Если есть атрибут data-watch-once удаляем наблюдение
    targetElement.hasAttribute('data-watch-once') && entry.isIntersecting
      ? this.scrollWatcherOff(targetElement, observer)
      : null;
    // Создаем свое событие обратной связи
    document.dispatchEvent(
      new CustomEvent('watcherCallback', {
        detail: {
          entry: entry,
        },
      })
    );

    /*
		// Выбираем нужные объекты
		if (targetElement.dataset.watch === 'some value') {
			// пишем уникальную специфику
		}
		if (entry.isIntersecting) {
			// Видим объект
		} else {
			// Не видим объект
		}
		*/
  }
}
// Запускаем и добавляем в объект модулей
flsModules.watcher = new ScrollWatcher({});

// Dynamic Adapt v.1
// HTML data-da="where(uniq class name),when(breakpoint),position(digi)"
// e.x. data-da=".item,992,2"
// Andrikanych Yevhen 2020
// https://www.youtube.com/c/freelancerlifestyle

class DynamicAdapt {
  constructor(type) {
    this.type = type;
  }
  init() {
    // массив объектов
    this.оbjects = [];
    this.daClassname = '_dynamic_adapt_';
    // массив DOM-элементов
    this.nodes = [...document.querySelectorAll('[data-da]')];

    // заполнение objects объектами
    this.nodes.forEach((node) => {
      const data = node.dataset.da.trim();
      const dataArray = data.split(',');
      const оbject = {};
      оbject.element = node;
      оbject.parent = node.parentNode;
      оbject.destination = document.querySelector(`${dataArray[0].trim()}`);
      оbject.breakpoint = dataArray[1] ? dataArray[1].trim() : '767';
      оbject.place = dataArray[2] ? dataArray[2].trim() : 'last';
      оbject.index = this.indexInParent(оbject.parent, оbject.element);
      this.оbjects.push(оbject);
    });

    this.arraySort(this.оbjects);

    // массив уникальных медиа-запросов
    this.mediaQueries = this.оbjects
      .map(
        ({ breakpoint }) =>
          `(${this.type}-width: ${breakpoint}px),${breakpoint}`
      )
      .filter((item, index, self) => self.indexOf(item) === index);

    // навешивание слушателя на медиа-запрос
    // и вызов обработчика при первом запуске
    this.mediaQueries.forEach((media) => {
      const mediaSplit = media.split(',');
      const matchMedia = window.matchMedia(mediaSplit[0]);
      const mediaBreakpoint = mediaSplit[1];

      // массив объектов с соответствующим брейкпоинтом
      const оbjectsFilter = this.оbjects.filter(
        ({ breakpoint }) => breakpoint === mediaBreakpoint
      );
      matchMedia.addEventListener('change', () => {
        this.mediaHandler(matchMedia, оbjectsFilter);
      });
      this.mediaHandler(matchMedia, оbjectsFilter);
    });
  }
  // Основная функция
  mediaHandler(matchMedia, оbjects) {
    if (matchMedia.matches) {
      оbjects.forEach((оbject) => {
        // оbject.index = this.indexInParent(оbject.parent, оbject.element);
        this.moveTo(оbject.place, оbject.element, оbject.destination);
      });
    } else {
      оbjects.forEach(({ parent, element, index }) => {
        if (element.classList.contains(this.daClassname)) {
          this.moveBack(parent, element, index);
        }
      });
    }
  }
  // Функция перемещения
  moveTo(place, element, destination) {
    element.classList.add(this.daClassname);
    if (place === 'last' || place >= destination.children.length) {
      destination.append(element);
      return;
    }
    if (place === 'first') {
      destination.prepend(element);
      return;
    }
    destination.children[place].before(element);
  }
  // Функция возврата
  moveBack(parent, element, index) {
    element.classList.remove(this.daClassname);
    if (parent.children[index] !== undefined) {
      parent.children[index].before(element);
    } else {
      parent.append(element);
    }
  }
  // Функция получения индекса внутри родительского элемента
  indexInParent(parent, element) {
    return [...parent.children].indexOf(element);
  }
  // Функция сортировки массива по breakpoint и place
  // по возрастанию для this.type = min
  // по убыванию для this.type = max
  arraySort(arr) {
    if (this.type === 'min') {
      arr.sort((a, b) => {
        if (a.breakpoint === b.breakpoint) {
          if (a.place === b.place) {
            return 0;
          }
          if (a.place === 'first' || b.place === 'last') {
            return -1;
          }
          if (a.place === 'last' || b.place === 'first') {
            return 1;
          }
          return 0;
        }
        return a.breakpoint - b.breakpoint;
      });
    } else {
      arr.sort((a, b) => {
        if (a.breakpoint === b.breakpoint) {
          if (a.place === b.place) {
            return 0;
          }
          if (a.place === 'first' || b.place === 'last') {
            return 1;
          }
          if (a.place === 'last' || b.place === 'first') {
            return -1;
          }
          return 0;
        }
        return b.breakpoint - a.breakpoint;
      });
      return;
    }
  }
}
const da = new DynamicAdapt('max');
da.init();
