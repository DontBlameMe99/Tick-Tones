import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["*.js", "*.mjs"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      quotes: ["error", "double", { avoidEscape: true }],
      "jsx-quotes": ["error", "prefer-double"],
      indent: [
        "error",
        2,
        {
          SwitchCase: 1,
          offsetTernaryExpressions: true,
        },
      ],
      "object-curly-spacing": ["error", "always"],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  // Ignore any for mocks/tests
  {
    files: ["test/**/*.ts", "__mocks__/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    files: ["postcss.config.js"],
    rules: {
      "no-undef": "off",
    },
  },
);
