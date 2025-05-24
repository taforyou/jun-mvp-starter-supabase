import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LineAuthRequest {
  token: string
  tokenType: 'id' | 'access'
}

interface LineProfile {
  userId: string
  displayName: string
  pictureUrl?: string
  statusMessage?: string
  email?: string
}

interface UserData {
  id: string
  line_user_id: string
  display_name: string
  picture_url: string | null
  description: string | null
  last_login: string
  created_at?: string
  providers: {
    line: {
      userId: string
      displayName: string
      pictureUrl?: string
      email?: string | null
      lastLogin: string
      linkedAt: string
    }
  }
}

interface LineAuthResponse {
  success: boolean
  sessionData: {
    email: string
    password: string
  }
  isNewUser: boolean
  userData: UserData
}

interface SupabaseUser {
  id: string
  email?: string
  user_metadata?: {
    line_user_id?: string
    line_password?: string
    line_linked_at?: string
    [key: string]: unknown
  }
}

// Verify LINE token and get user profile
async function verifyLineToken(token: string, tokenType: 'id' | 'access'): Promise<LineProfile> {
  let apiUrl = ''
  let headers: Record<string, string> = {}

  if (tokenType === 'id') {
    // Verify ID token
    apiUrl = 'https://api.line.me/oauth2/v2.1/verify'
    headers = {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
    
    const body = new URLSearchParams({
      id_token: token,
      client_id: Deno.env.get('LINE_CHANNEL_ID') || ''
    })

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: body
    })

    if (!response.ok) {
      throw new Error(`LINE ID token verification failed: ${response.status}`)
    }

    const data = await response.json()
    
    return {
      userId: data.sub,
      displayName: data.name || 'LINE User',
      pictureUrl: data.picture,
      email: data.email
    }
  } else {
    // Use access token to get profile
    apiUrl = 'https://api.line.me/v2/profile'
    headers = {
      'Authorization': `Bearer ${token}`
    }

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers
    })

    if (!response.ok) {
      throw new Error(`LINE profile fetch failed: ${response.status}`)
    }

    const data = await response.json()
    
    return {
      userId: data.userId,
      displayName: data.displayName || 'LINE User',
      pictureUrl: data.pictureUrl,
      statusMessage: data.statusMessage
    }
  }
}

// Generate secure random password
function generateSecurePassword(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  
  for (let i = 0; i < length; i++) {
    password += chars[array[i] % chars.length]
  }
  
  return password
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Parse request body
    const { token, tokenType }: LineAuthRequest = await req.json()

    if (!token || !tokenType) {
      throw new Error('Missing token or tokenType')
    }

    console.log('Verifying LINE token...')
    
    // Verify LINE token and get user profile
    const lineProfile = await verifyLineToken(token, tokenType)
    
    console.log('LINE profile verified:', lineProfile.userId)

    // Generate fake email for LINE user
    const email = `line_${lineProfile.userId}@line.local`
    
    let userId: string
    let password: string
    let isNewUser = false
    let existingUser: SupabaseUser | null = null

    // First, try to create a new user
    password = generateSecurePassword()
    
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        line_user_id: lineProfile.userId,
        line_password: password
      }
    })

    if (createError) {
      console.log('User creation failed with error:', createError.message)
      console.log('Error code:', createError.status)
      console.log('Full error:', JSON.stringify(createError))
      
      // Check if error is due to user already existing
      if (createError.message.includes('already been registered') || 
          createError.message.includes('already exists') ||
          createError.message.includes('User already registered') ||
          createError.status === 422) {
        console.log('User already exists, fetching existing user...')
        console.log('Looking for email:', email)
        
        // Try multiple approaches to find the existing user
        let foundUser: SupabaseUser | null = null
        
        // Approach 1: Try to search by email in user profiles table first
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('line_user_id', lineProfile.userId)
          .single()
          
        if (profileData && !profileError) {
          console.log('Found user via profile table:', profileData.id)
          // Get the auth user by ID
          const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profileData.id)
          if (authUser.user && !authError) {
            foundUser = authUser.user as SupabaseUser
            console.log('Successfully retrieved auth user by ID')
          }
        }
        
        // Approach 2: If not found, search through paginated auth users
        if (!foundUser) {
          console.log('User not found in profiles, searching auth users...')
          let page = 1
          const perPage = 1000 // Max per page
          let totalSearched = 0

          while (!foundUser) {
            console.log(`Searching page ${page}...`)
            const { data: usersPage, error: getUserError } = await supabase.auth.admin.listUsers({
              page,
              perPage
            })
            
            if (getUserError) {
              console.error('Error listing users:', getUserError)
              throw new Error(`Failed to check existing users: ${getUserError.message}`)
            }

            console.log(`Found ${usersPage.users.length} users on page ${page}`)
            totalSearched += usersPage.users.length
            
            foundUser = usersPage.users.find((user: SupabaseUser) => user.email === email) as SupabaseUser | undefined || null
            
            if (foundUser) {
              console.log('Found user via pagination search:', foundUser.id)
              break
            }
            
            // If we found the user or there are no more pages, break
            if (usersPage.users.length < perPage) {
              console.log(`Reached end of users. Total searched: ${totalSearched}`)
              break
            }
            
            page++
            
            // Safety check to prevent infinite loops
            if (page > 100) {
              console.log('Reached maximum page limit (100)')
              break
            }
          }
        }

        if (!foundUser) {
          console.error('User should exist but could not be found after comprehensive search')
          console.error('Email searched for:', email)
          console.error('LINE user ID:', lineProfile.userId)
          
          // As a last resort, try to create the user again with a different approach
          // Maybe the first creation actually succeeded but returned an error
          throw new Error(`User should exist but could not be found. Email: ${email}, LINE ID: ${lineProfile.userId}`)
        }

        existingUser = foundUser as SupabaseUser
        userId = existingUser.id
        
        console.log('Using existing user:', userId, 'with email:', existingUser.email)
        
        // Try to get existing password from user metadata
        password = existingUser.user_metadata?.line_password || ''
        
        if (!password) {
          // Generate new password and update user metadata
          password = generateSecurePassword()
          
          const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
            password: password,
            user_metadata: {
              ...existingUser.user_metadata,
              line_password: password
            }
          })
          
          if (updateError) {
            throw new Error(`Failed to update user password: ${updateError.message}`)
          }
        }
        
        console.log('Using existing user:', userId)
      } else {
        // Some other error occurred during user creation
        throw new Error(`Failed to create user: ${createError.message}`)
      }
    } else if (newUser.user) {
      // Successfully created new user
      userId = newUser.user.id
      isNewUser = true
      console.log('New user created:', userId)
    } else {
      throw new Error('Failed to create user: No user data returned')
    }

    // Create or update user profile
    const now = new Date().toISOString()
    
    if (isNewUser) {
      // For new users: Set all profile data from LINE
      const newUserProfileData = {
        id: userId,
        line_user_id: lineProfile.userId,
        display_name: lineProfile.displayName,
        picture_url: lineProfile.pictureUrl || null,
        description: lineProfile.statusMessage || null,
        last_login: now,
        created_at: now,
        providers: {
          line: {
            userId: lineProfile.userId,
            displayName: lineProfile.displayName,
            pictureUrl: lineProfile.pictureUrl,
            email: lineProfile.email || null,
            lastLogin: now,
            linkedAt: now
          }
        }
      }

      // Insert new profile
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert(newUserProfileData)
        .select()
        .single()

      if (insertError) {
        console.error('Failed to create user profile:', insertError)
        throw new Error(`Failed to create user profile: ${insertError.message}`)
      }

      console.log('User profile created')
    } else {
      // For existing users: Only update login-related fields and LINE provider data
      // Preserve ALL user-editable fields (display_name, picture_url, description)
      
      // First, get the current profile to merge providers properly
      const { data: currentProfile, error: getCurrentError } = await supabase
        .from('user_profiles')
        .select('providers')
        .eq('id', userId)
        .single()

      if (getCurrentError) {
        console.error('Error getting current profile for provider merge:', getCurrentError)
        throw new Error(`Failed to get current profile: ${getCurrentError.message}`)
      }

      const existingUserUpdate = {
        // Only update login timestamp
        last_login: now,
        
        // Merge LINE provider data with existing providers
        providers: {
          ...currentProfile.providers,
          line: {
            userId: lineProfile.userId,
            displayName: lineProfile.displayName,
            pictureUrl: lineProfile.pictureUrl,
            email: lineProfile.email || null,
            lastLogin: now,
            linkedAt: existingUser?.user_metadata?.line_linked_at || now
          }
        }
      }

      // Update only specific fields, preserving user-edited content
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update(existingUserUpdate)
        .eq('id', userId)
        .select()
        .single()

      if (updateError) {
        console.error('Failed to update user profile:', updateError)
        throw new Error(`Failed to update user profile: ${updateError.message}`)
      }

      console.log('User profile updated (preserved user-edited fields)')
    }

    // Get final user profile data
    const { data: userData, error: getProfileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (getProfileError) {
      throw new Error(`Failed to get user profile: ${getProfileError.message}`)
    }

    const response: LineAuthResponse = {
      success: true,
      sessionData: {
        email,
        password
      },
      isNewUser,
      userData
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error: unknown) {
    console.error('Authentication error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed'
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
}) 