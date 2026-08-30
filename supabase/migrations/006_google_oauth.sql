-- Google OAuth users have no password. NULL prevents the mailbox from being
-- authenticated with a dummy hash and keeps the login contract explicit.
ALTER TABLE users
  ALTER COLUMN password_hash DROP NOT NULL;

ALTER TABLE users
  ALTER COLUMN password_hash DROP DEFAULT;