export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'admin' | 'manager' | 'senior_carer' | 'carer'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'snoozed' | 'escalated' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type LogType = 'meal' | 'drink' | 'medication' | 'toileting' | 'mood' | 'personal_care' | 'activity' | 'observation' | 'incident' | 'note'
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical'
export type SyncStatus = 'synced' | 'pending' | 'failed'
export type SubscriptionStatus = 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused'
export type ImportStatus = 'pending' | 'validating' | 'validated' | 'importing' | 'completed' | 'failed' | 'cancelled'
export type ImportRowStatus = 'pending' | 'valid' | 'invalid' | 'imported' | 'skipped' | 'failed'
export type ImportEntityType = 'residents' | 'staff' | 'tasks' | 'care_plans'
export type PolicyStatus = 'draft' | 'published' | 'archived'

export interface Database {
  public: {
    Tables: {
      organisations: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          logo_url?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          organisation_id: string
          email: string
          full_name: string
          role: UserRole
          avatar_url: string | null
          phone: string | null
          pin_hash: string | null
          is_active: boolean
          last_login_at: string | null
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          organisation_id: string
          email: string
          full_name: string
          role?: UserRole
          avatar_url?: string | null
          phone?: string | null
          pin_hash?: string | null
          is_active?: boolean
          last_login_at?: string | null
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          email?: string
          full_name?: string
          role?: UserRole
          avatar_url?: string | null
          phone?: string | null
          pin_hash?: string | null
          is_active?: boolean
          last_login_at?: string | null
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      residents: {
        Row: {
          id: string
          organisation_id: string
          first_name: string
          last_name: string
          preferred_name: string | null
          date_of_birth: string | null
          room_number: string | null
          photo_url: string | null
          admission_date: string | null
          status: string
          emergency_contact: Json
          medical_info: Json
          dietary_requirements: string | null
          mobility_notes: string | null
          communication_needs: string | null
          risk_flags: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          first_name: string
          last_name: string
          preferred_name?: string | null
          date_of_birth?: string | null
          room_number?: string | null
          photo_url?: string | null
          admission_date?: string | null
          status?: string
          emergency_contact?: Json
          medical_info?: Json
          dietary_requirements?: string | null
          mobility_notes?: string | null
          communication_needs?: string | null
          risk_flags?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          first_name?: string
          last_name?: string
          preferred_name?: string | null
          date_of_birth?: string | null
          room_number?: string | null
          photo_url?: string | null
          admission_date?: string | null
          status?: string
          emergency_contact?: Json
          medical_info?: Json
          dietary_requirements?: string | null
          mobility_notes?: string | null
          communication_needs?: string | null
          risk_flags?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      staff_assignments: {
        Row: {
          id: string
          user_id: string
          resident_id: string
          shift_date: string
          is_primary: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          resident_id: string
          shift_date: string
          is_primary?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          resident_id?: string
          shift_date?: string
          is_primary?: boolean
          created_at?: string
        }
        Relationships: []
      }
      care_plans: {
        Row: {
          id: string
          resident_id: string
          title: string
          summary: string | null
          key_needs: Json
          key_risks: Json
          goals: Json
          interventions: Json
          review_date: string | null
          last_reviewed_at: string | null
          reviewed_by: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          resident_id: string
          title: string
          summary?: string | null
          key_needs?: Json
          key_risks?: Json
          goals?: Json
          interventions?: Json
          review_date?: string | null
          last_reviewed_at?: string | null
          reviewed_by?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          resident_id?: string
          title?: string
          summary?: string | null
          key_needs?: Json
          key_risks?: Json
          goals?: Json
          interventions?: Json
          review_date?: string | null
          last_reviewed_at?: string | null
          reviewed_by?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          id: string
          organisation_id: string
          resident_id: string | null
          assigned_to: string | null
          created_by: string
          title: string
          description: string | null
          task_type: string | null
          priority: TaskPriority
          status: TaskStatus
          due_at: string
          completed_at: string | null
          completed_by: string | null
          snoozed_until: string | null
          snooze_reason: string | null
          escalated_at: string | null
          escalated_to: string | null
          recurrence_rule: Json | null
          parent_task_id: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          resident_id?: string | null
          assigned_to?: string | null
          created_by: string
          title: string
          description?: string | null
          task_type?: string | null
          priority?: TaskPriority
          status?: TaskStatus
          due_at: string
          completed_at?: string | null
          completed_by?: string | null
          snoozed_until?: string | null
          snooze_reason?: string | null
          escalated_at?: string | null
          escalated_to?: string | null
          recurrence_rule?: Json | null
          parent_task_id?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          resident_id?: string | null
          assigned_to?: string | null
          created_by?: string
          title?: string
          description?: string | null
          task_type?: string | null
          priority?: TaskPriority
          status?: TaskStatus
          due_at?: string
          completed_at?: string | null
          completed_by?: string | null
          snoozed_until?: string | null
          snooze_reason?: string | null
          escalated_at?: string | null
          escalated_to?: string | null
          recurrence_rule?: Json | null
          parent_task_id?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_logs: {
        Row: {
          id: string
          organisation_id: string
          resident_id: string
          logged_by: string
          log_type: LogType
          log_data: Json
          notes: string | null
          logged_at: string
          task_id: string | null
          sync_status: SyncStatus
          offline_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          resident_id: string
          logged_by: string
          log_type: LogType
          log_data: Json
          notes?: string | null
          logged_at?: string
          task_id?: string | null
          sync_status?: SyncStatus
          offline_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          resident_id?: string
          logged_by?: string
          log_type?: LogType
          log_data?: Json
          notes?: string | null
          logged_at?: string
          task_id?: string | null
          sync_status?: SyncStatus
          offline_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      incidents: {
        Row: {
          id: string
          organisation_id: string
          resident_id: string
          reported_by: string
          incident_type: string
          severity: IncidentSeverity
          description: string
          location: string | null
          occurred_at: string
          witnesses: Json
          immediate_action: string | null
          follow_up_required: boolean
          follow_up_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          manager_notified_at: string | null
          family_notified_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          resident_id: string
          reported_by: string
          incident_type: string
          severity?: IncidentSeverity
          description: string
          location?: string | null
          occurred_at: string
          witnesses?: Json
          immediate_action?: string | null
          follow_up_required?: boolean
          follow_up_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          manager_notified_at?: string | null
          family_notified_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          resident_id?: string
          reported_by?: string
          incident_type?: string
          severity?: IncidentSeverity
          description?: string
          location?: string | null
          occurred_at?: string
          witnesses?: Json
          immediate_action?: string | null
          follow_up_required?: boolean
          follow_up_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          manager_notified_at?: string | null
          family_notified_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      attachments: {
        Row: {
          id: string
          organisation_id: string
          uploaded_by: string
          file_name: string
          file_type: string | null
          file_size: number | null
          storage_path: string
          thumbnail_path: string | null
          entity_type: string
          entity_id: string
          created_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          uploaded_by: string
          file_name: string
          file_type?: string | null
          file_size?: number | null
          storage_path: string
          thumbnail_path?: string | null
          entity_type: string
          entity_id: string
          created_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          uploaded_by?: string
          file_name?: string
          file_type?: string | null
          file_size?: number | null
          storage_path?: string
          thumbnail_path?: string | null
          entity_type?: string
          entity_id?: string
          created_at?: string
        }
        Relationships: []
      }
      handover_notes: {
        Row: {
          id: string
          organisation_id: string
          created_by: string
          shift_date: string
          shift_type: string | null
          auto_summary: Json
          manual_notes: string | null
          priority_items: Json
          read_by: Json
          finalized_at: string | null
          finalized_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          created_by: string
          shift_date: string
          shift_type?: string | null
          auto_summary?: Json
          manual_notes?: string | null
          priority_items?: Json
          read_by?: Json
          finalized_at?: string | null
          finalized_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          created_by?: string
          shift_date?: string
          shift_type?: string | null
          auto_summary?: Json
          manual_notes?: string | null
          priority_items?: Json
          read_by?: Json
          finalized_at?: string | null
          finalized_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: string
          organisation_id: string
          user_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          old_data: Json | null
          new_data: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          user_id?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          old_data?: Json | null
          new_data?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          user_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string | null
          old_data?: Json | null
          new_data?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: []
      }
      care_plan_views: {
        Row: {
          id: string
          care_plan_id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          care_plan_id: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          care_plan_id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: []
      }
      billing_customers: {
        Row: {
          id: string
          organisation_id: string
          provider: string
          customer_id: string
          email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          provider?: string
          customer_id: string
          email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          provider?: string
          customer_id?: string
          email?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          organisation_id: string
          provider: string
          customer_id: string
          subscription_id: string
          price_id: string | null
          status: SubscriptionStatus
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          trial_ends_at: string | null
          canceled_at: string | null
          raw: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          provider?: string
          customer_id: string
          subscription_id: string
          price_id?: string | null
          status?: SubscriptionStatus
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          trial_ends_at?: string | null
          canceled_at?: string | null
          raw?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          provider?: string
          customer_id?: string
          subscription_id?: string
          price_id?: string | null
          status?: SubscriptionStatus
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          trial_ends_at?: string | null
          canceled_at?: string | null
          raw?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          id: string
          code: string
          name: string
          description: string | null
          stripe_price_id: string
          price_amount: number
          currency: string
          interval: string
          features: Json
          active: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          description?: string | null
          stripe_price_id: string
          price_amount: number
          currency?: string
          interval?: string
          features?: Json
          active?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          description?: string | null
          stripe_price_id?: string
          price_amount?: number
          currency?: string
          interval?: string
          features?: Json
          active?: boolean
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
      import_jobs: {
        Row: {
          id: string
          organisation_id: string
          created_by: string
          entity_type: ImportEntityType
          status: ImportStatus
          file_name: string
          file_size: number | null
          total_rows: number
          valid_rows: number
          invalid_rows: number
          imported_rows: number
          skipped_rows: number
          failed_rows: number
          column_mapping: Json
          options: Json
          error_message: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          created_by: string
          entity_type: ImportEntityType
          status?: ImportStatus
          file_name: string
          file_size?: number | null
          total_rows?: number
          valid_rows?: number
          invalid_rows?: number
          imported_rows?: number
          skipped_rows?: number
          failed_rows?: number
          column_mapping?: Json
          options?: Json
          error_message?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          created_by?: string
          entity_type?: ImportEntityType
          status?: ImportStatus
          file_name?: string
          file_size?: number | null
          total_rows?: number
          valid_rows?: number
          invalid_rows?: number
          imported_rows?: number
          skipped_rows?: number
          failed_rows?: number
          column_mapping?: Json
          options?: Json
          error_message?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      import_rows: {
        Row: {
          id: string
          import_job_id: string
          row_number: number
          raw_data: Json
          mapped_data: Json | null
          status: ImportRowStatus
          errors: Json
          warnings: Json
          created_entity_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          import_job_id: string
          row_number: number
          raw_data: Json
          mapped_data?: Json | null
          status?: ImportRowStatus
          errors?: Json
          warnings?: Json
          created_entity_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          import_job_id?: string
          row_number?: number
          raw_data?: Json
          mapped_data?: Json | null
          status?: ImportRowStatus
          errors?: Json
          warnings?: Json
          created_entity_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      policies: {
        Row: {
          id: string
          organisation_id: string
          title: string
          summary: string | null
          content: string | null
          file_url: string | null
          file_name: string | null
          version: number
          status: PolicyStatus
          requires_acknowledgement: boolean
          published_at: string | null
          created_by: string
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          title: string
          summary?: string | null
          content?: string | null
          file_url?: string | null
          file_name?: string | null
          version?: number
          status?: PolicyStatus
          requires_acknowledgement?: boolean
          published_at?: string | null
          created_by: string
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          title?: string
          summary?: string | null
          content?: string | null
          file_url?: string | null
          file_name?: string | null
          version?: number
          status?: PolicyStatus
          requires_acknowledgement?: boolean
          published_at?: string | null
          created_by?: string
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      policy_assignments: {
        Row: {
          id: string
          policy_id: string
          user_id: string
          assigned_at: string
          due_at: string | null
          is_required: boolean
        }
        Insert: {
          id?: string
          policy_id: string
          user_id: string
          assigned_at?: string
          due_at?: string | null
          is_required?: boolean
        }
        Update: {
          id?: string
          policy_id?: string
          user_id?: string
          assigned_at?: string
          due_at?: string | null
          is_required?: boolean
        }
        Relationships: []
      }
      policy_acknowledgements: {
        Row: {
          id: string
          policy_id: string
          user_id: string
          assignment_id: string | null
          acknowledged_at: string
          acknowledgement_text: string | null
          version_read: number
        }
        Insert: {
          id?: string
          policy_id: string
          user_id: string
          assignment_id?: string | null
          acknowledged_at?: string
          acknowledgement_text?: string | null
          version_read: number
        }
        Update: {
          id?: string
          policy_id?: string
          user_id?: string
          assignment_id?: string | null
          acknowledged_at?: string
          acknowledgement_text?: string | null
          version_read?: number
        }
        Relationships: []
      }
    }
    Views: {
      resident_timeline: {
        Row: {
          id: string
          resident_id: string
          event_type: string
          sub_type: string
          data: Json
          notes: string | null
          user_id: string
          occurred_at: string
          created_at: string
        }
        Relationships: []
      }
      overdue_tasks: {
        Row: {
          id: string
          organisation_id: string
          resident_id: string | null
          assigned_to: string | null
          title: string
          description: string | null
          task_type: string | null
          priority: TaskPriority
          status: TaskStatus
          due_at: string
          first_name: string
          last_name: string
          room_number: string | null
          assigned_to_name: string
        }
        Relationships: []
      }
      today_tasks: {
        Row: {
          id: string
          organisation_id: string
          resident_id: string | null
          assigned_to: string | null
          title: string
          description: string | null
          task_type: string | null
          priority: TaskPriority
          status: TaskStatus
          due_at: string
          first_name: string
          last_name: string
          room_number: string | null
          assigned_to_name: string
        }
        Relationships: []
      }
    }
    Enums: {}
    CompositeTypes: {}
    Functions: {
      get_user_org_id: {
        Args: Record<string, never>
        Returns: string
      }
      get_user_role: {
        Args: Record<string, never>
        Returns: UserRole
      }
      is_manager_or_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      has_active_subscription: {
        Args: { org_id: string }
        Returns: boolean
      }
      org_has_active_subscription: {
        Args: Record<string, never>
        Returns: boolean
      }
      get_org_subscription_status: {
        Args: { org_id: string }
        Returns: SubscriptionStatus
      }
    }
  }
}

// Helper types for easier usage
export type Organisation = Database['public']['Tables']['organisations']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type Resident = Database['public']['Tables']['residents']['Row']
export type StaffAssignment = Database['public']['Tables']['staff_assignments']['Row']
export type CarePlan = Database['public']['Tables']['care_plans']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type DailyLog = Database['public']['Tables']['daily_logs']['Row']
export type Incident = Database['public']['Tables']['incidents']['Row']
export type Attachment = Database['public']['Tables']['attachments']['Row']
export type HandoverNote = Database['public']['Tables']['handover_notes']['Row']
export type AuditLog = Database['public']['Tables']['audit_logs']['Row']
export type CarePlanView = Database['public']['Tables']['care_plan_views']['Row']

// Insert types
export type OrganisationInsert = Database['public']['Tables']['organisations']['Insert']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type ResidentInsert = Database['public']['Tables']['residents']['Insert']
export type TaskInsert = Database['public']['Tables']['tasks']['Insert']
export type DailyLogInsert = Database['public']['Tables']['daily_logs']['Insert']
export type IncidentInsert = Database['public']['Tables']['incidents']['Insert']

// Timeline event type
export type TimelineEvent = Database['public']['Views']['resident_timeline']['Row']

// Billing types
export type BillingCustomer = Database['public']['Tables']['billing_customers']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type Plan = Database['public']['Tables']['plans']['Row']

// Billing insert types
export type BillingCustomerInsert = Database['public']['Tables']['billing_customers']['Insert']
export type SubscriptionInsert = Database['public']['Tables']['subscriptions']['Insert']
export type PlanInsert = Database['public']['Tables']['plans']['Insert']

// Import types
export type ImportJob = Database['public']['Tables']['import_jobs']['Row']
export type ImportJobInsert = Database['public']['Tables']['import_jobs']['Insert']
export type ImportRow = Database['public']['Tables']['import_rows']['Row']
export type ImportRowInsert = Database['public']['Tables']['import_rows']['Insert']

// Policy types
export type Policy = Database['public']['Tables']['policies']['Row']
export type PolicyInsert = Database['public']['Tables']['policies']['Insert']
export type PolicyUpdate = Database['public']['Tables']['policies']['Update']
export type PolicyAssignment = Database['public']['Tables']['policy_assignments']['Row']
export type PolicyAssignmentInsert = Database['public']['Tables']['policy_assignments']['Insert']
export type PolicyAcknowledgement = Database['public']['Tables']['policy_acknowledgements']['Row']
export type PolicyAcknowledgementInsert = Database['public']['Tables']['policy_acknowledgements']['Insert']
