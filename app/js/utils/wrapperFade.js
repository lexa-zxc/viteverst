// Импортируем константы
import { device_width } from '@utils/constats.js';

//======== Анимация wrapper при загрузке страницы =========//
gsap.to('.wrapper', {
  opacity: 1,
  duration: 1.2,
  ease: Power2.out,
  delay: 0,
});

//======== Убираем анимацию wrapper при ресайзе =========//
$(window).resize(function () {
  if (device_width > 1100) {
    $('.wrapper').css('opacity', '1');
  }
});
