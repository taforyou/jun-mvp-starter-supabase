# Supabase Setup Guide

## Environment Variables Setup

### Client Environment Variables (.env.local)

Add these variables to your `.env.local` file:

```bash
# LINE LIFF Configuration
NEXT_PUBLIC_LINE_LIFF_ID=your_line_liff_id_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Edge Function Environment Variables

Set these in your Supabase project settings:

```bash
# LINE Channel Configuration
LINE_CHANNEL_ID=your_line_channel_id

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## How to Get These Values

### Supabase Variables

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the Project URL for `SUPABASE_URL`
4. Copy the anon public key for `SUPABASE_ANON_KEY`
5. Copy the service_role secret key for `SUPABASE_SERVICE_ROLE_KEY`

### LINE Variables

1. Go to LINE Developers Console
2. Select your channel
3. Copy the Channel ID for `LINE_CHANNEL_ID`
4. Copy the LIFF ID for `NEXT_PUBLIC_LINE_LIFF_ID`

## Database Setup

1. Create a new Supabase project
2. Run the migration SQL:

```sql
-- Create user_profiles table
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  line_user_id TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  picture_url TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  providers JSONB DEFAULT '{}',
  CONSTRAINT unique_line_user_id UNIQUE (line_user_id)
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow service role to manage profiles
CREATE POLICY "Service role can manage profiles" ON user_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- Create indexes for performance
CREATE INDEX idx_user_profiles_line_user_id ON user_profiles(line_user_id);
CREATE INDEX idx_user_profiles_last_login ON user_profiles(last_login);
```

## Edge Function Setup

1. Install Supabase CLI:

```bash
npm install -g supabase
```

2. Initialize Supabase in your project:

```bash
supabase init
```

3. Set environment variables:

```bash
supabase secrets set LINE_CHANNEL_ID=your_line_channel_id
```

4. Deploy the edge function:

```bash
supabase functions deploy authenticate-line-user
```

## Testing the Setup

1. Start your Next.js development server
2. Try to log in with LINE
3. Check the Supabase dashboard for new users and profiles
4. Verify the authentication flow works end-to-end

## Troubleshooting

### Common Issues

1. **Edge Function not found**: Make sure you've deployed the function and set the correct environment variables
2. **Database connection errors**: Verify your Supabase URL and service role key are correct
3. **LINE token verification fails**: Check your LINE Channel ID and ensure the LIFF app is properly configured
4. **RLS policies blocking access**: Make sure the service role policy is created for user profile management
