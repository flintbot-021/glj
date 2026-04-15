-- PostgREST matches RPC calls to Postgresql functions by signature. JSON payloads map
-- cleanly to all-text arguments; we parse uuid/numeric inside (avoids "schema cache" / type mismatch).
-- Run this on the project if wallet credits still fail after earlier migrations.

drop function if exists public.admin_apply_wallet_credit (uuid, numeric, text);
drop function if exists public.admin_apply_wallet_credit (numeric, text, uuid);
drop function if exists public.admin_apply_wallet_credit (text, text, text);

create or replace function public.admin_apply_wallet_credit (
  p_amount text,
  p_note text,
  p_player_id text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_amt numeric;
  v_player uuid;
  v_note text;
begin
  if not public.is_admin () then
    raise exception 'not authorized';
  end if;

  begin
    v_amt := trim(coalesce(p_amount, ''))::numeric;
  exception
    when others then
      raise exception 'invalid amount';
  end;

  if v_amt is null or v_amt <= 0 then
    raise exception 'amount must be positive';
  end if;

  begin
    v_player := trim(coalesce(p_player_id, ''))::uuid;
  exception
    when others then
      raise exception 'invalid player id';
  end;

  v_note := nullif(trim(coalesce(p_note, '')), '');

  insert into public.wallet_transactions (player_id, amount, type, note)
  values (v_player, v_amt, 'admin_credit', v_note)
  returning id into v_id;

  update public.profiles
  set wallet_balance = wallet_balance + v_amt
  where id = v_player;

  if not found then
    raise exception 'player not found';
  end if;

  return v_id;
end;
$$;

grant execute on function public.admin_apply_wallet_credit (text, text, text) to authenticated;
grant execute on function public.admin_apply_wallet_credit (text, text, text) to anon;

comment on function public.admin_apply_wallet_credit (text, text, text) is
  'Admin-only: records admin_credit and increases wallet_balance. Text args for PostgREST matching.';

-- Non-destructive idempotent policies (fallback when RPC is down or not yet cached)
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

-- Hint PostgREST to reload (works on many Supabase/PostgREST deployments)
select pg_notify('pgrst', 'reload schema');
