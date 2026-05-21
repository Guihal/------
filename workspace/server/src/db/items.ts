import { query, queryOne } from "./client.ts";

export type Rarity = "common" | "rare" | "epic" | "legendary";

export interface ItemRow {
  id: number;
  name: string;
  description: string | null;
  rarity: Rarity;
  asset_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateItemInput {
  name: string;
  description?: string;
  rarity?: Rarity;
  asset_url?: string | null;
}

export interface UpdateItemInput {
  name?: string;
  description?: string | null;
  rarity?: Rarity;
  asset_url?: string | null;
}

export async function createItem(input: CreateItemInput): Promise<ItemRow> {
  const sql = `INSERT INTO items (name, description, rarity, asset_url)
    VALUES ($1, $2, $3, $4)
    RETURNING id, name, description, rarity, asset_url, created_at, updated_at`;
  const params = [
    input.name,
    input.description ?? null,
    input.rarity ?? "common",
    input.asset_url ?? null,
  ];
  const row = await queryOne<ItemRow>(sql, params);
  if (!row) throw new Error("Failed to create item");
  return row;
}

export async function findItemById(id: number): Promise<ItemRow | undefined> {
  return queryOne<ItemRow>(
    `SELECT id, name, description, rarity, asset_url, created_at, updated_at FROM items WHERE id = $1`,
    [id]
  );
}

export async function listItems(): Promise<ItemRow[]> {
  return query<ItemRow>(
    `SELECT id, name, description, rarity, asset_url, created_at, updated_at FROM items ORDER BY created_at DESC`
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
  if (input.asset_url !== undefined) {
    setClauses.push(`asset_url = $${setClauses.length + 1}`);
    values.push(input.asset_url);
  }
  if (setClauses.length === 0) return findItemById(id);
  const fields = [...setClauses, `updated_at = NOW()`];
  const sql = `UPDATE items SET ${fields.join(", ")} WHERE id = $${setClauses.length + 1}
    RETURNING id, name, description, rarity, asset_url, created_at, updated_at`;
  values.push(id);
  return queryOne<ItemRow>(sql, values);
}

export async function deleteItem(id: number): Promise<ItemRow | undefined> {
  return queryOne<ItemRow>(
    `DELETE FROM items WHERE id = $1 RETURNING id, name, description, rarity, asset_url, created_at, updated_at`,
    [id]
  );
}
