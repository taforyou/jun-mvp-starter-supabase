-- Create user_profiles table
CREATE TABLE user_profiles
(
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  line_user_id TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  picture_url TEXT,
  description TEXT,
  created_at TIMESTAMP
  WITH TIME ZONE DEFAULT NOW
  (),
  last_login TIMESTAMP
  WITH TIME ZONE DEFAULT NOW
  (),
  providers JSONB DEFAULT '{}',
  CONSTRAINT unique_line_user_id UNIQUE
  (line_user_id)
);

  -- Enable RLS
  ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

  -- Create policies
  CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR
  SELECT USING (auth.uid() = id);

  CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR
  UPDATE USING (auth.uid()
  = id);

  -- Allow service role to insert/update during authentication
  CREATE POLICY "Service role can manage profiles" ON user_profiles
  FOR ALL USING
  (
    auth.role
  () = 'service_role'
  );

  -- Create indexes for performance
  CREATE INDEX idx_user_profiles_line_user_id ON user_profiles(line_user_id);
  CREATE INDEX idx_user_profiles_last_login ON user_profiles(last_login); 