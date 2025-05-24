export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          line_user_id: string
          display_name: string
          picture_url?: string | null
          description?: string | null
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
        Insert: {
          id: string
          line_user_id: string
          display_name: string
          picture_url?: string | null
          description?: string | null
          created_at?: string
          last_login?: string
          providers?: {
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
        Update: {
          id?: string
          line_user_id?: string
          display_name?: string
          picture_url?: string | null
          description?: string | null
          created_at?: string
          last_login?: string
          providers?: {
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
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 