import { query, queryOne } from "../../db/client.ts";

export interface SettingsRow {
  user_id: number;
  theme: string;
  language: string;
  notifications_enabled: boolean;
  reminder_time: string | null;
  created_at: Date;
  updated_at: Date;
}

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS settings (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'system',
  language TEXT NOT NULL DEFAULT 'en',
  notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  reminder_time TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);
`;

export async function ensureSettingsTable(): Promise<void> {
  await query(CREATE_TABLE_SQL);
}

export async function findSettingsByUserId(userId: number): Promise<SettingsRow | undefined> {
  return queryOne<SettingsRow>(
    `SELECT user_id, theme, language, notifications_enabled, reminder_time, created_at, updated_at
     FROM settings WHERE user_id = $1`,
    [userId]
  );
}

export async function createDefaultSettings(userId: number): Promise<SettingsRow> {
  const row = await queryOne<SettingsRow>(
    `INSERT INTO settings (user_id) VALUES ($1)
     RETURNING user_id, theme, language, notifications_enabled, reminder_time, created_at, updated_at`,
    [userId]
  );
  if (!row) throw new Error("Failed to create settings");
  return row;
}

export async function getOrCreateSettings(userId: number): Promise<SettingsRow> {
  const existing = await findSettingsByUserId(userId);
  if (existing) return existing;
  return createDefaultSettings(userId);
}

export async function updateSettings(
  userId: number,
  updates: Partial<Omit<SettingsRow, "user_id" | "created_at" | "updated_at">>
): Promise<SettingsRow | undefined> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.theme !== undefined) {
    fields.push(`theme = $${fields.length + 1}`);
    values.push(updates.theme);
  }
  if (updates.language !== undefined) {
    fields.push(`language = $${fields.length + 1}`);
    values.push(updates.language);
  }
  if (updates.notifications_enabled !== undefined) {
    fields.push(`notifications_enabled = $${fields.length + 1}`);
    values.push(updates.notifications_enabled);
  }
  if (updates.reminder_time !== undefined) {
    fields.push(`reminder_time = $${fields.length + 1}`);
    values.push(updates.reminder_time);
  }

  if (fields.length === 0) return findSettingsByUserId(userId);

  fields.push(`updated_at = NOW()`);
  const sql = `UPDATE settings SET ${fields.join(", ")} WHERE user_id = $${fields.length}
    RETURNING user_id, theme, language, notifications_enabled, reminder_time, created_at, updated_at`;
  values.push(userId);

  return queryOne<SettingsRow>(sql, values);
}
