-- IMPORTANT: Run this only when Supabase Auth is enabled.
-- It replaces demo public CRUD with authenticated department segregation.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('Cybersecurity GRC','Director','Manager')),
  department text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.risks enable row level security;
alter table public.risk_audit_log enable row level security;

-- Remove demo policies before enabling production-style policies.
drop policy if exists "Allow public read risks" on public.risks;
drop policy if exists "Allow public insert risks" on public.risks;
drop policy if exists "Allow public update risks" on public.risks;
drop policy if exists "Allow public delete risks" on public.risks;

create policy "Users can read own profile"
on public.profiles for select to authenticated
using (id = auth.uid());

create policy "GRC can view all risks"
on public.risks for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'Cybersecurity GRC'));

create policy "Management can view department risks"
on public.risks for select to authenticated
using (exists (
  select 1 from public.profiles p
  where p.id = auth.uid()
    and p.role in ('Director','Manager')
    and p.department = risks.department
));

create policy "Management can submit department risks"
on public.risks for insert to authenticated
with check (exists (
  select 1 from public.profiles p
  where p.id = auth.uid()
    and p.role in ('Director','Manager')
    and p.department = risks.department
));

create policy "GRC can update all risks"
on public.risks for update to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'Cybersecurity GRC'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'Cybersecurity GRC'));

create policy "GRC can delete risks"
on public.risks for delete to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'Cybersecurity GRC'));

create policy "GRC can view audit log"
on public.risk_audit_log for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'Cybersecurity GRC'));

create policy "Authenticated users can append audit events"
on public.risk_audit_log for insert to authenticated
with check (auth.uid() is not null);
