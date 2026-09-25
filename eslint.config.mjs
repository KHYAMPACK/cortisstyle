import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import importPlugin from "eslint-plugin-import";

// Generic core that must never depend on the fashion vertical module — see
// docs/agent-handoffs/17-generic-foundation-fashion-module.md. Deliberately
// scoped to areas already confirmed 100% free of fashion coupling (money,
// orders, tenant/auth, checkout UI) rather than the whole src/ tree: the
// owner product-management panel and the storefront category/browsing shell
// still import the fashion module for real (undecided panel-component splits,
// and there's no generic category-tree abstraction yet — see phase 4/6 notes
// in the doc above), so banning fashion imports there today would mean a
// large exceptions list instead of a real boundary. Grow this list as more
// of the codebase gets cleanly separated.
const FASHION_FREE_CORE_TARGETS = [
  "src/lib/tr/payments/**",
  "src/lib/tr/shipping/**",
  "src/lib/tr/catalogProfiles/**",
  "src/lib/tr/customArt/**",
  "src/lib/tr/storefront/**",
  "src/lib/tr/authMail/**",
  "src/components/tr/commerce/**",
  "src/app/api/tr/checkout/**",
  "src/app/api/tr/owner/orders/**",
  "src/app/api/tr/owner/boutiques/**",
  "src/app/api/tr/owner/summary/**",
  "src/app/api/tr/owner/dashboard/**",
  "src/app/api/tr/owner/customers/**",
  "src/lib/tr/customers/**",
  "src/lib/tr/commerce/customers.ts",
  "src/lib/tr/panel/customerList.ts",
  "src/lib/tr/panel/dashboard*.ts",
  "src/lib/tr/panel/orderRevenue.ts",
  "src/lib/tr/panel/ownerDashboard.ts",
  "src/app/api/tr/admin/**",
  "src/lib/tr/checkoutMode.ts",
  "src/lib/tr/adminAuth.ts",
  "src/lib/tr/customerAuth.ts",
  "src/lib/tr/ownerAuth.ts",
  "src/lib/tr/catalog/boutiques.ts",
  "src/lib/tr/catalog/publicData.ts",
  "src/lib/tr/catalog/products.ts",
  "src/lib/tr/catalog/productOptions.ts",
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { import: importPlugin },
    rules: {
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: FASHION_FREE_CORE_TARGETS,
              from: ["src/lib/tr/fashion/**", "src/components/tr/fashion/**"],
              message:
                "Generic core code must not import fashion-module internals. Fashion-specific data must reach core through a generic interface (a capability flag, a DB column, a registry), not a direct import — see docs/agent-handoffs/17-generic-foundation-fashion-module.md.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
