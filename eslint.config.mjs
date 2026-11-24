// Configuration ESLint 9 (format « flat »). Mêmes règles qu'auparavant
// (.eslintrc.json : next/core-web-vitals + next/typescript), chargées via FlatCompat.
// `next lint` (Next 14) n'est pas compatible avec ESLint 9 : `npm run lint` appelle eslint.
import { FlatCompat } from '@eslint/eslintrc';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const config = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'public/**',
      'recovery/**',
      'src/generated/**',
      'next-env.d.ts',
    ],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  // Scripts Node en CommonJS : `require` est leur syntaxe d'import normale
  {
    files: ['**/*.cjs'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
];

export default config;
