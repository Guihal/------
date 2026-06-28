package auth

import (
	"sync"
	"time"
)

type FailureTracker struct {
	threshold int
	window    time.Duration
	now       func() time.Time
	mu        sync.Mutex
	hits      map[string][]time.Time
}

func NewFailureTracker(threshold int, window time.Duration) *FailureTracker {
	return &FailureTracker{threshold: threshold, window: window, now: time.Now, hits: map[string][]time.Time{}}
}

func (t *FailureTracker) Add(key string) bool {
	t.mu.Lock()
	defer t.mu.Unlock()
	now := t.now()
	cutoff := now.Add(-t.window)
	kept := t.hits[key][:0]
	for _, hit := range t.hits[key] {
		if hit.After(cutoff) {
			kept = append(kept, hit)
		}
	}
	kept = append(kept, now)
	t.hits[key] = kept
	return len(kept) == t.threshold
}

func (t *FailureTracker) Reset(key string) {
	t.mu.Lock()
	defer t.mu.Unlock()
	delete(t.hits, key)
}
