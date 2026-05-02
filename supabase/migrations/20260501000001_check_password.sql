create or replace function public.user_has_password(user_email text)
returns boolean
language sql security definer
as $$
  select encrypted_password is not null and encrypted_password != ''
  from auth.users
  where email = user_email
  limit 1;
$$;
