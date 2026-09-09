import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTypescript,
  {
    rules: {
      // The application intentionally starts API loads and browser-state
      // synchronization from effects. The compiler-oriented rule reports
      // these legitimate integration effects as synchronous state updates.
      "react-hooks/set-state-in-effect": "off",
      // Dates are display-only and necessarily depend on the current clock.
      "react-hooks/purity": "off",
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
