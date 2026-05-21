import { pool } from "./client.ts";
import { CREATE_SCHEMA_SQL } from "./schema.ts";

export async function migrate(): Promise<void> {
  await pool.query(CREATE_SCHEMA_SQL);
}
