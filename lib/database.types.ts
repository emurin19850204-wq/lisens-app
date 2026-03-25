/**
 * LISENS - Supabase データベース型定義
 * 
 * Supabaseのテーブル構造に対応した型定義。
 * dummy-data.ts / types.ts と整合性を保つ。
 */

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          type: 'company' | 'department' | 'store';
          parent_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: 'company' | 'department' | 'store';
          parent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: 'company' | 'department' | 'store';
          parent_id?: string | null;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          auth_uid: string | null;
          email: string;
          name: string;
          role: 'admin' | 'education_manager' | 'evaluator' | 'store_manager' | 'learner';
          organization_id: string;
          current_level: 'lv0' | 'lv1' | 'lv2' | 'lv3' | 'lv4' | 'lv5';
          tracks: string[];
          hire_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_uid?: string | null;
          email: string;
          name: string;
          role: 'admin' | 'education_manager' | 'evaluator' | 'store_manager' | 'learner';
          organization_id: string;
          current_level?: 'lv0' | 'lv1' | 'lv2' | 'lv3' | 'lv4' | 'lv5';
          tracks?: string[];
          hire_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          auth_uid?: string | null;
          email?: string;
          name?: string;
          role?: 'admin' | 'education_manager' | 'evaluator' | 'store_manager' | 'learner';
          organization_id?: string;
          current_level?: 'lv0' | 'lv1' | 'lv2' | 'lv3' | 'lv4' | 'lv5';
          tracks?: string[];
          hire_date?: string | null;
          updated_at?: string;
        };
      };
      curricula: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          type: 'common' | 'track' | 'brushup';
          track_code: string | null;
          total_hours: number;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          type: 'common' | 'track' | 'brushup';
          track_code?: string | null;
          total_hours: number;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          type?: 'common' | 'track' | 'brushup';
          track_code?: string | null;
          total_hours?: number;
          sort_order?: number;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      subjects: {
        Row: {
          id: string;
          curriculum_id: string;
          name: string;
          description: string | null;
          hours: number;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          curriculum_id: string;
          name: string;
          description?: string | null;
          hours: number;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          curriculum_id?: string;
          name?: string;
          description?: string | null;
          hours?: number;
          sort_order?: number;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      course_progresses: {
        Row: {
          id: string;
          user_id: string;
          subject_id: string;
          status: 'not_started' | 'in_progress' | 'completed';
          started_at: string | null;
          completed_at: string | null;
          memo: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject_id: string;
          status?: 'not_started' | 'in_progress' | 'completed';
          started_at?: string | null;
          completed_at?: string | null;
          memo?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          subject_id?: string;
          status?: 'not_started' | 'in_progress' | 'completed';
          started_at?: string | null;
          completed_at?: string | null;
          memo?: string | null;
          updated_at?: string;
        };
      };
      evaluations: {
        Row: {
          id: string;
          learner_id: string;
          evaluator_id: string;
          track: string;
          status: 'draft' | 'submitted' | 'reviewed' | 'finalized' | 'returned';
          total_score: number;
          passed: boolean;
          ng_items: string[];
          overall_comment: string | null;
          good_points: string[];
          improvement_points: string[];
          evaluated_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          learner_id: string;
          evaluator_id: string;
          track: string;
          status?: 'draft' | 'submitted' | 'reviewed' | 'finalized' | 'returned';
          total_score: number;
          passed: boolean;
          ng_items?: string[];
          overall_comment?: string | null;
          good_points?: string[];
          improvement_points?: string[];
          evaluated_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          learner_id?: string;
          evaluator_id?: string;
          track?: string;
          status?: 'draft' | 'submitted' | 'reviewed' | 'finalized' | 'returned';
          total_score?: number;
          passed?: boolean;
          ng_items?: string[];
          overall_comment?: string | null;
          good_points?: string[];
          improvement_points?: string[];
          evaluated_at?: string;
          updated_at?: string;
        };
      };
      evaluation_items: {
        Row: {
          id: string;
          evaluation_id: string;
          item_name: string;
          score: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          evaluation_id: string;
          item_name: string;
          score: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          evaluation_id?: string;
          item_name?: string;
          score?: number;
          comment?: string | null;
        };
      };
      certification_levels: {
        Row: {
          id: string;
          code: string;
          name: string;
          sort_order: number;
          description: string | null;
          requirements: string | null;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          sort_order?: number;
          description?: string | null;
          requirements?: string | null;
        };
        Update: {
          code?: string;
          name?: string;
          sort_order?: number;
          description?: string | null;
          requirements?: string | null;
        };
      };
      certifications: {
        Row: {
          id: string;
          learner_id: string;
          level_id: string;
          track: string | null;
          applicant_id: string;
          approver_id: string | null;
          status: 'pending' | 'certified' | 'rejected';
          reason: string | null;
          rejection_reason: string | null;
          applied_at: string;
          decided_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          learner_id: string;
          level_id: string;
          track?: string | null;
          applicant_id: string;
          approver_id?: string | null;
          status?: 'pending' | 'certified' | 'rejected';
          reason?: string | null;
          rejection_reason?: string | null;
          applied_at?: string;
          decided_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          learner_id?: string;
          level_id?: string;
          track?: string | null;
          applicant_id?: string;
          approver_id?: string | null;
          status?: 'pending' | 'certified' | 'rejected';
          reason?: string | null;
          rejection_reason?: string | null;
          applied_at?: string;
          decided_at?: string | null;
          updated_at?: string;
        };
      };
    };
  };
}
