package reward

import (
	"crypto/rand"
	"math/big"
)

// RNG produces uniform floats in [0,1). Injectable for deterministic tests.
type RNG interface {
	Float64() (float64, error)
}

type cryptoRNG struct{}

// NewCryptoRNG returns a crypto/rand-backed RNG for non-service callers
// (e.g. repo-side item-multiplier rolls).
func NewCryptoRNG() RNG { return cryptoRNG{} }

func (cryptoRNG) Float64() (float64, error) {
	n, err := rand.Int(rand.Reader, big.NewInt(1_000_000_000))
	if err != nil {
		return 0, err
	}
	return float64(n.Int64()) / 1_000_000_000, nil
}
