/**
 * The calendar's tables.
 *
 * `start_utc` and `end_utc` are the **wire** instants — what the source sent,
 * not a device-local reinterpretation. For a timed event they are also what
 * range queries filter on. For an all-day event they are neither meaningful
 * nor used for filtering: an all-day event names a calendar date, so it
 * carries `start_date`/`end_date` and is filtered on those. `start_utc` stays
 * populated on every row only because it is a stable, zone-independent
 * primary-key component and a coarse sort key.
 *
 * `end_date` is exclusive. iCal `DTEND` already is for DATE values; the TEC
 * feed gives `23:59:59` on the final day and is normalised on write.
 *
 * `event_tag` is one table with an `axis` column rather than one table per
 * axis: the facet query is then a single statement parameterised by axis,
 * multi-axis filtering is a self-join instead of two different joins, and a
 * third axis later is a row rather than a migration.
 */
export const CALENDAR_CREATE_SQL = `
create table event (
  source_id   text not null,
  event_key   text not null,
  source_rank integer not null,
  dedupe_key  text not null,
  title       text not null,
  location    text,
  wire        text not null,
  primary key (source_id, event_key)
);
create index event_dedupe on event (dedupe_key);

create table occurrence (
  source_id  text not null,
  event_key  text not null,
  all_day    integer not null,
  start_utc  integer not null,
  end_utc    integer not null,
  start_date text,
  end_date   text,
  primary key (source_id, event_key, start_utc),
  foreign key (source_id, event_key) references event on delete cascade
);
create index occurrence_range on occurrence (start_utc, end_utc);
create index occurrence_dates on occurrence (start_date, end_date);

create table event_tag (
  source_id text not null,
  event_key text not null,
  axis      text not null,
  value     text not null,
  primary key (source_id, event_key, axis, value),
  foreign key (source_id, event_key) references event on delete cascade
);
create index event_tag_lookup on event_tag (axis, value);

create view visible_event as
select * from (
  select *, row_number() over (partition by dedupe_key order by source_rank, event_key) rn
  from event
) where rn = 1;`
