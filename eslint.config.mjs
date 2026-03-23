import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
    // 1. Global Ignores
    {
        ignores: ['node_modules/**', 'dist/**', '**/*.config.ts'],
    },

    // 2. Base Configurations
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    eslintPluginPrettierRecommended,

    // 3. Custom Rules and Environment
    {
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
        plugins: {
            "simple-import-sort": simpleImportSort,
        },
        rules: {
            // Logic & Formatting
            // 'no-console': 'warn',
            'eqeqeq': ['error', 'always'],
            'curly': ['error', 'all'],
            'prefer-const': 'error',
            'prettier/prettier': ['error', { endOfLine: 'auto' }],

            // Import Sorting
            "simple-import-sort/imports": "error",
            "simple-import-sort/exports": "error",

            // TypeScript Rigor
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-shadow': 'error',
            '@typescript-eslint/explicit-function-return-type': 'off',
        },
    },
];