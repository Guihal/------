-- +goose Up
ALTER TABLE sessions ADD COLUMN family_id uuid NOT NULL DEFAULT gen_random_uuid();

CREATE INDEX sessions_family_idx ON sessions(family_id);
CREATE UNIQUE INDEX sessions_refresh_token_hash_unique_idx ON sessions(refresh_token_hash);

-- +goose Down
DROP INDEX IF EXISTS sessions_refresh_token_hash_unique_idx;
DROP INDEX IF EXISTS sessions_family_idx;
ALTER TABLE sessions DROP COLUMN IF EXISTS family_id;
