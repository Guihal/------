import { describe, expect, it } from "vitest";
import { multiplierLabel, slotLabel } from "./useInventoryLabels";

describe("useInventoryLabels", () => {
  it("returns russian label for known slot", () => {
    expect(slotLabel("head")).toBe("голова");
  });

  it("falls back to raw slot id for unknown slot", () => {
    expect(slotLabel("unknown_slot")).toBe("unknown_slot");
  });

  it("formats multiplier with two decimals and XP suffix", () => {
    expect(multiplierLabel(1.5)).toBe("x1.50 XP");
  });
});
