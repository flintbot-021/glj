-- Atomic admin wallet credit: insert ledger row + bump profiles.wallet_balance (RLS has no wallet insert policy for clients)

create or replace function public.admin_apply_wallet_credit (
  p_player_id uuid,
  p_amount numeric,
  p_note text default null
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
  values (p_player_id, p_amount, 'admin_credit', nullif(trim(p_note), ''))
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

grant execute on function public.admin_apply_wallet_credit (uuid, numeric, text) to authenticated;

comment on function public.admin_apply_wallet_credit (uuid, numeric, text) is
  'Admin-only: records admin_credit and increases wallet_balance in one transaction.';
