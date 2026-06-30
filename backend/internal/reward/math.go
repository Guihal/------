package reward

import "taskcompanion/backend/internal/task"

// Drop balance constants (spec §7.8.4).
const (
	DropXPUnit      = 300.0
	DropDifficulty  = 1.25
	DropMultiplierMin = 0.5
	DropMultiplierMax = 2.5
)

// Base cumulative thresholds and caps keyed by rarity.
var baseThreshold = map[string]float64{
	"common": 0.22, "rare": 0.07, "epic": 0.02, "legendary": 0.004,
}
var dropCap = map[string]float64{
	"common": 0.45, "rare": 0.18, "epic": 0.06, "legendary": 0.015,
}

// dropOrder is rarest→commonest (spec §7.8.4 selection order).
var dropOrder = []string{"legendary", "epic", "rare", "common"}

// taskMultTable expresses the 1.00=70% / 1.25=20% / 1.50=8% / 2.00=2% table
// as cumulative bounds in [0,1). A roll in [lo,hi) yields that multiplier.
var taskMultTable = []struct {
	lo, hi float64
	mult   float64
}{
	{0.00, 0.70, 1.00},
	{0.70, 0.90, 1.25},
	{0.90, 0.98, 1.50},
	{0.98, 1.00, 2.00},
}

// LevelForXP derives level from cumulative xp_total. xp_total>=0 ⇒ level>=1.
func LevelForXP(xpTotal int) int {
	return xpTotal/task.XPPerLevel + 1
}

// ProgressionSnapshotFor builds the authoritative XP/level view from xp_total.
func ProgressionSnapshotFor(xpTotal int) ProgressionSnapshot {
	in := xpTotal % task.XPPerLevel
	return ProgressionSnapshot{
		XPTotal:          xpTotal,
		Level:            LevelForXP(xpTotal),
		XPInCurrentLevel: in,
		XPToNextLevel:    task.XPPerLevel - in,
	}
}

// LevelsForReward lists reached milestone levels in (oldLevel, newLevel].
func LevelsForReward(oldLevel, newLevel int) []int {
	out := []int{}
	for lvl := oldLevel + 1; lvl <= newLevel; lvl++ {
		if lvl%5 == 0 {
			out = append(out, lvl)
		}
	}
	return out
}

// TaskMultiplier rolls the per-completion task multiplier.
func TaskMultiplier(rng RNG) (float64, error) {
	roll, err := rng.Float64()
	if err != nil {
		return 0, err
	}
	for _, e := range taskMultTable {
		if roll >= e.lo && roll < e.hi {
			return e.mult, nil
		}
	}
	return taskMultTable[len(taskMultTable)-1].mult, nil
}

// EquipmentMultiplier = product of equipped xp_multipliers clamped to [1.0, 2.0].
func EquipmentMultiplier(mults []float64) float64 {
	p := 1.0
	for _, m := range mults {
		p *= m
	}
	if p < 1.0 {
		return 1.0
	}
	if p > 2.0 {
		return 2.0
	}
	return p
}

// FinalXP = floor(base * taskMult * equipMult), never negative.
func FinalXP(base int, taskMult, equipMult float64) int {
	xp := int(float64(base) * taskMult * equipMult)
	if xp < 0 {
		return 0
	}
	return xp
}

// DropMultiplier = clamp(finalXP/DropXPUnit, Min, Max).
func DropMultiplier(finalXP int) float64 {
	m := float64(finalXP) / DropXPUnit
	if m < DropMultiplierMin {
		return DropMultiplierMin
	}
	if m > DropMultiplierMax {
		return DropMultiplierMax
	}
	return m
}

// DropRarity selects a rarity from a [0,1) roll, or "" for no drop.
func DropRarity(roll float64, dropMult float64) string {
	for _, rarity := range dropOrder {
		eff := baseThreshold[rarity] * dropMult / DropDifficulty
		if eff > dropCap[rarity] {
			eff = dropCap[rarity]
		}
		if roll <= eff {
			return rarity
		}
	}
	return ""
}

// RarityMultiplierRange returns the DB-enforced [min,max] for granted items.
func RarityMultiplierRange(rarity string) (float64, float64) {
	switch rarity {
	case "common":
		return 1.020, 1.080
	case "rare":
		return 1.080, 1.160
	case "epic":
		return 1.160, 1.280
	case "legendary":
		return 1.280, 1.450
	}
	return 1.0, 1.0
}

// RollRarityMultiplier rolls a granted item multiplier inside its rarity range.
// Catalog base_xp_multiplier may exceed the range (e.g. Legend Quill 1.500),
// so granted multiplier is always rolled fresh (spec §7.8.4).
func RollRarityMultiplier(rng RNG, rarity string) (float64, error) {
	lo, hi := RarityMultiplierRange(rarity)
	roll, err := rng.Float64()
	if err != nil {
		return lo, err
	}
	return lo + roll*(hi-lo), nil
}
