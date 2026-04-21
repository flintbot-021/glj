-- Clear all transactional game data for production launch.
-- Keeps: profiles, seasons, groups, group_memberships, sub_seasons, tour reference data.
-- Removes: matchplay results, strokeplay rounds, wagers, wallet ledger, activity feed,
--          notifications, bonus point awards, knockout results.
-- Also resets all wallet balances to 0.

truncate table public.activity_feed      restart identity cascade;
truncate table public.notifications      restart identity cascade;
truncate table public.wallet_transactions restart identity cascade;
truncate table public.wagers             restart identity cascade;
truncate table public.bonus_point_awards restart identity cascade;
truncate table public.strokeplay_rounds  restart identity cascade;
truncate table public.matchplay_results  restart identity cascade;
truncate table public.knockout_fixtures  restart identity cascade;

-- Reset all player wallet balances to zero
update public.profiles set wallet_balance = 0;
