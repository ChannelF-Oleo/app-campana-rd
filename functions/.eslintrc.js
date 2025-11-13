module.exports = {
  env: {
    es6: true,
    node: true,
    // (Opcional) Si tu código de App principal usa funciones modernas de navegador
    browser: true,
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  extends: ["eslint:recommended", "google"],
  rules: {
    // Regla global (aplicada a todo el código EXCEPTO Service Worker)
    "no-restricted-globals": ["error", "name", "length"],

    "prefer-arrow-callback": "error",
    quotes: ["error", "double", { allowTemplateLiterals: true }],
  },
  // En tu .eslintrc.js:

  overrides: [
    {
      files: ["src/service-worker.js"], // Enfócate solo en el archivo que da error
      env: {
        serviceworker: true,
        node: false,
        browser: false,
      },
      rules: {
        // Usa "off" para desactivar completamente la regla.
        "no-restricted-globals": "off",
      },
    },
    // ... (otros overrides como el de **/*.spec.*)
  ],
  globals: {},
};
