// Reglas de calidad del backend (Node, CommonJS). `npm run lint` las revisa.
const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  { ignores: ['node_modules/**', 'prisma/migrations/**'] },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: globals.node
    },
    rules: {
      // Express reconoce el manejador de errores por sus 4 parámetros: `_` marca los que no se usan.
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error'
    }
  }
];
