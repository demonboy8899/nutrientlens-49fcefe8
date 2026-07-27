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
      coach_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      exercise_logs: {
        Row: {
          created_at: string
          exercise_name: string
          id: string
          muscle_group: string
          position: number
          rest_seconds: number
          session_id: string
          sets: Json
          target_reps: string | null
          target_sets: number
          user_id: string
        }
        Insert: {
          created_at?: string
          exercise_name: string
          id?: string
          muscle_group?: string
          position?: number
          rest_seconds?: number
          session_id: string
          sets?: Json
          target_reps?: string | null
          target_sets?: number
          user_id: string
        }
        Update: {
          created_at?: string
          exercise_name?: string
          id?: string
          muscle_group?: string
          position?: number
          rest_seconds?: number
          session_id?: string
          sets?: Json
          target_reps?: string | null
          target_sets?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      food_logs: {
        Row: {
          calories: number
          carbs: number
          created_at: string
          fat: number
          id: string
          log_date: string
          meal: string
          name: string
          protein: number
          quantity: string | null
          source: string
          user_id: string
        }
        Insert: {
          calories?: number
          carbs?: number
          created_at?: string
          fat?: number
          id?: string
          log_date?: string
          meal?: string
          name: string
          protein?: number
          quantity?: string | null
          source?: string
          user_id: string
        }
        Update: {
          calories?: number
          carbs?: number
          created_at?: string
          fat?: number
          id?: string
          log_date?: string
          meal?: string
          name?: string
          protein?: number
          quantity?: string | null
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      measurements: {
        Row: {
          arms_cm: number | null
          chest_cm: number | null
          created_at: string
          glutes_cm: number | null
          id: string
          log_date: string
          thighs_cm: number | null
          user_id: string
          waist_cm: number | null
        }
        Insert: {
          arms_cm?: number | null
          chest_cm?: number | null
          created_at?: string
          glutes_cm?: number | null
          id?: string
          log_date?: string
          thighs_cm?: number | null
          user_id: string
          waist_cm?: number | null
        }
        Update: {
          arms_cm?: number | null
          chest_cm?: number | null
          created_at?: string
          glutes_cm?: number | null
          id?: string
          log_date?: string
          thighs_cm?: number | null
          user_id?: string
          waist_cm?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_level: string
          age: number
          calorie_target: number
          carb_target: number
          created_at: string
          display_name: string | null
          fat_target: number
          favorite_styles: string[]
          goal: string
          height_cm: number
          id: string
          onboarded: boolean
          protein_target: number
          sex: string
          updated_at: string
          water_target_ml: number
          weight_kg: number
        }
        Insert: {
          activity_level?: string
          age?: number
          calorie_target?: number
          carb_target?: number
          created_at?: string
          display_name?: string | null
          fat_target?: number
          favorite_styles?: string[]
          goal?: string
          height_cm?: number
          id: string
          onboarded?: boolean
          protein_target?: number
          sex?: string
          updated_at?: string
          water_target_ml?: number
          weight_kg?: number
        }
        Update: {
          activity_level?: string
          age?: number
          calorie_target?: number
          carb_target?: number
          created_at?: string
          display_name?: string | null
          fat_target?: number
          favorite_styles?: string[]
          goal?: string
          height_cm?: number
          id?: string
          onboarded?: boolean
          protein_target?: number
          sex?: string
          updated_at?: string
          water_target_ml?: number
          weight_kg?: number
        }
        Relationships: []
      }
      progress_photos: {
        Row: {
          created_at: string
          id: string
          log_date: string
          pose: string
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          log_date?: string
          pose?: string
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          log_date?: string
          pose?: string
          storage_path?: string
          user_id?: string
        }
        Relationships: []
      }
      water_logs: {
        Row: {
          amount_ml: number
          created_at: string
          id: string
          log_date: string
          user_id: string
        }
        Insert: {
          amount_ml: number
          created_at?: string
          id?: string
          log_date?: string
          user_id: string
        }
        Update: {
          amount_ml?: number
          created_at?: string
          id?: string
          log_date?: string
          user_id?: string
        }
        Relationships: []
      }
      weight_logs: {
        Row: {
          created_at: string
          id: string
          log_date: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string
          id?: string
          log_date?: string
          user_id: string
          weight_kg: number
        }
        Update: {
          created_at?: string
          id?: string
          log_date?: string
          user_id?: string
          weight_kg?: number
        }
        Relationships: []
      }
      workout_sessions: {
        Row: {
          created_at: string
          day_label: string | null
          id: string
          muscle_groups: string[]
          notes: string | null
          session_date: string
          style_id: string | null
          style_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_label?: string | null
          id?: string
          muscle_groups?: string[]
          notes?: string | null
          session_date?: string
          style_id?: string | null
          style_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_label?: string | null
          id?: string
          muscle_groups?: string[]
          notes?: string | null
          session_date?: string
          style_id?: string | null
          style_name?: string | null
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
