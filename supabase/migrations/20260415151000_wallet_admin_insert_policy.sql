-- Allow admins to insert admin_credit / admin_debit rows from the client when RPC is unavailable,
-- or as a secondary path. (Atomic balance updates still prefer admin_apply_wallet_credit RPC.)

create policy "Wallet transactions insert admin"
  on public.wallet_transactions for insert to authenticated
  with check (
    public.is_admin ()
    and type in ('admin_credit', 'admin_debit')
  );

create policy "Wallet transactions delete admin"
  on public.wallet_transactions for delete to authenticated
  using (public.is_admin ());
