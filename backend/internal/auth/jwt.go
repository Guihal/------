package auth

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"strings"
	"time"
)

var ErrInvalidToken = errors.New("invalid token")

type Claims struct {
	Subject string `json:"sub"`
	Email   string `json:"email"`
	Role    string `json:"role"`
	Expires int64  `json:"exp"`
	Issued  int64  `json:"iat"`
}

type TokenManager struct {
	secret []byte
	ttl    time.Duration
	now    func() time.Time
}

func NewTokenManager(secret string, ttl time.Duration) TokenManager {
	return TokenManager{secret: []byte(secret), ttl: ttl, now: time.Now}
}

func (m TokenManager) Sign(user User) (string, time.Time, error) {
	now := m.now().UTC()
	expires := now.Add(m.ttl)
	claims := Claims{Subject: user.ID, Email: user.Email, Role: user.Role, Expires: expires.Unix(), Issued: now.Unix()}
	header := map[string]string{"alg": "HS256", "typ": "JWT"}
	head, err := encodeJSON(header)
	if err != nil {
		return "", time.Time{}, err
	}
	body, err := encodeJSON(claims)
	if err != nil {
		return "", time.Time{}, err
	}
	unsigned := head + "." + body
	return unsigned + "." + sign(unsigned, m.secret), expires, nil
}

func (m TokenManager) Verify(token string) (Claims, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return Claims{}, ErrInvalidToken
	}
	unsigned := parts[0] + "." + parts[1]
	if !hmac.Equal([]byte(parts[2]), []byte(sign(unsigned, m.secret))) {
		return Claims{}, ErrInvalidToken
	}
	var claims Claims
	if err := decodeJSON(parts[1], &claims); err != nil || claims.Subject == "" {
		return Claims{}, ErrInvalidToken
	}
	if m.now().UTC().Unix() >= claims.Expires {
		return Claims{}, ErrInvalidToken
	}
	return claims, nil
}

func encodeJSON(value any) (string, error) {
	raw, err := json.Marshal(value)
	return base64.RawURLEncoding.EncodeToString(raw), err
}

func decodeJSON(encoded string, value any) error {
	raw, err := base64.RawURLEncoding.DecodeString(encoded)
	if err != nil {
		return err
	}
	return json.Unmarshal(raw, value)
}

func sign(unsigned string, secret []byte) string {
	mac := hmac.New(sha256.New, secret)
	mac.Write([]byte(unsigned))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}
