package task

import (
	"context"
	"strings"
)

var (
	validPriority   = map[string]struct{}{"low": {}, "normal": {}, "high": {}}
	validComplexity = map[string]struct{}{"tiny": {}, "small": {}, "medium": {}, "large": {}}
)

func normalizePriority(p string) string {
	if _, ok := validPriority[p]; !ok {
		return "normal"
	}
	return p
}

// normalizeComplexity returns "medium" for empty (default per packet) or "" for invalid.
func normalizeComplexity(c string) string {
	if c == "" {
		return "medium"
	}
	if _, ok := validComplexity[c]; !ok {
		return ""
	}
	return c
}

// resolveCategory ensures a category_id is owned by the user.
// nil → the user's "общее" system category is provisioned + resolved.
func (s *Service) resolveCategory(ctx context.Context, userID string, categoryID *string) (*string, error) {
	if err := s.repo.EnsureSystemCategories(ctx, userID); err != nil {
		return nil, err
	}
	if categoryID == nil {
		id, err := s.repo.SystemCategoryByTitle(ctx, userID, "общее")
		if err != nil {
			return nil, ErrNotFound
		}
		return &id, nil
	}
	ok, err := s.repo.CategoryExistsForUser(ctx, userID, *categoryID)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, ErrValidation
	}
	return categoryID, nil
}

func (s *Service) Create(ctx context.Context, userID string, in CreateInput) (Task, error) {
	title, err := validateTitle(in.Title)
	if err != nil {
		return Task{}, err
	}
	complexity := normalizeComplexity(in.Complexity)
	if complexity == "" {
		return Task{}, ErrValidation
	}
	catID, err := s.resolveCategory(ctx, userID, in.CategoryID)
	if err != nil {
		return Task{}, err
	}
	in.Title = title
	in.Description = strings.TrimSpace(in.Description)
	in.CategoryID = catID
	in.Priority = normalizePriority(in.Priority)
	in.Complexity = complexity
	return s.repo.Create(ctx, userID, in)
}

func (s *Service) Update(ctx context.Context, userID, id string, in PatchInput) (Task, error) {
	if in.Title != nil {
		t, err := validateTitle(*in.Title)
		if err != nil {
			return Task{}, err
		}
		in.Title = &t
	}
	if in.Description != nil {
		d := strings.TrimSpace(*in.Description)
		in.Description = &d
	}
	if in.Priority != nil {
		if _, ok := validPriority[*in.Priority]; !ok {
			return Task{}, ErrValidation
		}
	}
	if in.Complexity != nil {
		if _, ok := validComplexity[*in.Complexity]; !ok {
			return Task{}, ErrValidation
		}
	}
	if in.CategoryID != nil {
		ok, err := s.repo.CategoryExistsForUser(ctx, userID, *in.CategoryID)
		if err != nil {
			return Task{}, err
		}
		if !ok {
			return Task{}, ErrValidation
		}
	}
	return s.repo.Update(ctx, userID, id, in)
}
