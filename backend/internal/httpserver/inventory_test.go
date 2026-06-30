package httpserver

import (
	"net/http"
	"testing"

	"taskcompanion/backend/internal/inventory"
)

func TestEquipOwnedItemSucceeds(t *testing.T) {
	server, db := authTestServer(t)
	defer db.Close()
	user := registerUser(t, server, "equip-ok@example.test")
	ownedID := seedItemFixture(t, db, user.User.ID, "head", "common")

	resp := doJSON(t, server, http.MethodPost, "/inventory/"+ownedID+"/equip", nil, user.AccessToken)
	if resp.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", resp.Code, resp.Body.String())
	}
	eq := decodeBody[inventory.EquippedItem](t, resp)
	if eq.SlotKey != "head" || eq.UserInventoryItemID != ownedID {
		t.Fatalf("bad equip body: %+v", eq)
	}
	if c := countRows(t, db, `SELECT count(*) FROM equipped_items WHERE user_id=$1 AND user_inventory_item_id=$2`, user.User.ID, ownedID); c != 1 {
		t.Fatalf("expected 1 equipped row, got %d", c)
	}
	if c := countRows(t, db, `SELECT count(*) FROM audit_logs WHERE user_id=$1 AND action='inventory.equip'`, user.User.ID); c != 1 {
		t.Fatalf("expected 1 equip audit, got %d", c)
	}
}

func TestEquipAnotherUsersItemIs404(t *testing.T) {
	server, db := authTestServer(t)
	defer db.Close()
	owner := registerUser(t, server, "equip-owner@example.test")
	other := registerUser(t, server, "equip-other@example.test")
	ownedID := seedItemFixture(t, db, owner.User.ID, "head", "common")

	resp := doJSON(t, server, http.MethodPost, "/inventory/"+ownedID+"/equip", nil, other.AccessToken)
	if resp.Code != http.StatusNotFound {
		t.Fatalf("expected 404 for foreign item, got %d: %s", resp.Code, resp.Body.String())
	}
	if c := countRows(t, db, `SELECT count(*) FROM equipped_items WHERE user_inventory_item_id=$1`, ownedID); c != 0 {
		t.Fatalf("foreign equip leaked: %d rows", c)
	}
}

func TestEquipWrongSlotIs400(t *testing.T) {
	server, db := authTestServer(t)
	defer db.Close()
	user := registerUser(t, server, "equip-slot@example.test")
	seedItemFixture(t, db, user.User.ID, "head", "common") // mascot has only "head"
	feetOwned := seedOwnedInSlot(t, db, user.User.ID, "Boots", "feet", "common")

	resp := doJSON(t, server, http.MethodPost, "/inventory/"+feetOwned+"/equip", nil, user.AccessToken)
	if resp.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 slot mismatch, got %d: %s", resp.Code, resp.Body.String())
	}
}

func TestEquipReplacesOccupiedSlot(t *testing.T) {
	server, db := authTestServer(t)
	defer db.Close()
	user := registerUser(t, server, "equip-replace@example.test")
	first := seedItemFixture(t, db, user.User.ID, "head", "common")
	second := seedOwnedInSlot(t, db, user.User.ID, "Cap2", "head", "common")

	doJSON(t, server, http.MethodPost, "/inventory/"+first+"/equip", nil, user.AccessToken)
	resp := doJSON(t, server, http.MethodPost, "/inventory/"+second+"/equip", nil, user.AccessToken)
	if resp.Code != http.StatusOK {
		t.Fatalf("expected 200 on replace, got %d: %s", resp.Code, resp.Body.String())
	}
	if c := countRows(t, db, `SELECT count(*) FROM equipped_items WHERE user_id=$1 AND slot_key='head'`, user.User.ID); c != 1 {
		t.Fatalf("expected exactly 1 head equipped after replace, got %d", c)
	}
	if c := countRows(t, db, `SELECT count(*) FROM equipped_items WHERE user_id=$1 AND user_inventory_item_id=$2`, user.User.ID, first); c != 0 {
		t.Fatalf("old item still equipped: %d", c)
	}
}

func TestUnequipOwnAndIdempotent404(t *testing.T) {
	server, db := authTestServer(t)
	defer db.Close()
	user := registerUser(t, server, "unequip-a@example.test")
	ownedID := seedItemFixture(t, db, user.User.ID, "head", "common")
	doJSON(t, server, http.MethodPost, "/inventory/"+ownedID+"/equip", nil, user.AccessToken)

	resp := doJSON(t, server, http.MethodPost, "/inventory/"+ownedID+"/unequip", nil, user.AccessToken)
	if resp.Code != http.StatusNoContent {
		t.Fatalf("expected 204 unequip, got %d: %s", resp.Code, resp.Body.String())
	}
	if c := countRows(t, db, `SELECT count(*) FROM equipped_items WHERE user_id=$1`, user.User.ID); c != 0 {
		t.Fatalf("expected 0 equipped after unequip, got %d", c)
	}
	if c := countRows(t, db, `SELECT count(*) FROM audit_logs WHERE user_id=$1 AND action='inventory.unequip'`, user.User.ID); c != 1 {
		t.Fatalf("expected 1 unequip audit, got %d", c)
	}
	// unequip again → not equipped by this user → 404
	resp = doJSON(t, server, http.MethodPost, "/inventory/"+ownedID+"/unequip", nil, user.AccessToken)
	if resp.Code != http.StatusNotFound {
		t.Fatalf("expected 404 unequip of non-equipped, got %d", resp.Code)
	}
}

func TestUnequipDoesNotTouchOtherUser(t *testing.T) {
	server, db := authTestServer(t)
	defer db.Close()
	a := registerUser(t, server, "uneq-a@example.test")
	b := registerUser(t, server, "uneq-b@example.test")
	aItem := seedItemFixture(t, db, a.User.ID, "head", "common")
	doJSON(t, server, http.MethodPost, "/inventory/"+aItem+"/equip", nil, a.AccessToken)

	// B tries to unequip A's item → 404, A's row untouched
	resp := doJSON(t, server, http.MethodPost, "/inventory/"+aItem+"/unequip", nil, b.AccessToken)
	if resp.Code != http.StatusNotFound {
		t.Fatalf("expected 404 cross-user unequip, got %d", resp.Code)
	}
	if c := countRows(t, db, `SELECT count(*) FROM equipped_items WHERE user_id=$1 AND user_inventory_item_id=$2`, a.User.ID, aItem); c != 1 {
		t.Fatalf("cross-user unequip altered A's row: %d", c)
	}
}

func TestActiveMascotReturnsSlotsAndAnchor(t *testing.T) {
	server, db := authTestServer(t)
	defer db.Close()
	user := registerUser(t, server, "mascot-active@example.test")
	seedItemFixture(t, db, user.User.ID, "head", "common")

	resp := doJSON(t, server, http.MethodGet, "/mascot/active", nil, user.AccessToken)
	if resp.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", resp.Code, resp.Body.String())
	}
	m := decodeBody[inventory.ActiveMascot](t, resp)
	if m.MascotID == "" || len(m.Slots) == 0 {
		t.Fatalf("bad active mascot: %+v", m)
	}
	var head *inventory.MascotSlot
	for i := range m.Slots {
		if m.Slots[i].SlotKey == "head" {
			head = &m.Slots[i]
		}
	}
	if head == nil || len(head.AnchorJSON) == 0 {
		t.Fatalf("head slot/anchor missing: %+v", m.Slots)
	}
}

func TestInventoryListDoesNotFilterDisabledCatalog(t *testing.T) {
	server, db := authTestServer(t)
	defer db.Close()
	user := registerUser(t, server, "inv-disabled@example.test")
	ownedID := seedItemFixture(t, db, user.User.ID, "head", "common")
	// disable the catalog item after grant — owned item must still appear
	if _, err := db.Exec(`UPDATE inventory_items SET active = false WHERE id = (
		SELECT inventory_item_id FROM user_inventory_items WHERE id = $1)`, ownedID); err != nil {
		t.Fatalf("disable: %v", err)
	}
	resp := doJSON(t, server, http.MethodGet, "/inventory", nil, user.AccessToken)
	if resp.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", resp.Code, resp.Body.String())
	}
	body := decodeBody[inventory.InventoryResponse](t, resp)
	if len(body.Items) != 1 || body.Items[0].ID != ownedID {
		t.Fatalf("owned item missing after catalog disable: %+v", body.Items)
	}
}
