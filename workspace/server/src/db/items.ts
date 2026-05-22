import { query, queryOne } from "./client.ts";

export type Rarity = "common" | "rare" | "epic" | "legendary";

export interface ItemRow {
  id: number;
  name: string;
  description: string | null;
  rarity: Rarity;
  slots: number;
  asset_url: string | null;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateItemInput {
  name: string;
  description?: string;
  rarity?: Rarity;
  slots?: number;
  asset_url?: string | null;
  active?: boolean;
}

export interface UpdateItemInput {
  name?: string;
  description?: string | null;
  rarity?: Rarity;
  slots?: number;
  asset_url?: string | null;
  active?: boolean;
}

export async function createItem(input: CreateItemInput): Promise<ItemRow> {
  const sql = `INSERT INTO items (name, description, rarity, slots, asset_url, active)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, name, description, rarity, slots, asset_url, active, created_at, updated_at`;
  const params = [
    input.name,
    input.description ?? null,
    input.rarity ?? "common",
    input.slots ?? 1,
    input.asset_url ?? null,
    input.active ?? true,
  ];
  const row = await queryOne<ItemRow>(sql, params);
  if (!row) throw new Error("Failed to create item");
  return row;
}

export async function findItemById(id: number): Promise<ItemRow | undefined> {
  return queryOne<ItemRow>(
    `SELECT id, name, description, rarity, slots, asset_url, active, created_at, updated_at FROM items WHERE id = $1`,
    [id]
  );
}

export async function listItems(): Promise<ItemRow[]> {
  return query<ItemRow>(
    `SELECT id, name, description, rarity, slots, asset_url, active, created_at, updated_at FROM items ORDER BY created_at DESC`
  );
}

export async function listActiveItems(): Promise<ItemRow[]> {
  return query<ItemRow>(
    `SELECT id, name, description, rarity, slots, asset_url, active, created_at, updated_at FROM items WHERE active = TRUE ORDER BY created_at DESC`
  );
}

export async function searchItems(q: string): Promise<ItemRow[]> {
  const pattern = `%${q.replace(/[%_\\]/g, "\\$&")}%`;
  return query<ItemRow>(
    `SELECT id, name, description, rarity, slots, asset_url, active, created_at, updated_at
     FROM items
     WHERE name ILIKE $1 OR description ILIKE $1
     ORDER BY created_at DESC`,
    [pattern]
  );
}

export async function updateItem(id: number, input: UpdateItemInput): Promise<ItemRow | undefined> {
  const setClauses: string[] = [];
  const values: unknown[] = [];
  if (input.name !== undefined) {
    setClauses.push(`name = $${setClauses.length + 1}`);
    values.push(input.name);
  }
  if (input.description !== undefined) {
    setClauses.push(`description = $${setClauses.length + 1}`);
    values.push(input.description);
  }
  if (input.rarity !== undefined) {
    setClauses.push(`rarity = $${setClauses.length + 1}`);
    values.push(input.rarity);
  }
  if (input.slots !== undefined) {
    setClauses.push(`slots = $${setClauses.length + 1}`);
    values.push(input.slots);
  }
  if (input.asset_url !== undefined) {
    setClauses.push(`asset_url = $${setClauses.length + 1}`);
    values.push(input.asset_url);
  }
  if (input.active !== undefined) {
    setClauses.push(`active = $${setClauses.length + 1}`);
    values.push(input.active);
  }
  if (setClauses.length === 0) return findItemById(id);
  const fields = [...setClauses, `updated_at = NOW()`];
  const sql = `UPDATE items SET ${fields.join(", ")} WHERE id = $${setClauses.length + 1}
    RETURNING id, name, description, rarity, slots, asset_url, active, created_at, updated_at`;
  values.push(id);
  return queryOne<ItemRow>(sql, values);
}

export async function deleteItem(id: number): Promise<ItemRow | undefined> {
  return queryOne<ItemRow>(
    `DELETE FROM items WHERE id = $1 RETURNING id, name, description, rarity, slots, asset_url, active, created_at, updated_at`,
    [id]
  );
}
