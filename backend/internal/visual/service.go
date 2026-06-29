package visual

import (
	"context"
	"crypto/rand"
	"errors"
	"math/big"
)

var ErrValidation = errors.New("validation failed")

type Repository interface {
	Load(context.Context, string) (State, bool, error)
	Save(context.Context, string, State) error
	VisualRandomDisabled(context.Context, string) (bool, error)
}

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Get(ctx context.Context, userID string) (State, error) {
	state, ok, err := s.repo.Load(ctx, userID)
	if err != nil {
		return State{}, err
	}
	if !ok || !Valid(state) {
		return fallback, nil
	}
	return state, nil
}

func (s *Service) Refresh(ctx context.Context, userID string, event string) (State, error) {
	// ponytail: Refresh Load→Save not tx-bounded; concurrent refresh can interleave.
	// Fix: wrap in repo-level tx when contention observed.
	if !AllowedEvents[event] {
		return State{}, ErrValidation
	}
	if disabled, err := s.repo.VisualRandomDisabled(ctx, userID); err != nil || disabled {
		if err != nil {
			return State{}, err
		}
		state, ok, err := s.repo.Load(ctx, userID)
		if err != nil {
			return State{}, err
		}
		if ok && Valid(state) {
			return state, nil
		}
		state = fallback
		return state, s.repo.Save(ctx, userID, state)
	}
	state, err := roll()
	if err != nil {
		return State{}, err
	}
	return state, s.repo.Save(ctx, userID, state)
}

func roll() (State, error) {
	pick := func(slot string) (string, error) {
		values := catalog[slot]
		n, err := rand.Int(rand.Reader, big.NewInt(int64(len(values))))
		if err != nil {
			return "", err
		}
		return values[n.Int64()], nil
	}
	return stateFromPicker(pick)
}
