export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
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
      calendar_events: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string | null;
          end_date: string;
          event_type: string | null;
          id: string;
          start_date: string;
          target_audience: string;
          title: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          end_date: string;
          event_type?: string | null;
          id?: string;
          start_date: string;
          target_audience?: string;
          title: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          end_date?: string;
          event_type?: string | null;
          id?: string;
          start_date?: string;
          target_audience?: string;
          title?: string;
        };
        Relationships: [];
      };
      certificates: {
        Row: {
          application_id: string;
          batch: string | null;
          id: string;
          issued_at: string;
          program: string | null;
          signature_id: string | null;
          student_code: string;
          student_name: string;
        };
        Insert: {
          application_id: string;
          batch?: string | null;
          id?: string;
          issued_at?: string;
          program?: string | null;
          signature_id?: string | null;
          student_code: string;
          student_name: string;
        };
        Update: {
          application_id?: string;
          batch?: string | null;
          id?: string;
          issued_at?: string;
          program?: string | null;
          signature_id?: string | null;
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
          {
            foreignKeyName: "certificates_signature_id_fkey";
            columns: ["signature_id"];
            isOneToOne: false;
            referencedRelation: "signatures";
            referencedColumns: ["id"];
          },
        ];
      };
      clearance_applications: {
        Row: {
          cleared_at: string | null;
          id: string;
          status: Database["public"]["Enums"]["application_status"];
          student_id: string;
          submitted_at: string;
        };
        Insert: {
          cleared_at?: string | null;
          id?: string;
          status?: Database["public"]["Enums"]["application_status"];
          student_id: string;
          submitted_at?: string;
        };
        Update: {
          cleared_at?: string | null;
          id?: string;
          status?: Database["public"]["Enums"]["application_status"];
          student_id?: string;
          submitted_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "clearance_applications_student_profiles_fkey";
            columns: ["student_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      department_reviews: {
        Row: {
          application_id: string;
          attempts: number;
          created_at: string;
          department_id: string;
          escalated: boolean;
          id: string;
          is_na: boolean;
          remarks: string | null;
          resubmit_comment: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: Database["public"]["Enums"]["review_status"];
          triggered: boolean;
        };
        Insert: {
          application_id: string;
          attempts?: number;
          created_at?: string;
          department_id: string;
          escalated?: boolean;
          id?: string;
          is_na?: boolean;
          remarks?: string | null;
          resubmit_comment?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: Database["public"]["Enums"]["review_status"];
          triggered?: boolean;
        };
        Update: {
          application_id?: string;
          attempts?: number;
          created_at?: string;
          department_id?: string;
          escalated?: boolean;
          id?: string;
          is_na?: boolean;
          remarks?: string | null;
          resubmit_comment?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: Database["public"]["Enums"]["review_status"];
          triggered?: boolean;
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
      notices: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          target_audience: string;
          title: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          target_audience?: string;
          title: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          target_audience?: string;
          title?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          body: string | null;
          created_at: string;
          deleted_at: string | null;
          id: string;
          is_read: boolean;
          title: string;
          user_id: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          is_read?: boolean;
          title: string;
          user_id: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          deleted_at?: string | null;
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
          is_active: boolean;
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
          is_active?: boolean;
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
          is_active?: boolean;
        };
        Relationships: [];
      };
      office_departments: {
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
            foreignKeyName: "staff_departments_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          },
        ];
      };
      signatures: {
        Row: {
          active: boolean;
          created_at: string;
          id: string;
          storage_path: string;
          uploaded_by: string | null;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          id?: string;
          storage_path: string;
          uploaded_by?: string | null;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          id?: string;
          storage_path?: string;
          uploaded_by?: string | null;
        };
        Relationships: [];
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
      declare_review_na: { Args: { p_review_id: string }; Returns: undefined };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_current_upload_step: {
        Args: { p_review_id: string };
        Returns: boolean;
      };
      login_email_for_user_code: {
        Args: { p_user_code: string };
        Returns: string;
      };
      owns_application: {
        Args: { _application_id: string; _user_id: string };
        Returns: boolean;
      };
      office_in_department: {
        Args: { _department_id: string; _user_id: string };
        Returns: boolean;
      };
      reopen_na_review: { Args: { p_review_id: string }; Returns: undefined };
      reopen_rejected_review: {
        Args: { p_review_id: string; p_comment?: string };
        Returns: undefined;
      };
      resolve_certificate_id: {
        Args: { p_code: string };
        Returns: string;
      };
      resolve_escalation: {
        Args: { p_review_id: string; p_decision: string; p_note: string };
        Returns: undefined;
      };
      admin_create_account: {
        Args: {
          p_user_code: string;
          p_full_name: string;
          p_email: string;
          p_phone?: string;
          p_role: Database["public"]["Enums"]["app_role"];
          p_department_id?: string;
        };
        Returns: string;
      };
      admin_reset_password: {
        Args: { p_user_id: string; p_new_password: string };
        Returns: undefined;
      };
      admin_set_user_active: {
        Args: { p_user_id: string; p_active: boolean };
        Returns: undefined;
      };
      admin_add_office: {
        Args: { name: string; code: string; requirement?: string; sort_order: number };
        Returns: string;
      };
      admin_remove_office: {
        Args: { p_dept_id: string };
        Returns: undefined;
      };
      reviewer_display_name: { Args: { _review_id: string }; Returns: string };
      verify_clearance_status: { Args: { p_user_code: string }; Returns: Json };
    };
    Enums: {
      app_role: "student" | "office" | "admin";
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["student", "office", "admin"],
      application_status: ["draft", "in_review", "cleared"],
      review_status: ["pending", "approved", "rejected"],
    },
  },
} as const;
