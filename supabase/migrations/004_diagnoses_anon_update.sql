-- Allow anon update so analyze/email can patch report without service role
create policy diagnoses_anon_update
on public.diagnoses
for update
to anon, authenticated
using (true)
with check (true);
