import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  { ignores: ["dist", "build", "node_modules"] },
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      // Los componentes (identificadores en mayúscula) se usan desde JSX,
      // que el no-unused-vars de ESLint core no contabiliza.
      "no-unused-vars": [
        "error",
        {
          varsIgnorePattern: "^[A-Z_]",
          argsIgnorePattern: "^[A-Z_]",
          destructuredArrayIgnorePattern: "^[A-Z_]",
          ignoreRestSiblings: true,
        },
      ],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },
  {
    files: ["**/*.test.{js,jsx}", "src/setupTests.js"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.vitest },
    },
  },
];
