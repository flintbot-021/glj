-- PostgREST/Supabase match RPC by function name + argument types in a stable order. The previous
-- signature admin_apply_wallet_credit(uuid, numeric, text) did not match what the API gateway
-- resolves (see: p_amount numeric, p_note text, p_player_id uuid), causing "Could not find the
-- function ... in the schema cache" and leaving the client fallback to hit RLS on inserts.

drop function if exists public.admin_apply_wallet_credit (uuid, numeric, text);
drop function if exists public.admin_apply_wallet_credit (numeric, text, uuid);

create or replace function public.admin_apply_wallet_credit (
  p_amount numeric,
  p_note text default null,
  p_player_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.is_admin () then
    raise exception 'not authorized';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;

  insert into public.wallet_transactions (player_id, amount, type, note)
  values (p_player_id, p_amount, 'admin_credit', nullif(trim(coalesce(p_note, '')), ''))
  returning id into v_id;

  update public.profiles
  set wallet_balance = wallet_balance + p_amount
  where id = p_player_id;

  if not found then
    raise exception 'player not found';
  end if;

  return v_id;
end;
$$;

grant execute on function public.admin_apply_wallet_credit (numeric, text, uuid) to authenticated;
grant execute on function public.admin_apply_wallet_credit (numeric, text, uuid) to anon;

comment on function public.admin_apply_wallet_credit (numeric, text, uuid) is
  'Admin-only: records admin_credit and increases wallet_balance in one transaction.';

-- Idempotent: ensure admin fallback paths work if RPC is still caching.
drop policy if exists "Wallet transactions insert admin" on public.wallet_transactions;
drop policy if exists "Wallet transactions delete admin" on public.wallet_transactions;

create policy "Wallet transactions insert admin"
  on public.wallet_transactions for insert to authenticated
  with check (
    public.is_admin ()
    and type in ('admin_credit', 'admin_debit')
  );

create policy "Wallet transactions delete admin"
  on public.wallet_transactions for delete to authenticated
  using (public.is_admin ());
