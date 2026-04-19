-- Drop the wagers-only FK so reference_id can hold both wager and team_wager UUIDs.
alter table public.wallet_transactions
  drop constraint wallet_transactions_reference_id_fkey;
