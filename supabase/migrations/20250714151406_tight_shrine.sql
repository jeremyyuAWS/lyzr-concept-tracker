/*
  # Fix user signup trigger

  This migration ensures that user profiles are automatically created when new users sign up.
  
  1. Creates the handle_new_user() function
  2. Creates the trigger that calls this function after new user insertion
  3. Adds admin role assignment for specific emails
*/

-- Create or replace the function to handle new user sign-ups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role text := 'user';
BEGIN
  -- Check if the email should have admin role
  IF NEW.email IN ('jeremy@lyzr.ai', 'admin@lyzr.ai') THEN
    user_role := 'admin';
  END IF;

  -- Insert new user profile
  INSERT INTO public.user_profiles (
    user_id, 
    email, 
    display_name, 
    role,
    created_at,
    updated_at
  ) VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    user_role,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists and recreate it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Create the update trigger function for user_profiles
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the update trigger for user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();