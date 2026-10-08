import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "no-console": "error",
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name='className'] > Literal[value=/(\\b(ml|mr|pl|pr|left|right)-|\\b(text-left|text-right)\\b)/]",
          message: "Use logical properties only (e.g. ms-*, me-*, ps-*, pe-*, text-start, text-end) instead of physical directional classes.",
        },
        {
          selector: "JSXAttribute[name.name='className'] > JSXExpressionContainer Literal[value=/(\\b(ml|mr|pl|pr|left|right)-|\\b(text-left|text-right)\\b)/]",
          message: "Use logical properties only (e.g. ms-*, me-*, ps-*, pe-*, text-start, text-end) instead of physical directional classes.",
        },
        {
          selector: "JSXAttribute[name.name='className'] > JSXExpressionContainer TemplateLiteral > TemplateElement[value.raw=/(\\b(ml|mr|pl|pr|left|right)-|\\b(text-left|text-right)\\b)/]",
          message: "Use logical properties only (e.g. ms-*, me-*, ps-*, pe-*, text-start, text-end) instead of physical directional classes.",
        },
        {
          selector: "CallExpression[callee.name=/^(cn|clsx|cva)$/] Literal[value=/(\\b(ml|mr|pl|pr|left|right)-|\\b(text-left|text-right)\\b)/]",
          message: "Use logical properties only (e.g. ms-*, me-*, ps-*, pe-*, text-start, text-end) instead of physical directional classes.",
        },
        {
          selector: "CallExpression[callee.name=/^(cn|clsx|cva)$/] TemplateLiteral > TemplateElement[value.raw=/(\\b(ml|mr|pl|pr|left|right)-|\\b(text-left|text-right)\\b)/]",
          message: "Use logical properties only (e.g. ms-*, me-*, ps-*, pe-*, text-start, text-end) instead of physical directional classes.",
        },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".tmp/**",
    "supabase/.temp/**",
  ]),
]);

export default eslintConfig;
