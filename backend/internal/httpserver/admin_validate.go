package httpserver

import (
	"net/http"
	"strconv"
	"strings"
	"time"
)

func validUUID(v string) bool {
	parts := strings.Split(v, "-")
	if len(parts) != 5 {
		return false
	}
	for i, size := range []int{8, 4, 4, 4, 12} {
		if len(parts[i]) != size || !hexOnly(parts[i]) {
			return false
		}
	}
	return true
}

func hexOnly(v string) bool {
	for _, r := range v {
		if r >= '0' && r <= '9' || r >= 'a' && r <= 'f' || r >= 'A' && r <= 'F' {
			continue
		}
		return false
	}
	return true
}

func requireUUIDParam(w http.ResponseWriter, r *http.Request, id string) bool {
	if validUUID(id) {
		return true
	}
	writeError(w, r, http.StatusBadRequest, "invalid_id", "invalid item id")
	return false
}

func parseOptionalBool(v string) (*bool, bool) {
	if strings.TrimSpace(v) == "" {
		return nil, true
	}
	b, err := strconv.ParseBool(v)
	if err != nil {
		return nil, false
	}
	return &b, true
}

func parseRFC3339Param(w http.ResponseWriter, r *http.Request, name string) (time.Time, bool) {
	v := r.URL.Query().Get(name)
	if v == "" {
		return time.Time{}, true
	}
	parsed, err := time.Parse(time.RFC3339, v)
	if err != nil {
		writeError(w, r, http.StatusBadRequest, "invalid_date", "invalid "+name)
		return time.Time{}, false
	}
	return parsed, true
}
