/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Новая палитра цветов
        primary: "#58381f",          // Основной цвет (88,56,31)
        background: "#ecd3b2",       // Фоновый цвет (236,211,178)
        echo: "#efb56b",             // Акцент "эхо" (239,181,107)
        textDark: "#58381f",         // Основной цвет текста (88,56,31)
        accentSecondary: "#b58756",  // Вторичный акцент (181,135,86)
        darkModeBg: "#58381f",       // Тёмный фон (88,56,31)
        sepiaGold: "#d16014",        // Золото сепии (209,96,20)
        
        // Дополнительные оттенки для градиентов и состояний
        primaryLight: "#b58756",
        primaryDark: "#58381f",
        echoLight: "#efb56b",
        echoDark: "#d16014",
        accentSecondaryLight: "#efb56b",
        accentSecondaryDark: "#b58756",
        
        // Замена белого цвета на более нежный оттенок
        white: "#f8f4f0", // Чуть светлее фонового цвета
        card: "#fff5ee", // Цвет для карточек (замена белого)
        header: "#f0e6d8", // Цвет для хедеров (немного темнее карточек)
      },
      fontFamily: {
        // Playfair Display для заголовков
        'playfair': ['PlayfairDisplay-Regular', 'serif'],
        'playfair-bold': ['PlayfairDisplay-Bold', 'serif'],
        
        // Nunito для основного текста
        'inter': ['Nunito-Regular', 'sans-serif'],
        'inter-medium': ['Nunito-Medium', 'sans-serif'],
        'inter-semibold': ['Nunito-SemiBold', 'sans-serif'],
        'inter-bold': ['Nunito-Bold', 'sans-serif'],
      },
      fontWeight: {
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
      },
    },
  },
  plugins: [],
}; 