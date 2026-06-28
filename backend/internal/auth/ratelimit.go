package auth

import (
	"sync"
	"time"
)

type RateLimiter struct {
	limit  int
	window time.Duration
	now    func() time.Time
	mu     sync.Mutex
	hits   map[string][]time.Time
}

func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	return &RateLimiter{
		limit: limit, window: window, now: time.Now, hits: map[string][]time.Time{},
	}
}

func (l *RateLimiter) Allow(key string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()

	now := l.now()
	cutoff := now.Add(-l.window)
	kept := l.hits[key][:0]
	for _, hit := range l.hits[key] {
		if hit.After(cutoff) {
			kept = append(kept, hit)
		}
	}
	if len(kept) >= l.limit {
		l.hits[key] = kept
		return false
	}
	l.hits[key] = append(kept, now)
	return true
}
