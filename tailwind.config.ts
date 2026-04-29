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
        field: {
          green: '#2d8a2d',
          stripe: '#267a26',
          line: '#ffffff',
        },
      },
    },
  },
  plugins: [],
}

export default config
