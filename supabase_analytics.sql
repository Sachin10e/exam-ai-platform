create table if not exists
  public.study_events (
    id uuid not null default extensions.uuid_generate_v4 (),
    user_id uuid not null,
    subject_id uuid null,
    unit_id text null,
    event_type text not null,
    duration integer null,
    score integer null,
    created_at timestamp with time zone not null default now(),
    constraint study_events_pkey primary key (id),
    constraint study_events_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade
  ) tablespace pg_default;

-- Enable RLS
alter table public.study_events enable row level security;

-- Policies
create policy "Users can insert their own events"
  on public.study_events
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can view their own events"
  on public.study_events
  for select
  to authenticated
  using (auth.uid() = user_id);
