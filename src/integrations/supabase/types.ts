export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string;
          actor_id: string | null;
          actor_name: string | null;
          created_at: string;
          details: string | null;
          entity: string | null;
          entity_id: string | null;
          id: string;
          ip_address: string | null;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          actor_name?: string | null;
          created_at?: string;
          details?: string | null;
          entity?: string | null;
          entity_id?: string | null;
          id?: string;
          ip_address?: string | null;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          actor_name?: string | null;
          created_at?: string;
          details?: string | null;
          entity?: string | null;
          entity_id?: string | null;
          id?: string;
          ip_address?: string | null;
        };
        Relationships: [];
      };
      certificates: {
        Row: {
          application_id: string;
          batch: string | null;
          certificate_code: string;
          id: string;
          issued_at: string;
          program: string | null;
          student_code: string;
          student_name: string;
        };
        Insert: {
          application_id: string;
          batch?: string | null;
          certificate_code: string;
          id?: string;
          issued_at?: string;
          program?: string | null;
          student_code: string;
          student_name: string;
        };
        Update: {
          application_id?: string;
          batch?: string | null;
          certificate_code?: string;
          id?: string;
          issued_at?: string;
          program?: string | null;
          student_code?: string;
          student_name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "certificates_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: true;
            referencedRelation: "clearance_applications";
            referencedColumns: ["id"];
          },
        ];
      };
      clearance_applications: {
        Row: {
          cleared_at: string | null;
          expected_graduation: string | null;
          id: string;
          status: Database["public"]["Enums"]["application_status"];
          student_id: string;
          submitted_at: string;
          supervisor_name: string | null;
          thesis_title: string | null;
        };
        Insert: {
          cleared_at?: string | null;
          expected_graduation?: string | null;
          id?: string;
          status?: Database["public"]["Enums"]["application_status"];
          student_id: string;
          submitted_at?: string;
          supervisor_name?: string | null;
          thesis_title?: string | null;
        };
        Update: {
          cleared_at?: string | null;
          expected_graduation?: string | null;
          id?: string;
          status?: Database["public"]["Enums"]["application_status"];
          student_id?: string;
          submitted_at?: string;
          supervisor_name?: string | null;
          thesis_title?: string | null;
        };
        Relationships: [];
      };
      department_reviews: {
        Row: {
          application_id: string;
          attempts: number;
          created_at: string;
          department_id: string;
          escalated: boolean;
          id: string;
          remarks: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: Database["public"]["Enums"]["review_status"];
        };
        Insert: {
          application_id: string;
          attempts?: number;
          created_at?: string;
          department_id: string;
          escalated?: boolean;
          id?: string;
          remarks?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: Database["public"]["Enums"]["review_status"];
        };
        Update: {
          application_id?: string;
          attempts?: number;
          created_at?: string;
          department_id?: string;
          escalated?: boolean;
          id?: string;
          remarks?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: Database["public"]["Enums"]["review_status"];
        };
        Relationships: [
          {
            foreignKeyName: "department_reviews_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "clearance_applications";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "department_reviews_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          },
        ];
      };
      departments: {
        Row: {
          code: string;
          document_hint: string | null;
          id: string;
          is_final_signoff: boolean;
          name: string;
          requirement: string | null;
          sort_order: number;
        };
        Insert: {
          code: string;
          document_hint?: string | null;
          id?: string;
          is_final_signoff?: boolean;
          name: string;
          requirement?: string | null;
          sort_order?: number;
        };
        Update: {
          code?: string;
          document_hint?: string | null;
          id?: string;
          is_final_signoff?: boolean;
          name?: string;
          requirement?: string | null;
          sort_order?: number;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          file_name: string;
          file_path: string;
          file_size: number | null;
          file_type: string | null;
          id: string;
          rejection_reason: string | null;
          review_id: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: Database["public"]["Enums"]["review_status"];
          uploaded_at: string;
          uploaded_by: string;
        };
        Insert: {
          file_name: string;
          file_path: string;
          file_size?: number | null;
          file_type?: string | null;
          id?: string;
          rejection_reason?: string | null;
          review_id: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: Database["public"]["Enums"]["review_status"];
          uploaded_at?: string;
          uploaded_by: string;
        };
        Update: {
          file_name?: string;
          file_path?: string;
          file_size?: number | null;
          file_type?: string | null;
          id?: string;
          rejection_reason?: string | null;
          review_id?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: Database["public"]["Enums"]["review_status"];
          uploaded_at?: string;
          uploaded_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: "documents_review_id_fkey";
            columns: ["review_id"];
            isOneToOne: false;
            referencedRelation: "department_reviews";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          body: string | null;
          created_at: string;
          id: string;
          is_read: boolean;
          title: string;
          user_id: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          id?: string;
          is_read?: boolean;
          title: string;
          user_id: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          id?: string;
          is_read?: boolean;
          title?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          batch: string | null;
          cgpa: number | null;
          created_at: string;
          credits_completed: number | null;
          full_name: string;
          guardian_name: string | null;
          guardian_phone: string | null;
          id: string;
          permanent_address: string | null;
          personal_email: string | null;
          phone: string | null;
          photo_url: string | null;
          present_address: string | null;
          program: string | null;
          registration_no: string | null;
          updated_at: string;
          user_code: string;
        };
        Insert: {
          batch?: string | null;
          cgpa?: number | null;
          created_at?: string;
          credits_completed?: number | null;
          full_name: string;
          guardian_name?: string | null;
          guardian_phone?: string | null;
          id: string;
          permanent_address?: string | null;
          personal_email?: string | null;
          phone?: string | null;
          photo_url?: string | null;
          present_address?: string | null;
          program?: string | null;
          registration_no?: string | null;
          updated_at?: string;
          user_code: string;
        };
        Update: {
          batch?: string | null;
          cgpa?: number | null;
          created_at?: string;
          credits_completed?: number | null;
          full_name?: string;
          guardian_name?: string | null;
          guardian_phone?: string | null;
          id?: string;
          permanent_address?: string | null;
          personal_email?: string | null;
          phone?: string | null;
          photo_url?: string | null;
          present_address?: string | null;
          program?: string | null;
          registration_no?: string | null;
          updated_at?: string;
          user_code?: string;
        };
        Relationships: [];
      };
      registrar_departments: {
        Row: {
          department_id: string;
          id: string;
          user_id: string;
        };
        Insert: {
          department_id: string;
          id?: string;
          user_id: string;
        };
        Update: {
          department_id?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "registrar_departments_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_see_review: {
        Args: { _review_id: string; _user_id: string };
        Returns: boolean;
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      owns_application: {
        Args: { _application_id: string; _user_id: string };
        Returns: boolean;
      };
      reviewer_display_name: {
        Args: { _review_id: string };
        Returns: string;
      };
      registrar_in_department: {
        Args: { _department_id: string; _user_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "student" | "registrar" | "admin";
      application_status: "draft" | "in_review" | "cleared";
      review_status: "pending" | "approved" | "rejected";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["student", "registrar", "admin"],
      application_status: ["draft", "in_review", "cleared"],
      review_status: ["pending", "approved", "rejected"],
    },
  },
} as const;
