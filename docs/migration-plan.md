# Migration Plan: Firebase to Supabase Authentication

## Overview

Migrate the authentication system from Firebase to Supabase while maintaining the same LINE Login integration methodology. Instead of using Supabase's native auth providers, we'll create a custom authentication flow similar to the current Firebase approach.

## Current Firebase Flow

1. **LIFF Initialization** - Initialize LINE LIFF SDK
2. **LINE Login** - User authenticates with LINE, gets tokens
3. **Firebase Integration** - Send LINE token to Firebase Cloud Function
   - Cloud Function verifies LINE token
   - Creates/updates user in Firestore
   - Returns Firebase custom token
4. **User Session** - Sign in with Firebase custom token, load user profile
5. **Logout** - Sign out from both Firebase and LINE

## New Supabase Flow

### Step 1: LIFF Initialization (✅ No Changes)

- Keep existing LIFF initialization logic
- Continue to check if user is logged in to LINE

### Step 2: LINE Login (✅ No Changes)

- Keep existing LINE login flow
- Continue to get LINE ID/access tokens

### Step 3: Supabase Integration (✅ COMPLETED)

**Created Supabase Edge Function** (`authenticate-line-user`)

- **Input**: LINE token (ID or access token)
- **Process**:
  1. Verify LINE token with LINE API
  2. Extract user information (userId, displayName, pictureUrl, email)
  3. Generate fake email if no real email: `line_${userId}@line.local`
  4. Create/update user in Supabase auth.users table using fake email
  5. Generate a temporary password or use Supabase's signInWithPassword
  6. Create/update user profile in custom users table
  7. Return session credentials (email + password)

### Step 4: User Session (✅ COMPLETED)

**Updated AuthContext**

- Replaced Firebase auth with Supabase auth client
- Use returned credentials to sign in to Supabase
- Load user profile from Supabase database
- Maintain session state

### Step 5: Logout Process (✅ COMPLETED)

- Sign out from Supabase auth
- Clear LINE session
- Clear local state

## Implementation Status

### Phase 1: Setup Supabase (✅ COMPLETED)

1. Create Supabase project
2. Set up database schema for user profiles
3. Configure environment variables

### Phase 2: Create Edge Function (✅ COMPLETED)

1. Create Supabase Edge Function for LINE authentication
2. Implement LINE token verification
3. Implement user creation/update logic
4. Return session credentials

### Phase 3: Update Client Code (✅ COMPLETED)

1. Install Supabase client libraries
2. Create Supabase client configuration
3. Update AuthContext to use Supabase instead of Firebase
4. Update authentication hooks and functions
5. Update user data management
6. Create TypeScript types

### Phase 4: Database Migration (⚠️ PENDING DEPLOYMENT)

1. Create user profile schema in Supabase
2. Update data access functions
3. Deploy database schema to Supabase project
4. Test data operations

### Phase 5: Testing & Cleanup (🔄 IN PROGRESS)

1. Set up Supabase project and environment variables
2. Deploy Edge Function
3. Test complete authentication flow
4. Handle error cases
5. Clean up Firebase dependencies (optional for comparison)

## Next Steps

1. **Create Supabase Project**

   - Go to https://supabase.com
   - Create a new project
   - Note down the project URL and API keys

2. **Set Environment Variables**

   - Add Supabase credentials to `.env.local`
   - Set up Edge Function environment variables

3. **Deploy Database Schema**

   ```sql
   -- Run this in Supabase SQL Editor
   -- (see SUPABASE_SETUP.md for full schema)
   ```

4. **Deploy Edge Function**

   ```bash
   supabase functions deploy authenticate-line-user
   ```

5. **Test Authentication Flow**
   - Start development server
   - Try LINE login
   - Verify user creation in Supabase

## Files Created/Modified

### New Files

- [x] `src/lib/supabase.ts` - Supabase client and auth functions
- [x] `src/types/database.ts` - TypeScript database types
- [x] `supabase/functions/authenticate-line-user/index.ts` - Edge Function
- [x] `supabase/migrations/001_create_user_profiles.sql` - Database schema
- [x] `supabase/config.toml` - Supabase configuration
- [x] `SUPABASE_SETUP.md` - Setup documentation

### Modified Files

- [x] `src/contexts/AuthContext.tsx` - Updated to use Supabase
- [x] `package.json` - Added Supabase dependencies and scripts

### Files to Keep (for comparison)

- `src/lib/firebase.ts` - Keep for reference during migration
- `functions/` directory - Keep Firebase functions for comparison

## Technical Considerations

### Authentication Strategy

- **Fake Email Generation**: `line_${lineUserId}@line.local`
- **Password Strategy**: Generate secure random password per user
- **Session Management**: Use Supabase session tokens
- **User Identification**: Store LINE userId in user metadata

### Database Schema

```sql
-- Users table (Supabase auth.users is managed automatically)
-- Custom user profiles table
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  line_user_id TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  picture_url TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  providers JSONB DEFAULT '{}',
  CONSTRAINT unique_line_user_id UNIQUE (line_user_id)
);
```

### Edge Function Structure

```typescript
// Supabase Edge Function: authenticate-line-user
interface LineAuthRequest {
  token: string
  tokenType: 'id' | 'access'
}

interface LineAuthResponse {
  success: boolean
  sessionData:
    | {
        email: string
        password: string
      }
    | {
        session: Session
      }
  isNewUser: boolean
  userData: UserProfile
}
```

### Security Considerations

- Validate LINE tokens securely in Edge Function
- Use secure password generation
- Implement rate limiting
- Sanitize user input
- Secure session management

## Files to Modify

1. `src/contexts/AuthContext.tsx` - Main authentication context
2. `src/lib/firebase.ts` - Replace with Supabase client functions
3. `supabase/functions/authenticate-line-user/index.ts` - New Edge Function
4. Environment variables and configuration
5. Package.json dependencies

## Testing Checklist

- [ ] LIFF initialization works
- [ ] LINE login redirects correctly
- [ ] Edge Function receives and processes LINE tokens
- [ ] User creation in Supabase works
- [ ] Client can authenticate with returned credentials
- [ ] User profile data loads correctly
- [ ] Logout clears all sessions
- [ ] Error handling works for all failure cases
- [ ] New vs returning user detection works
