-- Scope Mini CRM: Default Seed User & Credentials
-- Email: admin@scopecrm.com
-- Password: Admin@123456

do $$
declare
  v_user_id uuid := '00000000-0000-0000-0000-000000000001';
  v_encrypted_pw text;
begin
  -- Generate bcrypt hash for Admin@123456
  v_encrypted_pw := extensions.crypt('Admin@123456', extensions.gen_salt('bf'));

  -- Insert default user if not exists
  if not exists (select 1 from auth.users where id = v_user_id or email = 'admin@scopecrm.com') then
    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'admin@scopecrm.com',
      v_encrypted_pw,
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"مدير النظام"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    -- Ensure identity record exists for email login
    insert into auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) values (
      v_user_id,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'admin@scopecrm.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  end if;
end;
$$;
