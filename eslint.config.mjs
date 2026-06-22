import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // 運用用のNode(CommonJS)スクリプト。アプリのビルド対象外なのでLint対象から除外
    "deploy_clean.js",
    "deploy_direct.js",
  ]),
]);

export default eslintConfig;
