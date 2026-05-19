// Dark baseline design tokens — MVP-0 static only.
// No light mode, no theme switching, no visual random. MVP-2 territory.

export const DARK_TOKENS = {
  color: {
    // Base surfaces
    bgBase: "#0d0d12",
    bgElevated: "#181825",
    bgCard: "#1e1e2e",
    bgOverlay: "#11111b",

    // Borders
    borderSubtle: "#313244",
    borderDashed: "#313244",

    // Text
    textPrimary: "#cdd6f4",
    textSecondary: "#a6adc8",
    textMuted: "#6c7086",
    textInverse: "#1e1e2e",

    // Accents
    accentGreen: "#a6e3a1",
    accentBlue: "#89b4fa",
    accentYellow: "#f9e2af",
    accentRed: "#f38ba8",
    accentOrange: "#fab387",

    // Priority backgrounds
    priorityLowBg: "#45475a",
    priorityLowText: "#a6adc8",
    priorityNormalBg: "#313244",
    priorityNormalText: "#89b4fa",
    priorityHighBg: "#452434",
    priorityHighText: "#f38ba8",

    // Status
    statusSuccess: "#a6e3a1",
    statusWarning: "#f9e2af",
    statusError: "#f38ba8",
    statusInfo: "#89b4fa",
  },

  spacing: {
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "20px",
    xxl: "24px",
    xxxl: "32px",
  },

  typography: {
    size: {
      xs: "11px",
      sm: "12px",
      md: "14px",
      lg: "16px",
      xl: "20px",
      xxl: "24px",
    },
    weight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.4,
      relaxed: 1.6,
    },
  },

  radius: {
    sm: "6px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    full: "9999px",
  },
} as const

export type DarkTokens = typeof DARK_TOKENS
