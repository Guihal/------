package httpserver

import (
	"net/http"

	"taskcompanion/backend/internal/admin"
)

func (h *AdminHandlers) ListLogs(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	if uid := q.Get("user_id"); uid != "" && !validUUID(uid) {
		writeError(w, r, http.StatusBadRequest, "invalid_user_id", "invalid user_id")
		return
	}
	from, ok := parseRFC3339Param(w, r, "from")
	if !ok {
		return
	}
	to, ok := parseRFC3339Param(w, r, "to")
	if !ok {
		return
	}
	page, err := h.reads.ListAuditLogs(r.Context(), admin.ListAuditLogsFilter{
		Limit:  atoi(q.Get("limit"), 50),
		Offset: atoi(q.Get("offset"), 0),
		UserID: q.Get("user_id"),
		Action: q.Get("action"),
		From:   from,
		To:     to,
	})
	if err != nil {
		writeError(w, r, http.StatusInternalServerError, "internal", "logs read failed")
		return
	}
	writeJSON(w, http.StatusOK, page)
}
