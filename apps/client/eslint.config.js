import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default tseslint.config(
  { ignores: ["dist/**", "src/routes/routeTree.gen.ts"] },
  eslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      "no-undef": "warn",
      "no-unused-expressions": "warn",
      "@typescript-eslint/no-require-imports": "warn",
    },
  },
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "@typescript-eslint/no-unsafe-function-type": "warn",
      "no-constant-condition": "warn",
      "no-constant-binary-expression": "warn",
      "no-undef": "warn",
      "no-empty": "warn",
      "no-useless-escape": "warn",
      "prefer-const": "warn",
      "react-hooks/rules-of-hooks": "warn",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-expressions": "warn",
    },
  },
);
