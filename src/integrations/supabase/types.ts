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
      academic_calendar: {
        Row: {
          created_at: string
          created_by: string
          end_date: string
          id: string
          kind: string
          label: string
          start_date: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          end_date: string
          id?: string
          kind?: string
          label: string
          start_date: string
        }
        Update: {
          created_at?: string
          created_by?: string
          end_date?: string
          id?: string
          kind?: string
          label?: string
          start_date?: string
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          activity_date: string
          created_at: string
          id: string
          intensity: string
          minutes: number
          strength: boolean
          user_id: string
        }
        Insert: {
          activity_date: string
          created_at?: string
          id?: string
          intensity: string
          minutes: number
          strength?: boolean
          user_id?: string
        }
        Update: {
          activity_date?: string
          created_at?: string
          id?: string
          intensity?: string
          minutes?: number
          strength?: boolean
          user_id?: string
        }
        Relationships: []
      }
      guild_chest_claims: {
        Row: {
          claimed_at: string
          coins: number
          gems: number
          guild_id: string | null
          user_id: string
          week_start: string
        }
        Insert: {
          claimed_at?: string
          coins?: number
          gems?: number
          guild_id?: string | null
          user_id?: string
          week_start: string
        }
        Update: {
          claimed_at?: string
          coins?: number
          gems?: number
          guild_id?: string | null
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      guild_members: {
        Row: {
          guild_id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          guild_id: string
          joined_at?: string
          user_id: string
        }
        Update: {
          guild_id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: []
      }
      guilds: {
        Row: {
          code: string
          created_at: string
          created_by: string
          emblem: string
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          emblem?: string
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          emblem?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      achievements: {
        Row: {
          code: string
          id: string
          reward_coins: number
          reward_gems: number
          reward_xp: number
          unlocked_at: string
          user_id: string
        }
        Insert: {
          code: string
          id?: string
          reward_coins?: number
          reward_gems?: number
          reward_xp?: number
          unlocked_at?: string
          user_id: string
        }
        Update: {
          code?: string
          id?: string
          reward_coins?: number
          reward_gems?: number
          reward_xp?: number
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      follow_ups: {
        Row: {
          created_at: string
          id: string
          note: string
          psychologist_id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string
          psychologist_id?: string
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string
          psychologist_id?: string
          student_id?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          acquired_at: string
          equipped: boolean
          id: string
          item_key: string | null
          item_name: string
          kind: string
          quantity: number
          user_id: string
        }
        Insert: {
          acquired_at?: string
          equipped?: boolean
          id?: string
          item_key?: string | null
          item_name: string
          kind?: string
          quantity?: number
          user_id: string
        }
        Update: {
          acquired_at?: string
          equipped?: boolean
          id?: string
          item_key?: string | null
          item_name?: string
          kind?: string
          quantity?: number
          user_id?: string
        }
        Relationships: []
      }
      item_effects: {
        Row: {
          created_at: string
          effect: string
          expires_at: string | null
          id: string
          item_key: string
          magnitude: number
          user_id: string
          uses_left: number | null
        }
        Insert: {
          created_at?: string
          effect: string
          expires_at?: string | null
          id?: string
          item_key: string
          magnitude?: number
          user_id: string
          uses_left?: number | null
        }
        Update: {
          created_at?: string
          effect?: string
          expires_at?: string | null
          id?: string
          item_key?: string
          magnitude?: number
          user_id?: string
          uses_left?: number | null
        }
        Relationships: []
      }
      mission_feedback: {
        Row: {
          category: string
          created_at: string
          feedback_date: string
          helpful: boolean
          id: string
          mission_id: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          feedback_date: string
          helpful: boolean
          id?: string
          mission_id: string
          user_id?: string
        }
        Update: {
          category?: string
          created_at?: string
          feedback_date?: string
          helpful?: boolean
          id?: string
          mission_id?: string
          user_id?: string
        }
        Relationships: []
      }
      mission_responses: {
        Row: {
          category: string
          completed_date: string
          created_at: string
          id: string
          kind: string
          mission_id: string
          mission_title: string
          payload: Json
          shared_writing: boolean
          user_id: string
        }
        Insert: {
          category: string
          completed_date: string
          created_at?: string
          id?: string
          kind: string
          mission_id: string
          mission_title: string
          payload?: Json
          shared_writing?: boolean
          user_id?: string
        }
        Update: {
          category?: string
          completed_date?: string
          created_at?: string
          id?: string
          kind?: string
          mission_id?: string
          mission_title?: string
          payload?: Json
          shared_writing?: boolean
          user_id?: string
        }
        Relationships: []
      }
      model_versions: {
        Row: {
          active: boolean
          created_at: string
          description: string
          kind: string
          metrics: Json
          params: Json
          version: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description: string
          kind: string
          metrics?: Json
          params?: Json
          version: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          kind?: string
          metrics?: Json
          params?: Json
          version?: string
        }
        Relationships: []
      }
      participant_profile: {
        Row: {
          age_band: string
          gender: string
          semester_band: string
          updated_at: string
          user_id: string
        }
        Insert: {
          age_band?: string
          gender?: string
          semester_band?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          age_band?: string
          gender?: string
          semester_band?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mission_completions: {
        Row: {
          category: string
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
          category?: string
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
          category?: string
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
          daily_goal: number
          gems: number
          last_mission_date: string | null
          level: number
          name: string
          onboarded: boolean
          streak: number
          text_size: string
          theme: string
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          archetype?: number | null
          avatar?: number
          coins?: number
          created_at?: string
          daily_goal?: number
          gems?: number
          last_mission_date?: string | null
          level?: number
          name?: string
          onboarded?: boolean
          streak?: number
          text_size?: string
          theme?: string
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          archetype?: number | null
          avatar?: number
          coins?: number
          created_at?: string
          daily_goal?: number
          gems?: number
          last_mission_date?: string | null
          level?: number
          name?: string
          onboarded?: boolean
          streak?: number
          text_size?: string
          theme?: string
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      recommendation_log: {
        Row: {
          category: string
          id: string
          mission_id: string
          model_version: string
          rank: number
          rec_date: string
          score: number
          shown_at: string
          taken_at: string | null
          user_id: string
        }
        Insert: {
          category: string
          id?: string
          mission_id: string
          model_version: string
          rank: number
          rec_date: string
          score: number
          shown_at?: string
          taken_at?: string | null
          user_id?: string
        }
        Update: {
          category?: string
          id?: string
          mission_id?: string
          model_version?: string
          rank?: number
          rec_date?: string
          score?: number
          shown_at?: string
          taken_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      research_consent: {
        Row: {
          accepted_at: string
          consent_version: string
          created_at: string
          id: string
          revoked_at: string | null
          updated_at: string
          user_id: string
          wearables_opt_in: boolean
          share_writing: boolean
        }
        Insert: {
          accepted_at?: string
          consent_version: string
          created_at?: string
          id?: string
          revoked_at?: string | null
          updated_at?: string
          user_id: string
          wearables_opt_in?: boolean
          share_writing?: boolean
        }
        Update: {
          accepted_at?: string
          consent_version?: string
          created_at?: string
          id?: string
          revoked_at?: string | null
          updated_at?: string
          user_id?: string
          wearables_opt_in?: boolean
          share_writing?: boolean
        }
        Relationships: []
      }
      task_events: {
        Row: {
          category: string
          created_at: string
          duration_seconds: number
          id: string
          is_ar: boolean
          mission_id: string
          occurred_at: string
          occurred_date: string
          status: string
          title: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          duration_seconds?: number
          id?: string
          is_ar?: boolean
          mission_id: string
          occurred_at?: string
          occurred_date?: string
          status: string
          title: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          duration_seconds?: number
          id?: string
          is_ar?: boolean
          mission_id?: string
          occurred_at?: string
          occurred_date?: string
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      timeline_events: {
        Row: {
          created_at: string
          detail: string | null
          id: string
          kind: string
          occurred_at: string
          payload: Json
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          detail?: string | null
          id?: string
          kind: string
          occurred_at?: string
          payload?: Json
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          detail?: string | null
          id?: string
          kind?: string
          occurred_at?: string
          payload?: Json
          title?: string
          user_id?: string
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
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
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
      wellbeing_checkins: {
        Row: {
          checkin_date: string
          checkin_local_hour: number | null
          created_at: string
          energy: number
          id: string
          mood: number
          note: string | null
          response_seconds: number | null
          sleep_hours: number | null
          social: number
          stress: number
          updated_at: string
          user_id: string
        }
        Insert: {
          checkin_date?: string
          checkin_local_hour?: number | null
          created_at?: string
          energy: number
          id?: string
          mood: number
          note?: string | null
          response_seconds?: number | null
          sleep_hours?: number | null
          social: number
          stress: number
          updated_at?: string
          user_id: string
        }
        Update: {
          checkin_date?: string
          checkin_local_hour?: number | null
          created_at?: string
          energy?: number
          id?: string
          mood?: number
          note?: string | null
          response_seconds?: number | null
          sleep_hours?: number | null
          social?: number
          stress?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wellbeing_predictions: {
        Row: {
          consent_version: string
          coverage: number
          explanation: Json
          feature_version: string
          features: Json
          generated_at: string
          id: string
          model_version: string
          risk_level: string
          score: number | null
          trend: string
          trend_delta: number
          user_id: string
        }
        Insert: {
          consent_version: string
          coverage?: number
          explanation?: Json
          feature_version: string
          features?: Json
          generated_at?: string
          id?: string
          model_version: string
          risk_level: string
          score?: number | null
          trend?: string
          trend_delta?: number
          user_id: string
        }
        Update: {
          consent_version?: string
          coverage?: number
          explanation?: Json
          feature_version?: string
          features?: Json
          generated_at?: string
          id?: string
          model_version?: string
          risk_level?: string
          score?: number | null
          trend?: string
          trend_delta?: number
          user_id?: string
        }
        Relationships: []
      }
      wellbeing_scales: {
        Row: {
          answered_at: string
          created_at: string
          id: string
          max_score: number
          raw_score: number
          scale_code: string
          user_id: string
        }
        Insert: {
          answered_at?: string
          created_at?: string
          id?: string
          max_score: number
          raw_score: number
          scale_code: string
          user_id: string
        }
        Update: {
          answered_at?: string
          created_at?: string
          id?: string
          max_score?: number
          raw_score?: number
          scale_code?: string
          user_id?: string
        }
        Relationships: []
      }
      world_state: {
        Row: {
          created_at: string
          harmony: number
          recomputed_at: string
          season: string
          tasks_today: number
          updated_at: string
          user_id: string
          vitality: number
          zones_unlocked: number
        }
        Insert: {
          created_at?: string
          harmony?: number
          recomputed_at?: string
          season?: string
          tasks_today?: number
          updated_at?: string
          user_id: string
          vitality?: number
          zones_unlocked?: number
        }
        Update: {
          created_at?: string
          harmony?: number
          recomputed_at?: string
          season?: string
          tasks_today?: number
          updated_at?: string
          user_id?: string
          vitality?: number
          zones_unlocked?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      my_guild_id: { Args: Record<PropertyKey, never>; Returns: string }
      create_guild: { Args: { _name: string; _emblem: string }; Returns: string }
      join_guild: { Args: { _code: string }; Returns: string }
      leave_guild: { Args: Record<PropertyKey, never>; Returns: undefined }
      guild_roster: {
        Args: Record<PropertyKey, never>
        Returns: { user_id: string; name: string; archetype: number | null; level: number; joined_at: string }[]
      }
      save_compass_version: {
        Args: { _version: string; _description: string; _params: Json; _metrics: Json }
        Returns: undefined
      }
      activate_compass: { Args: { _version: string }; Returns: undefined }
      claim_guild_chest: {
        Args: { _week_start: string }
        Returns: { reward_coins: number; reward_gems: number }[]
      }
      guild_week_progress: {
        Args: { _since: string; _categories: string[] }
        Returns: { total: number; contributors: number }[]
      }
    }
    Enums: {
      app_role: "psicologo" | "investigador"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["psicologo", "investigador"],
    },
  },
} as const
