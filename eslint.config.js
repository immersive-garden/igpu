import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default [
    {
        ignores: ['dist/**', 'node_modules/**', 'public/**', '.claude/**'],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['src/**/*.{js,ts}', 'examples/**/*.{js,ts}'],
        languageOptions: {
            ecmaVersion: 2023,
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.worker,
                // WebGPU + project-specific globals not in `globals.browser` yet
                GPUBufferUsage: 'readonly',
                GPUTextureUsage: 'readonly',
                GPUShaderStage: 'readonly',
                GPUMapMode: 'readonly',
                GPUColorWrite: 'readonly',
                GPUAdapter: 'readonly',
                GPUDevice: 'readonly',
                GPUBuffer: 'readonly',
                GPUTexture: 'readonly',
                GPUCanvasContext: 'readonly',
            },
        },
        rules: {
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': ['warn', { args: 'none', ignoreRestSiblings: true }],
            // webgpu-utils / wgpu-matrix surface untyped values; `any` at those
            // boundaries is deliberate, not a smell.
            '@typescript-eslint/no-explicit-any': 'off',
            // TS's own checker resolves identifiers; ESLint's no-undef yields
            // false positives on erased type names (GPUTextureFormat, etc.) and
            // is disabled for TS per typescript-eslint guidance.
            'no-undef': 'off',
            // `cond && fn()` / `cond ? a() : b()` are established idioms in this
            // codebase — allow them rather than rewrite to `if`.
            '@typescript-eslint/no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true }],
            'no-constant-condition': ['error', { checkLoops: false }],
            'no-empty': ['warn', { allowEmptyCatch: true }],
        },
    },
    {
        // Node-run tooling: build/lint scripts, asset tools, and config files.
        files: ['scripts/**/*.{js,mjs}', 'tools/**/*.{js,mjs}', '*.{js,mjs}'],
        languageOptions: {
            ecmaVersion: 2023,
            sourceType: 'module',
            globals: {
                ...globals.node,
            },
        },
        rules: {
            'no-unused-vars': ['warn', { args: 'none', ignoreRestSiblings: true }],
        },
    },
    // Disable ESLint stylistic rules that conflict with Prettier — keep last.
    prettier,
];
