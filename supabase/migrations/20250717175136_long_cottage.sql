/*
  # Fix log_user_activity function

  1. New Functions
    - `log_user_activity` with parameters matching client call signature
    - Handles session-based activity logging with proper parameter mapping

  2. Changes
    - Creates overloaded function to match client-side call signature
    - Maps parameters correctly to activity_logs table structure
    - Maintains compatibility with existing logging functionality
*/

-- Create the log_user_activity function with the exact signature the client is calling
CREATE OR REPLACE FUNCTION log_user_activity(
  p_activity_data jsonb,
  p_activity_type text,
  p_resource_id uuid DEFAULT NULL,
  p_resource_type text DEFAULT 'general',
  p_session_id uuid DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO activity_logs (user_id, action, resource_type, resource_id, details)
  VALUES (
    auth.uid(),
    p_activity_type,
    p_resource_type,
    p_resource_id,
    jsonb_build_object(
      'activity_data', p_activity_data,
      'session_id', p_session_id
    )
  );
END;
$$ LANGUAGE plpgsql;