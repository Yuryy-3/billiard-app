export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          phone: string
          name: string
          photo_url: string | null
          city: string
          role: 'participant' | 'organizer' | 'admin'
          is_blocked: boolean
          telegram_chat_id: number | null
          created_at: string
        }
        Insert: {
          id: string
          phone: string
          name: string
          photo_url?: string | null
          city?: string
          role?: 'participant' | 'organizer' | 'admin'
          is_blocked?: boolean
          telegram_chat_id?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          phone?: string
          name?: string
          photo_url?: string | null
          city?: string
          role?: 'participant' | 'organizer' | 'admin'
          is_blocked?: boolean
          telegram_chat_id?: number | null
          created_at?: string
        }
        Relationships: []
      }
      telegram_link_tokens: {
        Row: {
          id: string
          user_id: string
          token: string
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          token?: string
          expires_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          token?: string
          expires_at?: string
          created_at?: string
        }
        Relationships: []
      }
      tournaments: {
        Row: {
          id: string
          organizer_id: string
          title: string
          date: string
          address: string
          tables_count: number
          discipline: 'svoyak' | 'pyramid' | 'combined' | 'free_pyramid' | 'nevskaya' | 'kolkhoz' | 'pool_8ball' | 'pool_9ball'
          participants_limit: number
          wins_to_advance: 2 | 3
          time_limit_min: 45 | 60 | 90
          shot_clock_sec: number
          shot_clock_extension_sec: number
          entry_fee: number
          payment_type: 'free' | 'cash' | 'online'
          prize_description: string | null
          regulation_url: string | null
          status: 'draft' | 'open' | 'closed' | 'ongoing' | 'finished'
          created_at: string
          tournament_type: 'championship' | 'cup' | 'open' | 'rating' | 'team'
          grid_format: 'single_elimination' | 'double_elimination' | 'round_robin' | 'groups_playoff'
          group_size: number | null
        }
        Insert: {
          id?: string
          organizer_id: string
          title: string
          date: string
          address: string
          tables_count?: number
          discipline?: 'svoyak' | 'pyramid' | 'combined' | 'free_pyramid' | 'nevskaya' | 'kolkhoz' | 'pool_8ball' | 'pool_9ball'
          participants_limit?: number
          wins_to_advance?: 2 | 3
          time_limit_min?: 45 | 60 | 90
          shot_clock_sec?: number
          shot_clock_extension_sec?: number
          entry_fee?: number
          payment_type?: 'free' | 'cash' | 'online'
          prize_description?: string | null
          regulation_url?: string | null
          status?: 'draft' | 'open' | 'closed' | 'ongoing' | 'finished'
          created_at?: string
          tournament_type?: 'championship' | 'cup' | 'open' | 'rating' | 'team'
          grid_format?: 'single_elimination' | 'double_elimination' | 'round_robin' | 'groups_playoff'
          group_size?: number | null
        }
        Update: {
          id?: string
          organizer_id?: string
          title?: string
          date?: string
          address?: string
          tables_count?: number
          discipline?: 'svoyak' | 'pyramid' | 'combined' | 'free_pyramid' | 'nevskaya' | 'kolkhoz' | 'pool_8ball' | 'pool_9ball'
          participants_limit?: number
          wins_to_advance?: 2 | 3
          time_limit_min?: 45 | 60 | 90
          shot_clock_sec?: number
          shot_clock_extension_sec?: number
          entry_fee?: number
          payment_type?: 'free' | 'cash' | 'online'
          prize_description?: string | null
          regulation_url?: string | null
          status?: 'draft' | 'open' | 'closed' | 'ongoing' | 'finished'
          created_at?: string
          tournament_type?: 'championship' | 'cup' | 'open' | 'rating' | 'team'
          grid_format?: 'single_elimination' | 'double_elimination' | 'round_robin' | 'groups_playoff'
          group_size?: number | null
        }
        Relationships: []
      }
      registrations: {
        Row: {
          id: string
          tournament_id: string
          user_id: string
          payment_status: 'pending' | 'paid' | 'cash'
          paid_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tournament_id: string
          user_id: string
          payment_status?: 'pending' | 'paid' | 'cash'
          paid_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tournament_id?: string
          user_id?: string
          payment_status?: 'pending' | 'paid' | 'cash'
          paid_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          id: string
          tournament_id: string
          round: number
          position: number
          player1_id: string | null
          player2_id: string | null
          score1: number
          score2: number
          winner_id: string | null
          table_number: number | null
          started_at: string | null
          finished_at: string | null
          created_at: string
          bracket: string
          group_id: number
        }
        Insert: {
          id?: string
          tournament_id: string
          round: number
          position: number
          player1_id?: string | null
          player2_id?: string | null
          score1?: number
          score2?: number
          winner_id?: string | null
          table_number?: number | null
          started_at?: string | null
          finished_at?: string | null
          created_at?: string
          bracket?: string
          group_id?: number
        }
        Update: {
          id?: string
          tournament_id?: string
          round?: number
          position?: number
          player1_id?: string | null
          player2_id?: string | null
          score1?: number
          score2?: number
          winner_id?: string | null
          table_number?: number | null
          started_at?: string | null
          finished_at?: string | null
          created_at?: string
          bracket?: string
          group_id?: number
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          endpoint?: string
          p256dh?: string
          auth?: string
          created_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          match_id: string | null
          type: 'registration_confirmed' | 'match_soon' | 'table_assigned' | 'match_result' | 'tournament_finished'
          channel: 'push' | 'sms' | 'telegram'
          sent_at: string
        }
        Insert: {
          id?: string
          user_id: string
          match_id?: string | null
          type: 'registration_confirmed' | 'match_soon' | 'table_assigned' | 'match_result' | 'tournament_finished'
          channel: 'push' | 'sms' | 'telegram'
          sent_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          match_id?: string | null
          type?: 'registration_confirmed' | 'match_soon' | 'table_assigned' | 'match_result' | 'tournament_finished'
          channel?: 'push' | 'sms' | 'telegram'
          sent_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [key: string]: {
        Row: Record<string, unknown>
        Relationships: never[]
      }
    }
    Functions: {
      [key: string]: {
        Args: Record<string, unknown>
        Returns: unknown
      }
    }
  }
}
