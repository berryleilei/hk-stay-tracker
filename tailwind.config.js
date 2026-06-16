/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // editorial:system sans,不用 serif(中文 serif 笔画不均)
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"PingFang HK"',
          '"Noto Sans TC"',
          '"Microsoft JhengHei"',
          'sans-serif',
        ],
        mono: ['"SF Mono"', 'ui-monospace', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
