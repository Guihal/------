package httpserver

import (
	"net/http"

	"taskcompanion/backend/internal/task"
)

type TaskCategoryHandlers struct {
	service *task.Service
}

func NewTaskCategoryHandlers(service *task.Service) TaskCategoryHandlers {
	return TaskCategoryHandlers{service: service}
}

func (h TaskCategoryHandlers) List(w http.ResponseWriter, r *http.Request) {
	cats, err := h.service.Categories(r.Context(), CurrentClaims(r).Subject)
	if err != nil {
		writeTaskError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": cats})
}
