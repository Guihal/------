package admin

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"math"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"taskcompanion/backend/internal/auth"
)

// Repository is the SQL surface implemented by adminrepo.
type Repository interface {
	GetItem(ctx context.Context, id string) (Item, error)
	CreateItemWithAudit(ctx context.Context, input ItemInput, event auth.AuditEvent) (Item, error)
	UpdateItemWithAudit(ctx context.Context, id string, patch ItemPatch, event auth.AuditEvent) (Item, error)
	DisableItemWithAudit(ctx context.Context, id string, event auth.AuditEvent) (Item, error)
	SetItemAssetWithAudit(ctx context.Context, id, assetURL string, event auth.AuditEvent) error
}

type Service struct {
	repo      Repository
	assetsDir string
}

func NewService(repo Repository, assetsDir string) *Service {
	return &Service{repo: repo, assetsDir: assetsDir}
}

func (s *Service) CreateItem(ctx context.Context, input ItemInput, adminID, ip string) (Item, error) {
	if input.BaseXPMultiplier == 0 {
		input.BaseXPMultiplier = 1
	}
	if !validItemInput(input) {
		return Item{}, ErrInvalidInput
	}
	event := auth.AuditEvent{UserID: &adminID, Action: "item.create",
		Details: map[string]any{"name": input.Name}, IP: ip}
	return s.repo.CreateItemWithAudit(ctx, input, event)
}

func (s *Service) UpdateItem(ctx context.Context, id string, patch ItemPatch, adminID, ip string) (Item, error) {
	if !validItemPatch(patch) {
		return Item{}, ErrInvalidInput
	}
	event := auth.AuditEvent{UserID: &adminID, Action: "item.update",
		Details: map[string]any{"item_id": id}, IP: ip}
	return s.repo.UpdateItemWithAudit(ctx, id, patch, event)
}

func (s *Service) DisableItem(ctx context.Context, id, adminID, ip string) (Item, error) {
	event := auth.AuditEvent{UserID: &adminID, Action: "item.disable",
		Details: map[string]any{"item_id": id}, IP: ip}
	return s.repo.DisableItemWithAudit(ctx, id, event)
}

// UploadAsset sniffs content (never trusts client filename), generates a uuid
// filename, writes to disk, updates catalog asset_url, and audits.
func (s *Service) UploadAsset(ctx context.Context, itemID string, data []byte, adminID, ip string) (AssetUpload, error) {
	sniff := data
	if len(sniff) > 512 {
		sniff = sniff[:512]
	}
	ext, ok := sniffExt[http.DetectContentType(sniff)]
	if !ok {
		return AssetUpload{}, ErrInvalidInput
	}
	if _, err := s.repo.GetItem(ctx, itemID); err != nil {
		return AssetUpload{}, err
	}
	var raw [16]byte
	if _, err := rand.Read(raw[:]); err != nil {
		return AssetUpload{}, err
	}
	filename := hex.EncodeToString(raw[:]) + "." + ext
	if err := os.MkdirAll(s.assetsDir, 0o755); err != nil {
		return AssetUpload{}, err
	}
	if err := os.WriteFile(filepath.Join(s.assetsDir, filename), data, 0o644); err != nil {
		return AssetUpload{}, err
	}
	url := assetsURLPrefix + "/" + filename
	event := auth.AuditEvent{UserID: &adminID, Action: "asset.upload",
		Details: map[string]any{"item_id": itemID, "filename": filename}, IP: ip}
	if err := s.repo.SetItemAssetWithAudit(ctx, itemID, url, event); err != nil {
		return AssetUpload{}, err
	}
	return AssetUpload{AssetURL: url}, nil
}

func blank(s string) bool {
	return strings.TrimSpace(s) == ""
}

func validMultiplier(v float64) bool {
	return v >= 1 && !math.IsNaN(v) && !math.IsInf(v, 0)
}

func validItemInput(in ItemInput) bool {
	return rarityAllowlist[in.Rarity] && !blank(in.Name) && !blank(in.SlotKey) &&
		validMultiplier(in.BaseXPMultiplier)
}

func validItemPatch(p ItemPatch) bool {
	if (p.Name != nil && blank(*p.Name)) || (p.SlotKey != nil && blank(*p.SlotKey)) {
		return false
	}
	return p.BaseXPMultiplier == nil || validMultiplier(*p.BaseXPMultiplier)
}
