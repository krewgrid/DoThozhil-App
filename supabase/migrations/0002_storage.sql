-- Photos: check-out photos, dispute photos, licence photos and profile photos.
-- Private bucket. Paths always start with the uploader's user id:
--   <uid>/avatar/<file>      seen by any signed-in user (clients review applicants)
--   <uid>/checkout/<file>    seen by the worker, the job's client and admin
--   <uid>/disputes/<file>    seen by both parties of the booking and admin
--   <uid>/documents/<file>   seen by the worker and admin only

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create or replace function public.can_view_photo(p_path text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare owner_id text := split_part(p_path, '/', 1); kind text := split_part(p_path, '/', 2);
begin
  if auth.uid() is null then return false; end if;
  if owner_id = auth.uid()::text or is_admin() then return true; end if;
  if kind = 'avatar' then return true; end if;
  if kind = 'checkout' then
    return exists (select 1 from bookings b join jobs j on j.id = b.job_id
                   where b.check_out_photo = p_path and j.client_id = auth.uid());
  end if;
  if kind = 'disputes' then
    return exists (select 1 from disputes d join bookings b on b.id = d.booking_id join jobs j on j.id = b.job_id
                   where d.photo_path = p_path and (b.worker_id = auth.uid() or j.client_id = auth.uid()));
  end if;
  return false;
end $$;
grant execute on function public.can_view_photo(text) to authenticated;

create policy "photos upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and split_part(name, '/', 1) = auth.uid()::text);
create policy "photos replace own" on storage.objects for update to authenticated
  using (bucket_id = 'photos' and split_part(name, '/', 1) = auth.uid()::text);
create policy "photos read allowed" on storage.objects for select to authenticated
  using (bucket_id = 'photos' and public.can_view_photo(name));
