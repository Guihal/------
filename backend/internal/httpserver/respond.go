package httpserver

import (
	"encoding/json"
	"net/http"
)

type errorResponse struct {
	Code      string            `json:"code"`
	Message   string            `json:"message"`
	Fields    map[string]string `json:"field_errors,omitempty"`
	RequestID string            `json:"request_id,omitempty"`
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}

func writeError(w http.ResponseWriter, r *http.Request, status int, code string, message string) {
	writeJSON(w, status, errorResponse{
		Code: code, Message: message, RequestID: RequestIDFromContext(r.Context()),
	})
}
