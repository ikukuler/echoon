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
        // Семантические токены. Legacy-имена ниже остаются на время миграции.
        primary: "#58381f",
        background: "#ecd3b2",
        surface: "#fff5ee",
        surfaceElevated: "#f8f4f0",
        content: "#58381f",
        contentMuted: "#765433",
        contentOnAccent: "#f8f4f0",
        accent: "#efb56b",
        accentPressed: "#d99a4e",
        border: "#c9a77e",
        danger: "#b42318",
        dangerPressed: "#8f1c13",
        dangerSurface: "#fee4e2",
        success: "#357a38",
        successSurface: "#e5f4e6",
        warning: "#9a5800",
        warningSurface: "#fff0d5",
        scrim: "rgba(0, 0, 0, 0.55)",

        // Legacy aliases used by screens that have not been migrated yet.
        echo: "#efb56b",
        textDark: "#58381f",
        accentSecondary: "#765433",
        darkModeBg: "#58381f",
        sepiaGold: "#d16014",
        
        // Дополнительные оттенки для градиентов и состояний
        primaryLight: "#b58756",
        primaryDark: "#58381f",
        echoLight: "#efb56b",
        echoDark: "#d16014",
        accentSecondaryLight: "#efb56b",
        accentSecondaryDark: "#b58756",
        
        // Замена белого цвета на более нежный оттенок
        white: "#f8f4f0", // Чуть светлее фонового цвета
        card: "#fff5ee", // Alias for surface.
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
