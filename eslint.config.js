export default [
  {
    files: ["src/**/*.{js,jsx}", "server/**/*.mjs", "tests/**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      "no-debugger": "error",
      "no-dupe-keys": "error",
      "no-unreachable": "error",
      "no-unsafe-finally": "error",
      "no-constant-binary-expression": "error",
      "valid-typeof": "error",
    },
  },
];
