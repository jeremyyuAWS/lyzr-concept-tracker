/*
  # Create Session Tracking Functions and Tables

  1. New Tables
    - `user_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `session_start` (timestamptz)
      - `session_end` (timestamptz)
      - `user_agent` (text)
      - `ip_address` (inet)
      - `referrer` (text)
      - `duration_ms` (bigint)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `user_sessions` table
    - Add policies for authenticated users to manage their own sessions

  3. Functions
    - `start_user_session()` - Creates a new session and returns session ID
    - `end_user_session()` - Ends a session and calculates duration
*/

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_start timestamptz DEFAULT now(),
  session_end timestamptz,
  user_agent text,
  ip_address inet,
  referrer text,
  duration_ms bigint,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_start ON user_sessions(session_start DESC);

-- Enable RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view their own sessions" ON user_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can create sessions" ON user_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users can update their own sessions" ON user_sessions
  FOR UPDATE USING (user_id = auth.uid());

-- Function to start a user session
CREATE OR REPLACE FUNCTION start_user_session(
  p_user_agent text DEFAULT NULL,
  p_ip_address text DEFAULT NULL,
  p_referrer text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  new_session_id uuid;
BEGIN
  INSERT INTO user_sessions (user_id, user_agent, ip_address, referrer)
  VALUES (auth.uid(), p_user_agent, p_ip_address::inet, p_referrer)
  RETURNING id INTO new_session_id;
  RETURN new_session_id;
END;
$$ LANGUAGE plpgsql;

-- Function to end a user session
CREATE OR REPLACE FUNCTION end_user_session(
  p_session_id uuid
)
RETURNS void AS $$
BEGIN
  UPDATE user_sessions
  SET
    session_end = now(),
    duration_ms = EXTRACT(EPOCH FROM (now() - session_start)) * 1000
  WHERE id = p_session_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql;