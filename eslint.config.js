import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Baseline: aturan React Compiler/Fast Refresh ini melanggar pola lama (fetch saat mount di hook data,
      // konteks + hook dalam satu file). Diturunkan ke warn agar `npm run lint` bisa jadi gerbang CI;
      // kurangi jumlah peringatan bertahap, jangan menambah.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': 'warn',
      'no-useless-assignment': 'warn',
    },
  },
  {
    // Berkas tes tidak ikut aturan React.
    files: ['**/*.test.{ts,tsx}'],
    rules: { 'react-hooks/rules-of-hooks': 'off' },
  },
])
