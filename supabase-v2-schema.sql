-- GRC Risk Management V2 schema extension
-- Safe to run against the existing public.risks table.

alter table public.risks alter column category drop not null;
alter table public.risks alter column likelihood drop not null;
alter table public.risks alter column impact drop not null;
alter table public.risks alter column score drop not null;
alter table public.risks alter column level drop not null;
alter table public.risks alter column owner drop not null;

alter table public.risks add column if not exists scope_asset text;
alter table public.risks add column if not exists business_impact_types text[] default '{}';
alter table public.risks add column if not exists business_impact_summary text;
alter table public.risks add column if not exists submitted_by text;
alter table public.risks add column if not exists submitted_at timestamptz default now();
alter table public.risks add column if not exists communication_date timestamptz;
alter table public.risks add column if not exists risk_statement text;
alter table public.risks add column if not exists applicable_framework text default 'Not Determined';
alter table public.risks add column if not exists control_reference text;
alter table public.risks add column if not exists recommended_controls text;
alter table public.risks add column if not exists implementation_status text default 'Not Started';
alter table public.risks add column if not exists residual_likelihood integer;
alter table public.risks add column if not exists residual_impact integer;
alter table public.risks add column if not exists residual_score integer;
alter table public.risks add column if not exists residual_level text;

-- Existing legacy columns may remain during migration to avoid breaking deployed data.
-- The V2 application no longer uses threat, vulnerability, NIST CSF function, or NIST SP 800-53 mapping.

create table if not exists public.risk_audit_log (
  id uuid primary key default gen_random_uuid(),
  risk_id uuid references public.risks(id) on delete cascade,
  risk_code text not null,
  actor text not null,
  action text not null,
  field_name text,
  old_value text,
  new_value text,
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists risk_audit_log_risk_id_idx on public.risk_audit_log(risk_id);
create index if not exists risks_department_idx on public.risks(department);
create index if not exists risks_status_idx on public.risks(status);
create index if not exists risks_updated_at_idx on public.risks(updated_at desc);
