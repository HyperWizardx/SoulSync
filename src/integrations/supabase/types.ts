export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      inventory: {
        Row: {
          acquired_at: string
          id: string
          item_name: string
          user_id: string
        }
        Insert: {
          acquired_at?: string
          id?: string
          item_name: string
          user_id: string
        }
        Update: {
          acquired_at?: string
          id?: string
          item_name?: string
          user_id?: string
        }
        Relationships: []
      }
      mission_completions: {
        Row: {
          completed_at: string
          completed_date: string
          id: string
          is_ar: boolean
          mission_id: string
          title: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          completed_at?: string
          completed_date?: string
          id?: string
          is_ar?: boolean
          mission_id: string
          title: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          completed_at?: string
          completed_date?: string
          id?: string
          is_ar?: boolean
          mission_id?: string
          title?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          archetype: number | null
          avatar: number
          coins: number
          created_at: string
          gems: number
          last_mission_date: string | null
          level: number
          name: string
          streak: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          archetype?: number | null
          avatar?: number
          coins?: number
          created_at?: string
          gems?: number
          last_mission_date?: string | null
          level?: number
          name?: string
          streak?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          archetype?: number | null
          avatar?: number
          coins?: number
          created_at?: string
          gems?: number
          last_mission_date?: string | null
          level?: number
          name?: string
          streak?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      user_attributes: {
        Row: {
          autoconocimiento: number
          conexion_social: number
          creatividad: number
          empatia: number
          mindfulness: number
          resiliencia: number
          updated_at: string
          user_id: string
        }
        Insert: {
          autoconocimiento?: number
          conexion_social?: number
          creatividad?: number
          empatia?: number
          mindfulness?: number
          resiliencia?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          autoconocimiento?: number
          conexion_social?: number
          creatividad?: number
          empatia?: number
          mindfulness?: number
          resiliencia?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          bienestar: number
          claridad: number
          energia: number
          resiliencia: number
          updated_at: string
          user_id: string
        }
        Insert: {
          bienestar?: number
          claridad?: number
          energia?: number
          resiliencia?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          bienestar?: number
          claridad?: number
          energia?: number
          resiliencia?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
