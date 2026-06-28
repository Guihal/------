package auth

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
)

func NewRefreshToken() (string, error) {
	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(raw), nil
}

func HashRefreshToken(secret string, token string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(token))
	return hex.EncodeToString(mac.Sum(nil))
}

func HashSubject(value string) string {
	sum := sha256.Sum256([]byte(value))
	return hex.EncodeToString(sum[:])
}
