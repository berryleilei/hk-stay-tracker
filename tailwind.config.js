/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // iOS 系统字体
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"PingFang HK"',
          '"Noto Sans TC"',
          'sans-serif',
        ],
        // 数字用圆体,更像 DreamDays 倒数
        rounded: ['-apple-system', '"SF Pro Rounded"', '"PingFang HK"', 'sans-serif'],
        mono: ['"SF Mono"', 'ui-monospace', 'Menlo', 'monospace'],
      },
      colors: {
        // iOS 系统色
        ios: {
          bg: '#F2F2F7',
          blue: '#007AFF',
          green: '#34C759',
          'green-text': '#1a8c3a',
          orange: '#FF9500',
          'orange-text': '#c2700a',
          red: '#FF3B30',
          'red-text': '#d12b21',
        },
      },
    },
  },
  plugins: [],
};
