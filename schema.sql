-- Run this in your Supabase SQL Editor
-- WARNING: This will DROP existing tables to apply the new ID format. All existing test data will be lost.

DROP TABLE IF EXISTS work_assignments;
DROP TABLE IF EXISTS works;

-- 1. Create works table with TEXT id
CREATE TABLE IF NOT EXISTS works (
  id text PRIMARY KEY,
  client_id text NOT NULL,
  work_name text NOT NULL,
  instruction text NOT NULL,
  total_slots int NOT NULL,
  available_slots int NOT NULL,
  number_of_days int NOT NULL,
  location text NOT NULL,
  date_of_work date NOT NULL,
  reporting_time time NOT NULL,
  completion_time time NOT NULL,
  payment_amount int NOT NULL,
  payment_date date NOT NULL,
  status text DEFAULT 'Active',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Trigger to Auto-Generate Sequential ID
CREATE OR REPLACE FUNCTION set_sequential_work_id()
RETURNS trigger AS $$
DECLARE
  v_count int;
BEGIN
  -- Count how many works this client has already posted
  SELECT COUNT(*) INTO v_count FROM works WHERE client_id = NEW.client_id;
  
  -- Generate ID like: username_00001
  NEW.id := NEW.client_id || '_' || LPAD((v_count + 1)::text, 5, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER works_set_id
BEFORE INSERT ON works
FOR EACH ROW
EXECUTE FUNCTION set_sequential_work_id();

CREATE TABLE IF NOT EXISTS work_assignments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  work_id text REFERENCES works(id) ON DELETE CASCADE,
  worker_id text NOT NULL,
  slots_consumed int DEFAULT 1 NOT NULL,
  friend_names text[] DEFAULT '{}'::text[],
  status text DEFAULT 'Confirmed',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(work_id, worker_id) -- Prevent the same worker from joining twice
);

-- 4. Setup Row Level Security (RLS)
ALTER TABLE works ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON works FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON works FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON work_assignments FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON work_assignments FOR INSERT WITH CHECK (true);

-- 5. Create an RPC function to safely join a work with friends
CREATE OR REPLACE FUNCTION join_work_with_friends(p_work_id text, p_worker_id text, p_slots int, p_friend_names text[])
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_available int;
BEGIN
  -- Check available slots, locking the row for update
  SELECT available_slots INTO v_available FROM works WHERE id = p_work_id FOR UPDATE;

  IF v_available >= p_slots THEN
    -- Insert the assignment
    INSERT INTO work_assignments (work_id, worker_id, slots_consumed, friend_names, status) 
    VALUES (p_work_id, p_worker_id, p_slots, p_friend_names, 'Confirmed');
    
    -- Decrement the slots
    UPDATE works SET available_slots = available_slots - p_slots WHERE id = p_work_id;
    
    RETURN true;
  ELSE
    RETURN false; -- Not enough slots left
  END IF;
EXCEPTION WHEN unique_violation THEN
  -- User already joined
  RETURN false;
END;
$$;

-- Force Supabase to refresh its API cache immediately so the function becomes available
NOTIFY pgrst, 'reload schema';

-- 6. Create RPC function to check username availability
CREATE OR REPLACE FUNCTION check_username_available(p_username text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count int;
BEGIN
  -- We must check the raw JSON metadata since usernames are stored there
  SELECT COUNT(*) INTO v_count
  FROM auth.users
  WHERE raw_user_meta_data->>'username' = p_username;
  
  RETURN v_count = 0;
END;
$$;

-- 7. Create RPC function to check phone/whatsapp availability
CREATE OR REPLACE FUNCTION check_phone_whatsapp_available(p_phone text, p_whatsapp text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count int;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM auth.users
  WHERE raw_user_meta_data->>'contact_number' = p_phone
     OR raw_user_meta_data->>'whatsapp_number' = p_whatsapp;
  
  RETURN v_count = 0;
END;
$$;

-- 8. Create RPC function for client to mark a work as paid
CREATE OR REPLACE FUNCTION mark_work_paid(p_work_id text, p_client_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE works 
  SET status = 'Paid' 
  WHERE id = p_work_id AND client_id = p_client_id AND status = 'Active';
  
  -- If rows were updated, FOUND is true
  IF FOUND THEN
    UPDATE work_assignments
    SET status = 'Paid'
    WHERE work_id = p_work_id;
    
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$;

-- 9. Create RPC function to count how many users used a specific referral code
CREATE OR REPLACE FUNCTION get_referral_count(p_ref_code text)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count int;
BEGIN
  IF p_ref_code IS NULL OR p_ref_code = '' THEN
    RETURN 0;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM auth.users
  WHERE raw_user_meta_data->>'referral_code_used' = p_ref_code;
  
  RETURN v_count;
END;
$$;

-- 10. Create platform_reports table for disputes and no-shows
CREATE TABLE IF NOT EXISTS platform_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL, -- 'NoShow' or 'Dispute'
  work_id text REFERENCES works(id) ON DELETE CASCADE,
  reporter_id text NOT NULL,
  target_id text NOT NULL,
  description text,
  proof_url text,
  status text DEFAULT 'Pending', -- 'Pending', 'Resolved', 'Dismissed'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE platform_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON platform_reports FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON platform_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for admins" ON platform_reports FOR UPDATE USING (
  (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE email = current_user) = 'admin'
);
