package task

import (
	"context"
	"errors"
	"strings"
)

var (
	ErrValidation = errors.New("task validation failed")
	ErrNotFound   = errors.New("task not found")
)

// Repository is the persistence interface (SQL lives in taskrepo).
type Repository interface {
	List(ctx context.Context, userID string, f ListFilters) (ListResult, error)
	Get(ctx context.Context, userID, id string) (Task, error)
	Create(ctx context.Context, userID string, in CreateInput) (Task, error)
	Update(ctx context.Context, userID, id string, in PatchInput) (Task, error)
	Archive(ctx context.Context, userID, id string) (Task, error)
	Categories(ctx context.Context, userID string) ([]TaskCategory, error)
	EnsureSystemCategories(ctx context.Context, userID string) error
	CategoryExistsForUser(ctx context.Context, userID, categoryID string) (bool, error)
	SystemCategoryByTitle(ctx context.Context, userID, title string) (string, error)
}

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service { return &Service{repo: repo} }

func (s *Service) List(ctx context.Context, userID string, f ListFilters) (ListResult, error) {
	return s.repo.List(ctx, userID, f)
}

func (s *Service) Get(ctx context.Context, userID, id string) (Task, error) {
	return s.repo.Get(ctx, userID, id)
}

func (s *Service) Archive(ctx context.Context, userID, id string) (Task, error) {
	return s.repo.Archive(ctx, userID, id)
}

func (s *Service) Categories(ctx context.Context, userID string) ([]TaskCategory, error) {
	if err := s.repo.EnsureSystemCategories(ctx, userID); err != nil {
		return nil, err
	}
	return s.repo.Categories(ctx, userID)
}

// validateTitle trims and enforces 1..200 runes.
func validateTitle(title string) (string, error) {
	t := strings.TrimSpace(title)
	if t == "" || len([]rune(t)) > 200 {
		return "", ErrValidation
	}
	return t, nil
}
