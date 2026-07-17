alter table profiles
add column if not exists preference_setup_completed boolean not null default false;
