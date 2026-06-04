/**
 * Trajct design tokens.
 * Single source of truth for colors, spacing, typography scales.
 * These map to Tailwind config classes in tailwind.config.ts.
 */
export const tokens = {
  colors: {
    brand: {
      primary: "#2563EB",   // blue-600
      secondary: "#059669", // emerald-600
      accent: "#7C3AED",    // violet-600
    },
    neutral: {
      50: "#F9FAFB",
      900: "#111827",
    },
    danger: "#DC2626",
    warning: "#D97706",
    success: "#16A34A",
  },
  typography: {
    fontFamily: {
      sans: ["Inter", "system-ui", "sans-serif"],
      mono: ["JetBrains Mono", "Fira Code", "monospace"],
    },
  },
  radius: {
    sm: "0.25rem",
    md: "0.375rem",
    lg: "0.5rem",
    xl: "0.75rem",
  },
} as const;
