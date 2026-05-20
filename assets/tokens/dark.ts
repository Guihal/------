// Dark baseline design tokens — refined, desaturated dark theme
// No light mode, no theme switching. MVP-2 territory.

export const DARK_TOKENS = {
	color: {
		// Base surfaces — deep, layered elevation
		bgBase: "#0a0a0f",
		bgElevated: "#13131a",
		bgCard: "#1a1a24",
		bgOverlay: "#111118",

		// Borders
		borderSubtle: "#2a2a35",
		borderDashed: "#2a2a35",

		// Text — off-white hierarchy
		textPrimary: "#e8e8ec",
		textSecondary: "#8b8b96",
		textMuted: "#5a5a66",
		textInverse: "#0a0a0f",

		// Accents — desaturated for dark mode comfort
		accentGreen: "#7eb89a",
		accentBlue: "#7a9cc6",
		accentYellow: "#d4b87a",
		accentRed: "#c47a7a",
		accentOrange: "#c49a7a",

		// Priority backgrounds — subtle, readable
		priorityLowBg: "#1e2e28",
		priorityLowText: "#7eb89a",
		priorityNormalBg: "#1e2230",
		priorityNormalText: "#7a9cc6",
		priorityHighBg: "#2e2020",
		priorityHighText: "#c49a7a",

		// Status
		statusSuccess: "#7eb89a",
		statusWarning: "#d4b87a",
		statusError: "#c47a7a",
		statusInfo: "#7a9cc6",
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
} as const;

export type DarkTokens = typeof DARK_TOKENS;
