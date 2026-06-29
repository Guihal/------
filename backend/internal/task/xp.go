package task

// XPPerLevel is the canonical XP-per-level constant for P05+ progression math.
// ponytail: profile/service.go (P04, frozen) keeps its own unexported xpPerLevel=1000;
// unify into a shared package if a third consumer appears.
const XPPerLevel = 1000

// Base XP by task complexity.
var complexityXP = map[string]int{
	"tiny":   50,
	"small":  100,
	"medium": 200,
	"large":  350,
}

const highPriorityBonus = 50

// BaseXP computes the non-negative base XP a task would grant on completion.
// Unknown complexity yields 0 (no XP). Negative results are impossible.
// P06 owns actual granting + multipliers; P05 only exposes the helper.
func BaseXP(complexity string, priority string) int {
	xp := complexityXP[complexity]
	if priority == "high" {
		xp += highPriorityBonus
	}
	return xp
}
