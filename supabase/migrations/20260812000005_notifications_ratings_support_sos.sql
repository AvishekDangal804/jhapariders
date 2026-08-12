-- Phase 10: notifications, ratings, support tickets, SOS/emergency.
--
-- Fixes a real bug found while building this phase: ratings_insert_participant
-- (from the init migration) only allowed rating while ride.status = 'ride_completed'.
-- pay_for_ride() advances status to 'paid' once payment succeeds, so a passenger/
-- rider who pays first (the normal flow) would then be permanently unable to rate.
-- Widen the check to accept both 'ride_completed' and 'paid'.
drop policy if exists "ratings_insert_participant" on public.ratings;
create policy "ratings_insert_participant" on public.ratings
  for insert with check (
    rater_id = auth.uid()
    and exists (
      select 1 from public.rides r
      where r.id = ratings.ride_id
        and r.status in ('ride_completed', 'paid')
        and (r.passenger_id = auth.uid() or r.rider_id = auth.uid())
        and (ratee_id = r.passenger_id or ratee_id = r.rider_id)
    )
  );

-- submit_rating: validates the rater is a ride participant rating the other
-- participant, inserts the rating (RLS above double-enforces this), and
-- recomputes rider_profiles.rating_avg when the ratee is a rider.
create or replace function public.submit_rating(
  p_ride_id uuid,
  p_ratee_id uuid,
  p_stars smallint,
  p_review text default null
)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_ride record;
  v_rating_id uuid;
  v_new_avg numeric(3, 2);
begin
  if p_stars < 1 or p_stars > 5 then
    raise exception 'Rating must be between 1 and 5 stars';
  end if;

  select * into v_ride from public.rides where id = p_ride_id;
  if not found then
    raise exception 'Ride not found';
  end if;
  if v_ride.status not in ('ride_completed', 'paid') then
    raise exception 'Ride is not yet completed';
  end if;
  if v_ride.passenger_id <> auth.uid() and v_ride.rider_id <> auth.uid() then
    raise exception 'Not authorized';
  end if;
  if p_ratee_id <> v_ride.passenger_id and p_ratee_id <> v_ride.rider_id then
    raise exception 'Ratee is not a participant of this ride';
  end if;
  if p_ratee_id = auth.uid() then
    raise exception 'Cannot rate yourself';
  end if;

  insert into public.ratings (ride_id, rater_id, ratee_id, stars, review)
  values (p_ride_id, auth.uid(), p_ratee_id, p_stars, p_review)
  returning id into v_rating_id;

  if p_ratee_id = v_ride.rider_id then
    select round(avg(stars)::numeric, 2) into v_new_avg
    from public.ratings where ratee_id = p_ratee_id;

    update public.rider_profiles
    set rating_avg = coalesce(v_new_avg, rating_avg), updated_at = now()
    where user_id = p_ratee_id;
  end if;

  insert into public.notifications (user_id, type, title, body, data)
  values (
    p_ratee_id, 'rating', 'You received a new rating',
    p_stars::text || ' star' || (case when p_stars = 1 then '' else 's' end) ||
      case when p_review is not null and length(trim(p_review)) > 0 then ': ' || p_review else '' end,
    jsonb_build_object('ride_id', p_ride_id, 'rating_id', v_rating_id, 'stars', p_stars)
  );

  return v_rating_id;
end;
$$;

grant execute on function public.submit_rating(uuid, uuid, smallint, text) to authenticated;

-- create_support_ticket: thin validating wrapper so category/subject/description
-- are checked server-side before the row lands (RLS already permits direct
-- owner insert, but funnels through here for consistent validation + an
-- optional immediate first message stored as a support_messages row).
create or replace function public.create_support_ticket(
  p_category public.support_category,
  p_subject text,
  p_description text,
  p_ride_id uuid default null
)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_ticket_id uuid;
begin
  if length(trim(p_subject)) = 0 then
    raise exception 'Subject is required';
  end if;
  if length(trim(p_description)) = 0 then
    raise exception 'Description is required';
  end if;
  if p_ride_id is not null then
    if not exists (
      select 1 from public.rides
      where id = p_ride_id and (passenger_id = auth.uid() or rider_id = auth.uid())
    ) then
      raise exception 'Ride not found or not yours';
    end if;
  end if;

  insert into public.support_tickets (user_id, category, subject, description, ride_id)
  values (auth.uid(), p_category, trim(p_subject), trim(p_description), p_ride_id)
  returning id into v_ticket_id;

  insert into public.support_messages (ticket_id, sender_id, message)
  values (v_ticket_id, auth.uid(), trim(p_description));

  return v_ticket_id;
end;
$$;

grant execute on function public.create_support_ticket(public.support_category, text, text, uuid) to authenticated;

-- post_support_message: appends a message to an existing ticket (owner or
-- admin), reopens a resolved/closed ticket when the owner replies, and
-- notifies the other side.
create or replace function public.post_support_message(p_ticket_id uuid, p_message text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_ticket record;
  v_message_id uuid;
  v_is_admin boolean;
begin
  if length(trim(p_message)) = 0 then
    raise exception 'Message cannot be empty';
  end if;

  select * into v_ticket from public.support_tickets where id = p_ticket_id for update;
  if not found then
    raise exception 'Ticket not found';
  end if;

  v_is_admin := public.is_admin();
  if not v_is_admin and v_ticket.user_id <> auth.uid() then
    raise exception 'Not authorized';
  end if;

  insert into public.support_messages (ticket_id, sender_id, message)
  values (p_ticket_id, auth.uid(), trim(p_message))
  returning id into v_message_id;

  if v_is_admin then
    update public.support_tickets
    set status = case when status in ('resolved', 'closed') then status else 'in_progress' end,
        assigned_to = coalesce(assigned_to, auth.uid()),
        updated_at = now()
    where id = p_ticket_id;

    insert into public.notifications (user_id, type, title, body, data)
    values (v_ticket.user_id, 'system', 'Support replied to your ticket', trim(p_message),
      jsonb_build_object('ticket_id', p_ticket_id));
  else
    update public.support_tickets
    set status = case when status in ('resolved', 'closed') then 'open' else status end,
        updated_at = now()
    where id = p_ticket_id;
  end if;

  return v_message_id;
end;
$$;

grant execute on function public.post_support_message(uuid, text) to authenticated;

-- update_support_ticket_status: admin-only status transitions, with a
-- notification back to the ticket owner.
create or replace function public.update_support_ticket_status(p_ticket_id uuid, p_status public.support_ticket_status)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_ticket record;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  select * into v_ticket from public.support_tickets where id = p_ticket_id for update;
  if not found then
    raise exception 'Ticket not found';
  end if;

  update public.support_tickets
  set status = p_status, assigned_to = coalesce(assigned_to, auth.uid()), updated_at = now()
  where id = p_ticket_id;

  insert into public.notifications (user_id, type, title, body, data)
  values (
    v_ticket.user_id, 'system', 'Support ticket updated',
    'Your ticket "' || v_ticket.subject || '" is now ' || p_status::text || '.',
    jsonb_build_object('ticket_id', p_ticket_id, 'status', p_status)
  );
end;
$$;

grant execute on function public.update_support_ticket_status(uuid, public.support_ticket_status) to authenticated;

-- report_emergency: SOS. Inserts the emergency_events row (RLS also enforces
-- ride participancy) and, critically, fans out a notification to every admin
-- so it can never silently fail into an unread ticket queue.
create or replace function public.report_emergency(
  p_ride_id uuid,
  p_lat double precision,
  p_lng double precision,
  p_description text default null
)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_ride record;
  v_event_id uuid;
  v_admin record;
begin
  select * into v_ride from public.rides where id = p_ride_id;
  if not found then
    raise exception 'Ride not found';
  end if;
  if v_ride.passenger_id <> auth.uid() and v_ride.rider_id <> auth.uid() then
    raise exception 'Not authorized';
  end if;

  insert into public.emergency_events (ride_id, user_id, lat, lng, description)
  values (p_ride_id, auth.uid(), p_lat, p_lng, p_description)
  returning id into v_event_id;

  for v_admin in select id from public.profiles where role = 'admin' loop
    insert into public.notifications (user_id, type, title, body, data)
    values (
      v_admin.id, 'system', 'SOS ALERT',
      'Emergency reported on an active ride. Immediate attention required.',
      jsonb_build_object('emergency_event_id', v_event_id, 'ride_id', p_ride_id)
    );
  end loop;

  return v_event_id;
end;
$$;

grant execute on function public.report_emergency(uuid, double precision, double precision, text) to authenticated;

-- acknowledge/resolve emergency: admin-only, notifies the reporter.
create or replace function public.update_emergency_status(p_event_id uuid, p_status public.emergency_status)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_event record;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  select * into v_event from public.emergency_events where id = p_event_id for update;
  if not found then
    raise exception 'Emergency event not found';
  end if;

  update public.emergency_events
  set status = p_status, resolved_at = case when p_status = 'resolved' then now() else resolved_at end
  where id = p_event_id;

  insert into public.notifications (user_id, type, title, body, data)
  values (
    v_event.user_id, 'system',
    case when p_status = 'resolved' then 'Your SOS alert was resolved' else 'Your SOS alert was acknowledged' end,
    'Our team is aware of your emergency report and is on it.',
    jsonb_build_object('emergency_event_id', p_event_id, 'status', p_status)
  );
end;
$$;

grant execute on function public.update_emergency_status(uuid, public.emergency_status) to authenticated;

-- mark_notification_read: lets a client mark a batch of its own notifications
-- read in one round trip (the UI previously did this via a direct per-row
-- update, which still works under RLS; this is a convenience batch RPC).
create or replace function public.mark_all_notifications_read()
returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.notifications set is_read = true where user_id = auth.uid() and is_read = false;
end;
$$;

grant execute on function public.mark_all_notifications_read() to authenticated;

do $$ begin
  alter publication supabase_realtime add table public.emergency_events;
exception when duplicate_object then null; end $$;

alter table public.emergency_events replica identity full;
-- Needed so realtime UPDATE payloads include payload.old.is_read (used by
-- the notification bell badge to detect read-state transitions).
alter table public.notifications replica identity full;