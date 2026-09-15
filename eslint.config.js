import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginUnusedImports from "eslint-plugin-unused-imports";

export default [
  {
    /* All of src, not three folders of it.
     *
     * This used to list components, pages and Layout.jsx — which left App.jsx
     * unlinted, and App.jsx is the routing table: the one file where a missing
     * import takes down every route at once rather than one page. A refactor
     * that added a route and forgot its import passed lint and passed
     * `vite build`, and the whole application rendered a blank page.
     *
     * src/components/ui stays out: it is generated shadcn code we do not edit. */
    files: ["src/**/*.{js,mjs,cjs,jsx}"],
    ignores: ["src/components/ui/**/*"],
    ...pluginJs.configs.recommended,
    ...pluginReact.configs.flat.recommended,
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      "unused-imports": pluginUnusedImports,
    },
    rules: {
      "no-unused-vars": "off",
      "react/jsx-uses-vars": "error",
      "react/jsx-uses-react": "error",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "react/no-unknown-property": [
        "error",
        { ignore: ["cmdk-input-wrapper", "toast-close"] },
      ],
      "react-hooks/rules-of-hooks": "error",
      /* Twice now a refactor has left a page referencing a component that no
         longer existed in the file, and both times lint and `vite build`
         passed — the failure only appeared as a blank screen in the browser.
         These two catch it at the point the mistake is made. */
      "no-undef": "error",
      "react/jsx-no-undef": "error",
    },
  },
];
