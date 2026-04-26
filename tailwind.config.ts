import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 임원 보고용 금융 대시보드 색상
        navy: {
          50: '#f0f4ff',
          100: '#e0eaff',
          500: '#1e40af',
          600: '#1e3a8a',
          700: '#1e2f6b',
          800: '#172554',
          900: '#0f1b3d',
        },
        gold: {
          400: '#f59e0b',
          500: '#d97706',
        },
      },
      fontFamily: {
        sans: ['Pretendard', 'Noto Sans KR', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
