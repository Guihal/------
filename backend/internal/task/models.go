package task

import "time"

// Task is the API shape for a task. Overdue is DERIVED (active + past deadline),
// never persisted; computed in the repository read query.
type Task struct {
	ID          string     `json:"id"`
	UserID      string     `json:"-"`
	CategoryID  *string    `json:"category_id"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Status      string     `json:"status"`
	Priority    string     `json:"priority"`
	Complexity  string     `json:"complexity"`
	DeadlineAt  *time.Time `json:"deadline_at"`
	CompletedAt *time.Time `json:"completed_at"`
	ArchivedAt  *time.Time `json:"archived_at"`
	Overdue     bool       `json:"overdue"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// TaskCategory is a selectable category for task forms.
type TaskCategory struct {
	ID       string `json:"id"`
	Title    string `json:"title"`
	Color    string `json:"color"`
	IsSystem bool   `json:"is_system"`
}

// CreateInput is the validated request body for POST /tasks.
// CategoryID is optional; nil → resolved to the user's "общее" system category.
type CreateInput struct {
	Title       string
	Description string
	CategoryID  *string
	Priority    string
	Complexity  string
	DeadlineAt  *time.Time
}

// PatchInput is the validated request body for PATCH /tasks/:id.
// Pointers express partial update. Status/CompletedAt are intentionally absent:
// the client cannot self-complete for XP (P06 owns completion).
type PatchInput struct {
	Title       *string
	Description *string
	CategoryID  *string
	Priority    *string
	Complexity  *string
	DeadlineAt  *time.Time
}

// ListFilters captures task list query parameters.
type ListFilters struct {
	Status     string // active|archived|completed|all (default active)
	CategoryID string
	Priority   string
	Sort       string // overdue|deadline|created_at (default overdue)
	Limit      int
	Offset     int
}

// ListResult is the paginated task list payload.
type ListResult struct {
	Items  []Task `json:"items"`
	Total  int    `json:"total"`
	Limit  int    `json:"limit"`
	Offset int    `json:"offset"`
}
