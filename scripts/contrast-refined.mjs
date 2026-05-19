#!/usr/bin/env node
// Refined contrast audit — only realistic token combinations

const DARK_TOKENS = {
  color: {
    bgBase: "#0d0d12",
    bgElevated: "#181825",
    bgCard: "#1e1e2e",
    bgOverlay: "#11111b",
    textPrimary: "#cdd6f4",
    textSecondary: "#a6adc8",
    textMuted: "#6c7086",
    textInverse: "#1e1e2e",
    accentGreen: "#a6e3a1",
    accentBlue: "#89b4fa",
    accentYellow: "#f9e2af",
    accentRed: "#f38ba8",
    accentOrange: "#fab387",
    priorityLowBg: "#45475a",
    priorityLowText: "#a6adc8",
    priorityNormalBg: "#313244",
    priorityNormalText: "#89b4fa",
    priorityHighBg: "#452434",
    priorityHighText: "#f38ba8",
  }
};

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function relativeLuminance([r, g, b]) {
  const toLinear = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const R = toLinear(r);
  const G = toLinear(g);
  const B = toLinear(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hexToRgb(hex1)) + 0.05;
  const l2 = relativeLuminance(hexToRgb(hex2)) + 0.05;
  return l1 > l2 ? l1 / l2 : l2 / l1;
}

// Realistic combinations used in the app
const realisticPairs = [
  // Primary text on surfaces
  ["textPrimary", "bgBase"],
  ["textPrimary", "bgElevated"],
  ["textPrimary", "bgCard"],
  ["textPrimary", "bgOverlay"],
  ["textPrimary", "priorityLowBg"],
  ["textPrimary", "priorityNormalBg"],
  ["textPrimary", "priorityHighBg"],
  // Secondary text on surfaces
  ["textSecondary", "bgBase"],
  ["textSecondary", "bgElevated"],
  ["textSecondary", "bgCard"],
  ["textSecondary", "bgOverlay"],
  ["textSecondary", "priorityLowBg"],
  ["textSecondary", "priorityNormalBg"],
  ["textSecondary", "priorityHighBg"],
  // Muted text on surfaces
  ["textMuted", "bgBase"],
  ["textMuted", "bgElevated"],
  ["textMuted", "bgCard"],
  ["textMuted", "bgOverlay"],
  ["textMuted", "priorityLowBg"],
  ["textMuted", "priorityNormalBg"],
  ["textMuted", "priorityHighBg"],
  // Inverse text on accents
  ["textInverse", "accentGreen"],
  ["textInverse", "accentBlue"],
  ["textInverse", "accentYellow"],
  ["textInverse", "accentRed"],
  ["textInverse", "accentOrange"],
  // Priority chips (intended combos)
  ["priorityLowText", "priorityLowBg"],
  ["priorityNormalText", "priorityNormalBg"],
  ["priorityHighText", "priorityHighBg"],
  // Text on accents (buttons, badges)
  ["textInverse", "accentGreen"],
  ["textInverse", "accentBlue"],
  ["textInverse", "accentYellow"],
  ["textInverse", "accentRed"],
  ["textInverse", "accentOrange"],
];

const c = DARK_TOKENS.color;
const issues = [];
const aaPass = [];

for (const [tName, bName] of realisticPairs) {
  const tHex = c[tName];
  const bHex = c[bName];
  const ratio = contrastRatio(tHex, bHex);
  const entry = { pair: `${tName} on ${bName}`, ratio: +ratio.toFixed(2), hex: `${tHex} on ${bHex}` };
  if (ratio < 4.5) {
    issues.push(entry);
  } else if (ratio < 7) {
    aaPass.push(entry);
  }
}

console.log("=== REALISTIC CONTRAST PAIRS ===");
console.log("\nFAILING (< 4.5:1):");
issues.forEach(i => console.log(`  ${i.pair}: ${i.ratio}:1`));
console.log("\nAA PASS (4.5–7:1):");
aaPass.forEach(i => console.log(`  ${i.pair}: ${i.ratio}:1`));
console.log("\n" + JSON.stringify({ failing: issues.length, aaPass: aaPass.length }, null, 2));
