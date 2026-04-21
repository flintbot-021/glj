-- Seed every player with R200 opening wallet credit.

insert into public.wallet_transactions (player_id, amount, type, note)
select id, 200.00, 'admin_credit', 'Opening balance'
from public.profiles;

update public.profiles set wallet_balance = 200.00;
