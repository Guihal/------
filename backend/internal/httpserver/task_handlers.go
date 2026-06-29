package httpserver

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"

	"taskcompanion/backend/internal/task"
)

type TaskHandlers struct {
	service *task.Service
}

func NewTaskHandlers(service *task.Service) TaskHandlers {
	return TaskHandlers{service: service}
}

type taskCreateRequest struct {
	Title       string     `json:"title"`
	Description string     `json:"description"`
	CategoryID  *string    `json:"category_id"`
	Priority    string     `json:"priority"`
	Complexity  string     `json:"complexity"`
	DeadlineAt  *time.Time `json:"deadline_at"`
}

type taskPatchRequest struct {
	Title       *string    `json:"title"`
	Description *string    `json:"description"`
	CategoryID  *string    `json:"category_id"`
	Priority    *string    `json:"priority"`
	Complexity  *string    `json:"complexity"`
	DeadlineAt  *time.Time `json:"deadline_at"`
}

func (h TaskHandlers) List(w http.ResponseWriter, r *http.Request) {
	filters := task.ListFilters{
		Status:     defaultIfEmpty(r.URL.Query().Get("status"), "active"),
		CategoryID: r.URL.Query().Get("category_id"),
		Priority:   r.URL.Query().Get("priority"),
		Sort:       r.URL.Query().Get("sort"),
		Limit:      atoiDefault(r.URL.Query().Get("limit"), 20),
		Offset:     atoiDefault(r.URL.Query().Get("offset"), 0),
	}
	result, err := h.service.List(r.Context(), CurrentClaims(r).Subject, filters)
	if err != nil {
		writeTaskError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h TaskHandlers) Create(w http.ResponseWriter, r *http.Request) {
	var body taskCreateRequest
	if !decodeJSONBody(w, r, &body) {
		return
	}
	result, err := h.service.Create(r.Context(), CurrentClaims(r).Subject, task.CreateInput{
		Title:       body.Title,
		Description: body.Description,
		CategoryID:  body.CategoryID,
		Priority:    body.Priority,
		Complexity:  body.Complexity,
		DeadlineAt:  body.DeadlineAt,
	})
	if err != nil {
		writeTaskError(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, result)
}

func (h TaskHandlers) Get(w http.ResponseWriter, r *http.Request) {
	result, err := h.service.Get(r.Context(), CurrentClaims(r).Subject, chi.URLParam(r, "id"))
	if err != nil {
		writeTaskError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h TaskHandlers) Patch(w http.ResponseWriter, r *http.Request) {
	var body taskPatchRequest
	if !decodeJSONBody(w, r, &body) {
		return
	}
	result, err := h.service.Update(r.Context(), CurrentClaims(r).Subject, chi.URLParam(r, "id"), task.PatchInput{
		Title: body.Title, Description: body.Description, CategoryID: body.CategoryID,
		Priority: body.Priority, Complexity: body.Complexity, DeadlineAt: body.DeadlineAt,
	})
	if err != nil {
		writeTaskError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h TaskHandlers) Archive(w http.ResponseWriter, r *http.Request) {
	result, err := h.service.Archive(r.Context(), CurrentClaims(r).Subject, chi.URLParam(r, "id"))
	if err != nil {
		writeTaskError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func atoiDefault(value string, def int) int {
	if value == "" {
		return def
	}
	n, err := strconv.Atoi(value)
	if err != nil {
		return def
	}
	return n
}

func defaultIfEmpty(value, def string) string {
	if value == "" {
		return def
	}
	return value
}

func writeTaskError(w http.ResponseWriter, r *http.Request, err error) {
	switch {
	case errors.Is(err, task.ErrNotFound):
		writeError(w, r, http.StatusNotFound, "not_found", "task not found")
	case errors.Is(err, task.ErrValidation):
		writeError(w, r, http.StatusBadRequest, "validation_error", "invalid task fields")
	default:
		writeError(w, r, http.StatusInternalServerError, "internal_error", "internal server error")
	}
}
