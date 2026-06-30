package reward

import (
	"context"
	"errors"
	"log/slog"

	"taskcompanion/backend/internal/task"
	"taskcompanion/backend/internal/visual"
)

// ErrNotFound signals the task does not exist for this user.
var ErrNotFound = errors.New("reward: task not found")

// Repository executes the atomic completion tx and supporting reads (SQL-only).
type Repository interface {
	TaskForCompletion(ctx context.Context, userID, taskID string) (TaskInfo, error)
	EquippedMultipliers(ctx context.Context, userID string) ([]float64, error)
	CompleteTx(ctx context.Context, userID, taskID string, plan Plan) (Result, error)
	PersistedCompletion(ctx context.Context, userID, taskID string) (Result, error)
}

// VisualRefresher refreshes visual state post-commit (documented ceiling:
// failure is logged and visual_state omitted — reward stays durable).
type VisualRefresher interface {
	Refresh(ctx context.Context, userID, event string) (visual.State, error)
}

type Service struct {
	repo   Repository
	visual VisualRefresher
	rng    RNG
	logger *slog.Logger
}

func NewService(repo Repository, visual VisualRefresher, logger *slog.Logger) *Service {
	return &Service{repo: repo, visual: visual, rng: cryptoRNG{}, logger: logger}
}

// NewServiceWithRNG injects a deterministic RNG (tests only).
func NewServiceWithRNG(repo Repository, visual VisualRefresher, logger *slog.Logger, rng RNG) *Service {
	return &Service{repo: repo, visual: visual, rng: rng, logger: logger}
}

// Complete orchestrates the atomic complete-task transaction.
// RNG-dependent rolls happen here; the repo runs the SQL tx with the Plan.
func (s *Service) Complete(ctx context.Context, userID, taskID string) (CompletionPayload, error) {
	info, err := s.repo.TaskForCompletion(ctx, userID, taskID)
	if err != nil {
		return CompletionPayload{}, err
	}

	var res Result
	if info.Status == "completed" {
		// Idempotent path: persisted payload, NO reroll, NO new inserts.
		res, err = s.repo.PersistedCompletion(ctx, userID, taskID)
	} else {
		res, err = s.freshComplete(ctx, userID, taskID, info)
	}
	if err != nil {
		return CompletionPayload{}, err
	}

	payload := CompletionPayload{
		Task:                    taskStub{ID: taskID, Status: "completed"},
		IsFreshCompletionEvent:  res.IsFresh,
		XPGrant:                 res.XPGrant,
		ProgressionBefore:       res.ProgressionBefore,
		ProgressionAfter:        res.ProgressionAfter,
		LevelRewards:            res.LevelRewards,
		TaskDrop:                res.Drop,
	}
	if res.LeveledUp {
		payload.LevelUps = levelUps(res.ProgressionBefore.Level, res.ProgressionAfter.Level)
	}
	s.attachVisual(ctx, userID, res.LeveledUp, &payload)
	return payload, nil
}

func (s *Service) freshComplete(ctx context.Context, userID, taskID string, info TaskInfo) (Result, error) {
	taskMult, err := TaskMultiplier(s.rng)
	if err != nil {
		return Result{}, err
	}
	equipped, err := s.repo.EquippedMultipliers(ctx, userID)
	if err != nil {
		return Result{}, err
	}
	equipMult := EquipmentMultiplier(equipped)
	base := task.BaseXP(info.Complexity, info.Priority)
	final := FinalXP(base, taskMult, equipMult)

	dropMult := DropMultiplier(final)
	dropRoll, err := s.rng.Float64()
	if err != nil {
		return Result{}, err
	}
	plan := Plan{
		BaseXP: base, TaskMultiplier: taskMult, EquipmentMultiplier: equipMult,
		FinalXP: final, DropMultiplier: dropMult,
		DropRoll: dropRoll, DropRarity: DropRarity(dropRoll, dropMult),
	}
	return s.repo.CompleteTx(ctx, userID, taskID, plan)
}

// attachVisual runs the post-commit visual refresh. Failure does not fail the
// completion: reward tx is already durable. ponytail: visual refresh tx is
// separate from reward tx (strategic-debt ceiling); joint-tx refactor deferred.
func (s *Service) attachVisual(ctx context.Context, userID string, leveledUp bool, p *CompletionPayload) {
	event := "task-completed"
	if leveledUp {
		event = "level-up"
	}
	state, err := s.visual.Refresh(ctx, userID, event)
	if err != nil {
		if s.logger != nil {
			s.logger.Warn("reward: visual refresh post-commit failed", "err", err, "user_id", userID)
		}
		return
	}
	p.VisualState = &state
}

func levelUps(before, after int) []int {
	out := []int{}
	for l := before + 1; l <= after; l++ {
		out = append(out, l)
	}
	return out
}
