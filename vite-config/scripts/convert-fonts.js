#!/usr/bin/env node

/**
 * Скрипт для конвертации шрифтов TTF в WOFF2
 * Можно запускать напрямую: node vite-config/scripts/convert-fonts.js
 */

import { convertFonts } from '../plugins/font-conversion-plugin.js';

// Опции конвертации по умолчанию
const options = {
  fontsDir: 'app/fonts',
  force: false
};

// Обработка аргументов командной строки
for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i];
  if (arg === '--fonts-dir' && i + 1 < process.argv.length) {
    options.fontsDir = process.argv[++i];
  } else if (arg === '--force') {
    options.force = true;
  }
}

// Запуск конвертации
async function run() {
  console.log('🔍 Запуск конвертации шрифтов...');
  console.log(`📁 Директория шрифтов: ${options.fontsDir}`);
  console.log(`🔄 Принудительная конвертация: ${options.force ? 'Включена' : 'Отключена'}`);
  
  try {
    const result = await convertFonts(options);
    console.log(`\n${result.success ? '✅' : '❌'} ${result.message}`);
    
    if (result.success && result.convertedFonts && result.convertedFonts.length > 0) {
      console.log('\n📊 Статистика конвертации:');
      console.log(`📦 Всего сконвертировано: ${result.convertedFonts.length} шрифтов`);
      console.log(`🔤 Шрифты: ${result.convertedFonts.join(', ')}`);
    }
    
    if (result.success && result.skippedFonts && result.skippedFonts.length > 0) {
      console.log('\n📋 Пропущенные шрифты:');
      console.log(`📦 Всего пропущено: ${result.skippedFonts.length} шрифтов`);
      console.log(`🔤 Шрифты: ${result.skippedFonts.join(', ')}`);
    }
  } catch (error) {
    console.error('❌ Ошибка при конвертации шрифтов:', error);
    process.exit(1);
  }
}

run(); 