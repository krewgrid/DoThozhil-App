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

-- 3. Create work_assignments table referencing the new text ID
CREATE TABLE IF NOT EXISTS work_assignments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  work_id text REFERENCES works(id) ON DELETE CASCADE,
  worker_id text NOT NULL,
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

-- 5. Create an RPC function to safely join a work (using text ID)
CREATE OR REPLACE FUNCTION join_work(p_work_id text, p_worker_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_available int;
BEGIN
  -- Check available slots, locking the row for update
  SELECT available_slots INTO v_available FROM works WHERE id = p_work_id FOR UPDATE;

  IF v_available > 0 THEN
    -- Insert the assignment
    INSERT INTO work_assignments (work_id, worker_id, status) VALUES (p_work_id, p_worker_id, 'Confirmed');
    
    -- Decrement the slot
    UPDATE works SET available_slots = available_slots - 1 WHERE id = p_work_id;
    
    RETURN true;
  ELSE
    RETURN false; -- No slots left
  END IF;
EXCEPTION WHEN unique_violation THEN
  -- User already joined
  RETURN false;
END;
$$;

-- Force Supabase to refresh its API cache immediately so the function becomes available
NOTIFY pgrst, 'reload schema';
