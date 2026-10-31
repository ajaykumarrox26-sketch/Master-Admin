/*
# Launcher: Account Linking and Transaction Management

## Purpose
Adds tables to support a launcher interface where users can:
1. Log in (existing auth flow)
2. Link external accounts to their profile
3. Manage transactions (demo) for linked accounts

## New Tables

### linked_accounts
- id (uuid, primary key)
- user_id (uuid, not null, references auth.users, defaults to auth.uid())
- account_label (text, not null) — friendly name for the linked account
- provider (text, not null) — e.g. "bank", "wallet", "upi", "card"
- account_ref (text, not null) — masked reference identifier (demo)
- status (text, not null, default "active") — "active" | "unverified" | "revoked"
- created_at (timestamptz, default now())

### account_transactions
- id (uuid, primary key)
- user_id (uuid, not null, references auth.users, defaults to auth.uid())
- linked_account_id (uuid, references linked_accounts, nullable, on delete set null)
- type (text, not null) — "credit" | "debit"
- amount_inr (numeric, not null)
- description (text, not null)
- status (text, not null, default "completed") — "pending" | "completed" | "failed"
- created_at (timestamptz, default now())

## Security
- RLS enabled on both tables.
- Owner-scoped CRUD via auth.uid() = user_id.
- Grants only to authenticated (the app has sign-in).
- No service_role grant needed (no edge functions touch these tables).
*/

CREATE TABLE IF NOT EXISTS linked_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  account_label text NOT NULL,
  provider text NOT NULL DEFAULT 'bank',
  account_ref text NOT NULL,
  status text NOT NULL DEFAULT 'unverified',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE linked_accounts ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON linked_accounts TO authenticated;

DROP POLICY IF EXISTS "select_own_linked_accounts" ON linked_accounts;
CREATE POLICY "select_own_linked_accounts" ON linked_accounts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_linked_accounts" ON linked_accounts;
CREATE POLICY "insert_own_linked_accounts" ON linked_accounts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_linked_accounts" ON linked_accounts;
CREATE POLICY "update_own_linked_accounts" ON linked_accounts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_linked_accounts" ON linked_accounts;
CREATE POLICY "delete_own_linked_accounts" ON linked_accounts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS account_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  linked_account_id uuid REFERENCES linked_accounts(id) ON DELETE SET NULL,
  type text NOT NULL DEFAULT 'credit',
  amount_inr numeric NOT NULL DEFAULT 0,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE account_transactions ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON account_transactions TO authenticated;

DROP POLICY IF EXISTS "select_own_transactions" ON account_transactions;
CREATE POLICY "select_own_transactions" ON account_transactions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_transactions" ON account_transactions;
CREATE POLICY "insert_own_transactions" ON account_transactions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_transactions" ON account_transactions;
CREATE POLICY "update_own_transactions" ON account_transactions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_transactions" ON account_transactions;
CREATE POLICY "delete_own_transactions" ON account_transactions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_linked_accounts_user_id ON linked_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_account_transactions_user_id ON account_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_account_transactions_created_at ON account_transactions(created_at DESC);
