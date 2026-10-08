-- Infrastructure telemetry, for the platform console.
--
-- Scholr runs on the same physical hardware as Schedual: Proxmox hosts in one
-- room, one air conditioner, one NAS, one camera. Schedual's console has read
-- that hardware for months through collectors that push into its database;
-- these three tables are Scholr's side of the same arrangement, so its console
-- can answer "is the room on fire" without reaching into another product's
-- database.
--
-- Nothing here is written from the browser. Collectors running ON the hosts
-- push rows in with the service role — production never gets a path into the
-- hypervisor, the hypervisor only pushes numbers out. That direction is the
-- whole security design: a compromised web app cannot power-cycle a server
-- just because a page can draw its temperature.

-- ── server_metrics ──────────────────────────────────────────────────────
-- One row per host per collection, every 30 s.
create table if not exists public.server_metrics (
  id              bigserial primary key,
  server_id       text not null,              -- 'scholr-prod', 'infra-pve-1', …
  ts              timestamptz not null default now(),
  cpu_temp        numeric,                    -- °C, package
  ambient_temp    numeric,                    -- °C, inlet air as the BMC sees it
  gpu_temps       numeric[],
  ram_pct         numeric,
  cpu_load_pct    numeric,
  disk_pct        numeric,
  uptime_seconds  bigint,
  extra           jsonb not null default '{}'::jsonb
);

create index if not exists idx_server_metrics_server_ts
  on public.server_metrics (server_id, ts desc);
create index if not exists idx_server_metrics_ts
  on public.server_metrics (ts);

-- ── climate_samples ─────────────────────────────────────────────────────
-- One row per autopilot run: how warm the room was, what the unit was set to,
-- and what the chassis was drawing at that moment. Three numbers and a
-- timestamp, because that is what turns "28 °C is warm enough" from an
-- assertion into a cost curve.
create table if not exists public.climate_samples (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  inlet_c      numeric,
  set_point_c  numeric,
  outdoor_c    numeric,
  watts        numeric,
  fan_pct      numeric,
  power_on     boolean,
  mode         text,                          -- normal | free | drift | hard
  source       text
);

create index if not exists idx_climate_samples_time
  on public.climate_samples (created_at desc);

-- ── nas_status ──────────────────────────────────────────────────────────
-- One row every 10 minutes from a collector on the Proxmox host, carrying the
-- NAS VM's state and the age of the last off-site backup.
create table if not exists public.nas_status (
  id                  bigserial primary key,
  ts                  timestamptz not null default now(),
  vmid                int,
  vm_name             text,
  vm_status           text,
  uptime_seconds      bigint,
  cpu_pct             numeric,
  cpus                int,
  mem_used_bytes      bigint,
  mem_max_bytes       bigint,
  disks               jsonb not null default '[]'::jsonb,
  pool_used_pct       numeric,
  last_backup_at      timestamptz,
  last_backup_bytes   bigint,
  last_backup_object  text,
  backup_count        int,
  backups             jsonb not null default '[]'::jsonb,
  last_run_result     text,
  last_run_at         timestamptz,
  log_tail            text,
  web_url             text
);

create index if not exists idx_nas_status_ts on public.nas_status (ts desc);

-- ── Who may read ────────────────────────────────────────────────────────
-- RLS on, with one select policy for super admins and no write policy at all:
-- the collectors come in with the service role, which bypasses RLS, so there
-- is no policy here that a browser session could ever satisfy for a write.
--
-- server_metrics and climate_samples are readable directly because the console
-- draws them as charts. nas_status is not: it is only ever read through the
-- adminNas function, which turns a raw row into alerts.
alter table public.server_metrics  enable row level security;
alter table public.climate_samples enable row level security;
alter table public.nas_status      enable row level security;

drop policy if exists "server_metrics: super admin reads" on public.server_metrics;
create policy "server_metrics: super admin reads"
  on public.server_metrics for select to authenticated
  using (public.is_super_admin());

drop policy if exists "climate_samples: super admin reads" on public.climate_samples;
create policy "climate_samples: super admin reads"
  on public.climate_samples for select to authenticated
  using (public.is_super_admin());

drop policy if exists "nas_status: no tenant access" on public.nas_status;
create policy "nas_status: no tenant access"
  on public.nas_status for all to authenticated
  using (false) with check (false);

comment on table public.server_metrics is
  'Per-host CPU/inlet temperature and load, pushed by collectors on the hosts. Super admins read; only the service role writes.';
comment on table public.climate_samples is
  'One row per cooling-autopilot run: inlet, set point, outdoor, draw. The evidence behind the cooling band.';
comment on table public.nas_status is
  'NAS VM state and off-site backup age, pushed every 10 min from the Proxmox host. Read only through the adminNas function.';
