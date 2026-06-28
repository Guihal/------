package httpserver

import "net/http"

func AdminStatsHandler(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "admin placeholder"})
}
