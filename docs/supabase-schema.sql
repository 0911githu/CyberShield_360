-- CyberShield 360 Supabase schema

create extension if not exists pgcrypto;

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  name text not null,
  type text not null,
  environment text not null default 'production',
  owner text,
  ip_address text,
  hostname text,
  criticality text not null default 'medium',
  status text not null default 'monitored',
  monitoring_enabled boolean not null default true,
  scan_interval_minutes integer not null default 60,
  tags text[] not null default '{}',
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.networks (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  name text not null,
  cidr text not null,
  authorised boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vulnerabilities (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references public.assets(id) on delete cascade,
  org_id text not null,
  title text not null,
  severity text not null,
  score numeric,
  cve text,
  description text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  asset_id uuid references public.assets(id) on delete set null,
  title text not null,
  severity text not null,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  asset_id uuid references public.assets(id) on delete set null,
  title text not null,
  severity text not null,
  status text not null default 'investigating',
  opened_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  asset_id uuid references public.assets(id) on delete set null,
  event_type text not null,
  severity text not null,
  source text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_assets_org_id on public.assets(org_id);
create index if not exists idx_networks_org_id on public.networks(org_id);
create index if not exists idx_vulnerabilities_org_id on public.vulnerabilities(org_id);
create index if not exists idx_alerts_org_id on public.alerts(org_id);
create index if not exists idx_incidents_org_id on public.incidents(org_id);
create index if not exists idx_security_events_org_id on public.security_events(org_id);

create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_assets_updated_at
before update on public.assets
for each row execute procedure public.update_updated_at();

create trigger set_networks_updated_at
before update on public.networks
for each row execute procedure public.update_updated_at();

create trigger set_vulnerabilities_updated_at
before update on public.vulnerabilities
for each row execute procedure public.update_updated_at();

create trigger set_alerts_updated_at
before update on public.alerts
for each row execute procedure public.update_updated_at();

create trigger set_incidents_updated_at
before update on public.incidents
for each row execute procedure public.update_updated_at();
