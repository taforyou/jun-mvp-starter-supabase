import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Types for our authentication flow
export interface LineAuthRequest {
  token: string
  tokenType: 'id' | 'access'
}

export interface LineAuthResponse {
  success: boolean
  sessionData: {
    email: string
    password: string
  }
  isNewUser: boolean
  userData: UserProfile
}

export interface UserProfile {
  id: string
  line_user_id: string
  display_name: string
  picture_url?: string
  description?: string
  created_at: string
  last_login: string
  providers: {
    line?: {
      userId: string
      displayName: string
      pictureUrl?: string
      email?: string | null
      lastLogin: string
      linkedAt: string
    }
  }
}

// Authenticate with LINE via Supabase Edge Function
export const authenticateLineUser = async (params: LineAuthRequest): Promise<LineAuthResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('authenticate-line-user', {
      body: params,
    })

    if (error) {
      console.error('Edge function error:', error)
      throw new Error(`Authentication failed: ${error.message}`)
    }

    if (!data.success) {
      throw new Error('Authentication failed')
    }

    return data
  } catch (error) {
    console.error('Error calling authenticate-line-user function:', error)
    throw error
  }
}

// Sign in with email and password
export const signInWithCredentials = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Error signing in:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error signing in with credentials:', error)
    throw error
  }
}

// Get user profile data
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null
      }
      console.error('Error getting user profile:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error getting user profile:', error)
    return null
  }
}

// Update user profile data
export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user profile:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error updating user profile:', error)
    throw error
  }
}

// Sign out
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
      throw error
    }
  } catch (error) {
    console.error('Error signing out:', error)
    throw error
  }
}

// Listen for auth state changes
export const onAuthStateChange = (callback: (user: any) => void) => {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null)
  }).data.subscription
} 