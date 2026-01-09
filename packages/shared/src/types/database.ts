export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.1';
  };
  public: {
    Tables: {
      activity_effectiveness: {
        Row: {
          activity_type: string;
          average_duration_seconds: number | null;
          average_mood_change: number | null;
          created_at: string | null;
          effective_contexts: string[] | null;
          effectiveness_score: number | null;
          first_used_at: string | null;
          id: string;
          is_recommended: boolean | null;
          last_used_at: string | null;
          mood_declines: number | null;
          mood_improvements: number | null;
          mood_no_change: number | null;
          recommendation_reason: string | null;
          technique: string | null;
          times_completed: number | null;
          times_started: number | null;
          total_duration_seconds: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          activity_type: string;
          average_duration_seconds?: number | null;
          average_mood_change?: number | null;
          created_at?: string | null;
          effective_contexts?: string[] | null;
          effectiveness_score?: number | null;
          first_used_at?: string | null;
          id?: string;
          is_recommended?: boolean | null;
          last_used_at?: string | null;
          mood_declines?: number | null;
          mood_improvements?: number | null;
          mood_no_change?: number | null;
          recommendation_reason?: string | null;
          technique?: string | null;
          times_completed?: number | null;
          times_started?: number | null;
          total_duration_seconds?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          activity_type?: string;
          average_duration_seconds?: number | null;
          average_mood_change?: number | null;
          created_at?: string | null;
          effective_contexts?: string[] | null;
          effectiveness_score?: number | null;
          first_used_at?: string | null;
          id?: string;
          is_recommended?: boolean | null;
          last_used_at?: string | null;
          mood_declines?: number | null;
          mood_improvements?: number | null;
          mood_no_change?: number | null;
          recommendation_reason?: string | null;
          technique?: string | null;
          times_completed?: number | null;
          times_started?: number | null;
          total_duration_seconds?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'activity_effectiveness_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      assistant: {
        Row: {
          assistant_id: string;
          config: Json;
          context: Json | null;
          created_at: string | null;
          description: string | null;
          graph_id: string;
          metadata: Json;
          name: string | null;
          updated_at: string | null;
          version: number;
        };
        Insert: {
          assistant_id?: string;
          config?: Json;
          context?: Json | null;
          created_at?: string | null;
          description?: string | null;
          graph_id: string;
          metadata?: Json;
          name?: string | null;
          updated_at?: string | null;
          version?: number;
        };
        Update: {
          assistant_id?: string;
          config?: Json;
          context?: Json | null;
          created_at?: string | null;
          description?: string | null;
          graph_id?: string;
          metadata?: Json;
          name?: string | null;
          updated_at?: string | null;
          version?: number;
        };
        Relationships: [];
      };
      assistant_versions: {
        Row: {
          assistant_id: string;
          config: Json;
          context: Json | null;
          created_at: string | null;
          description: string | null;
          graph_id: string;
          metadata: Json;
          name: string | null;
          version: number;
        };
        Insert: {
          assistant_id: string;
          config?: Json;
          context?: Json | null;
          created_at?: string | null;
          description?: string | null;
          graph_id: string;
          metadata?: Json;
          name?: string | null;
          version?: number;
        };
        Update: {
          assistant_id?: string;
          config?: Json;
          context?: Json | null;
          created_at?: string | null;
          description?: string | null;
          graph_id?: string;
          metadata?: Json;
          name?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'assistant_versions_assistant_id_fkey';
            columns: ['assistant_id'];
            isOneToOne: false;
            referencedRelation: 'assistant';
            referencedColumns: ['assistant_id'];
          },
        ];
      };
      checkpoint_blobs: {
        Row: {
          blob: string | null;
          channel: string;
          checkpoint_ns: string;
          thread_id: string;
          type: string;
          version: string;
        };
        Insert: {
          blob?: string | null;
          channel: string;
          checkpoint_ns?: string;
          thread_id: string;
          type: string;
          version: string;
        };
        Update: {
          blob?: string | null;
          channel?: string;
          checkpoint_ns?: string;
          thread_id?: string;
          type?: string;
          version?: string;
        };
        Relationships: [];
      };
      checkpoint_migrations: {
        Row: {
          v: number;
        };
        Insert: {
          v: number;
        };
        Update: {
          v?: number;
        };
        Relationships: [];
      };
      checkpoint_writes: {
        Row: {
          blob: string;
          channel: string;
          checkpoint_id: string;
          checkpoint_ns: string;
          idx: number;
          task_id: string;
          task_path: string;
          thread_id: string;
          type: string;
        };
        Insert: {
          blob: string;
          channel: string;
          checkpoint_id: string;
          checkpoint_ns?: string;
          idx: number;
          task_id: string;
          task_path?: string;
          thread_id: string;
          type: string;
        };
        Update: {
          blob?: string;
          channel?: string;
          checkpoint_id?: string;
          checkpoint_ns?: string;
          idx?: number;
          task_id?: string;
          task_path?: string;
          thread_id?: string;
          type?: string;
        };
        Relationships: [];
      };
      checkpoints: {
        Row: {
          checkpoint: Json;
          checkpoint_id: string;
          checkpoint_ns: string;
          metadata: Json;
          parent_checkpoint_id: string | null;
          run_id: string | null;
          thread_id: string;
        };
        Insert: {
          checkpoint: Json;
          checkpoint_id: string;
          checkpoint_ns?: string;
          metadata?: Json;
          parent_checkpoint_id?: string | null;
          run_id?: string | null;
          thread_id: string;
        };
        Update: {
          checkpoint?: Json;
          checkpoint_id?: string;
          checkpoint_ns?: string;
          metadata?: Json;
          parent_checkpoint_id?: string | null;
          run_id?: string | null;
          thread_id?: string;
        };
        Relationships: [];
      };
      conversation_analyses: {
        Row: {
          analysis_json: Json | null;
          analysis_summary: string | null;
          analyzed_up_to_message_id: string | null;
          concerns_raised: string[] | null;
          conversation_id: string;
          conversation_type: string | null;
          coping_strategies_mentioned: string[] | null;
          created_at: string | null;
          detected_triggers: string[] | null;
          embedding: unknown;
          emotion_intensity: number | null;
          emotional_trajectory: string | null;
          emotional_valence: number | null;
          engagement_level: string | null;
          follow_up_topics: string[] | null;
          id: string;
          positive_aspects: string[] | null;
          primary_emotion: string;
          session_quality: string | null;
          suggested_activities: string[] | null;
          topics_discussed: string[] | null;
          user_id: string;
        };
        Insert: {
          analysis_json?: Json | null;
          analysis_summary?: string | null;
          analyzed_up_to_message_id?: string | null;
          concerns_raised?: string[] | null;
          conversation_id: string;
          conversation_type?: string | null;
          coping_strategies_mentioned?: string[] | null;
          created_at?: string | null;
          detected_triggers?: string[] | null;
          embedding?: unknown;
          emotion_intensity?: number | null;
          emotional_trajectory?: string | null;
          emotional_valence?: number | null;
          engagement_level?: string | null;
          follow_up_topics?: string[] | null;
          id?: string;
          positive_aspects?: string[] | null;
          primary_emotion: string;
          session_quality?: string | null;
          suggested_activities?: string[] | null;
          topics_discussed?: string[] | null;
          user_id: string;
        };
        Update: {
          analysis_json?: Json | null;
          analysis_summary?: string | null;
          analyzed_up_to_message_id?: string | null;
          concerns_raised?: string[] | null;
          conversation_id?: string;
          conversation_type?: string | null;
          coping_strategies_mentioned?: string[] | null;
          created_at?: string | null;
          detected_triggers?: string[] | null;
          embedding?: unknown;
          emotion_intensity?: number | null;
          emotional_trajectory?: string | null;
          emotional_valence?: number | null;
          engagement_level?: string | null;
          follow_up_topics?: string[] | null;
          id?: string;
          positive_aspects?: string[] | null;
          primary_emotion?: string;
          session_quality?: string | null;
          suggested_activities?: string[] | null;
          topics_discussed?: string[] | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'conversation_analyses_analyzed_up_to_message_id_fkey';
            columns: ['analyzed_up_to_message_id'];
            isOneToOne: false;
            referencedRelation: 'messages';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'conversation_analyses_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'conversation_analyses_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      conversations: {
        Row: {
          created_at: string | null;
          id: string;
          title: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          title?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          title?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'conversations_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      cron: {
        Row: {
          assistant_id: string | null;
          created_at: string | null;
          cron_id: string;
          end_time: string | null;
          metadata: Json;
          next_run_date: string | null;
          on_run_completed: string | null;
          payload: Json;
          schedule: string;
          thread_id: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          assistant_id?: string | null;
          created_at?: string | null;
          cron_id?: string;
          end_time?: string | null;
          metadata?: Json;
          next_run_date?: string | null;
          on_run_completed?: string | null;
          payload?: Json;
          schedule: string;
          thread_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          assistant_id?: string | null;
          created_at?: string | null;
          cron_id?: string;
          end_time?: string | null;
          metadata?: Json;
          next_run_date?: string | null;
          on_run_completed?: string | null;
          payload?: Json;
          schedule?: string;
          thread_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'cron_assistant_id_fkey';
            columns: ['assistant_id'];
            isOneToOne: false;
            referencedRelation: 'assistant';
            referencedColumns: ['assistant_id'];
          },
          {
            foreignKeyName: 'cron_thread_id_fkey';
            columns: ['thread_id'];
            isOneToOne: false;
            referencedRelation: 'thread';
            referencedColumns: ['thread_id'];
          },
        ];
      };
      emotional_snapshots: {
        Row: {
          activity_session_id: string | null;
          activity_type: string | null;
          arousal: number | null;
          confidence: number | null;
          conversation_id: string | null;
          created_at: string | null;
          detected_triggers: string[] | null;
          id: string;
          intensity: number | null;
          message_id: string | null;
          mood_rating: number | null;
          primary_emotion: string;
          secondary_emotion: string | null;
          source: string;
          user_id: string;
          valence: number | null;
        };
        Insert: {
          activity_session_id?: string | null;
          activity_type?: string | null;
          arousal?: number | null;
          confidence?: number | null;
          conversation_id?: string | null;
          created_at?: string | null;
          detected_triggers?: string[] | null;
          id?: string;
          intensity?: number | null;
          message_id?: string | null;
          mood_rating?: number | null;
          primary_emotion: string;
          secondary_emotion?: string | null;
          source: string;
          user_id: string;
          valence?: number | null;
        };
        Update: {
          activity_session_id?: string | null;
          activity_type?: string | null;
          arousal?: number | null;
          confidence?: number | null;
          conversation_id?: string | null;
          created_at?: string | null;
          detected_triggers?: string[] | null;
          id?: string;
          intensity?: number | null;
          message_id?: string | null;
          mood_rating?: number | null;
          primary_emotion?: string;
          secondary_emotion?: string | null;
          source?: string;
          user_id?: string;
          valence?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'emotional_snapshots_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'emotional_snapshots_message_id_fkey';
            columns: ['message_id'];
            isOneToOne: false;
            referencedRelation: 'messages';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'emotional_snapshots_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      meditation_scripts: {
        Row: {
          created_at: string | null;
          duration_estimate_seconds: number;
          has_personalization_placeholders: boolean | null;
          id: string;
          is_active: boolean | null;
          language: string | null;
          placeholders: Json | null;
          script_content: string;
          title: string;
          type: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          duration_estimate_seconds: number;
          has_personalization_placeholders?: boolean | null;
          id: string;
          is_active?: boolean | null;
          language?: string | null;
          placeholders?: Json | null;
          script_content: string;
          title: string;
          type: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          duration_estimate_seconds?: number;
          has_personalization_placeholders?: boolean | null;
          id?: string;
          is_active?: boolean | null;
          language?: string | null;
          placeholders?: Json | null;
          script_content?: string;
          title?: string;
          type?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      memories: {
        Row: {
          ai_response: string;
          combined_text: string;
          conversation_id: string | null;
          created_at: string | null;
          embedding: unknown;
          id: string;
          metadata: Json | null;
          user_id: string;
          user_message: string;
        };
        Insert: {
          ai_response: string;
          combined_text: string;
          conversation_id?: string | null;
          created_at?: string | null;
          embedding?: unknown;
          id?: string;
          metadata?: Json | null;
          user_id: string;
          user_message: string;
        };
        Update: {
          ai_response?: string;
          combined_text?: string;
          conversation_id?: string | null;
          created_at?: string | null;
          embedding?: unknown;
          id?: string;
          metadata?: Json | null;
          user_id?: string;
          user_message?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'memories_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'memories_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      messages: {
        Row: {
          content: string;
          conversation_id: string;
          created_at: string | null;
          id: string;
          metadata: Json | null;
          role: string;
          search_vector: unknown;
        };
        Insert: {
          content: string;
          conversation_id: string;
          created_at?: string | null;
          id?: string;
          metadata?: Json | null;
          role: string;
          search_vector?: unknown;
        };
        Update: {
          content?: string;
          conversation_id?: string;
          created_at?: string | null;
          id?: string;
          metadata?: Json | null;
          role?: string;
          search_vector?: unknown;
        };
        Relationships: [
          {
            foreignKeyName: 'messages_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string | null;
          display_name: string | null;
          id: string;
          preferences: Json | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          display_name?: string | null;
          id: string;
          preferences?: Json | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          display_name?: string | null;
          id?: string;
          preferences?: Json | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      run: {
        Row: {
          assistant_id: string;
          created_at: string | null;
          kwargs: Json;
          metadata: Json;
          multitask_strategy: string;
          run_id: string;
          status: string;
          thread_id: string;
          updated_at: string | null;
        };
        Insert: {
          assistant_id: string;
          created_at?: string | null;
          kwargs: Json;
          metadata?: Json;
          multitask_strategy?: string;
          run_id?: string;
          status?: string;
          thread_id: string;
          updated_at?: string | null;
        };
        Update: {
          assistant_id?: string;
          created_at?: string | null;
          kwargs?: Json;
          metadata?: Json;
          multitask_strategy?: string;
          run_id?: string;
          status?: string;
          thread_id?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      schema_migrations: {
        Row: {
          dirty: boolean;
          version: number;
        };
        Insert: {
          dirty: boolean;
          version: number;
        };
        Update: {
          dirty?: boolean;
          version?: number;
        };
        Relationships: [];
      };
      store: {
        Row: {
          created_at: string | null;
          expires_at: string | null;
          key: string;
          prefix: string;
          ttl_minutes: number | null;
          updated_at: string | null;
          value: Json;
        };
        Insert: {
          created_at?: string | null;
          expires_at?: string | null;
          key: string;
          prefix: string;
          ttl_minutes?: number | null;
          updated_at?: string | null;
          value: Json;
        };
        Update: {
          created_at?: string | null;
          expires_at?: string | null;
          key?: string;
          prefix?: string;
          ttl_minutes?: number | null;
          updated_at?: string | null;
          value?: Json;
        };
        Relationships: [];
      };
      thread: {
        Row: {
          config: Json;
          created_at: string | null;
          error: string | null;
          interrupts: Json;
          metadata: Json;
          status: string;
          thread_id: string;
          updated_at: string | null;
          values: Json | null;
        };
        Insert: {
          config?: Json;
          created_at?: string | null;
          error?: string | null;
          interrupts?: Json;
          metadata?: Json;
          status?: string;
          thread_id?: string;
          updated_at?: string | null;
          values?: Json | null;
        };
        Update: {
          config?: Json;
          created_at?: string | null;
          error?: string | null;
          interrupts?: Json;
          metadata?: Json;
          status?: string;
          thread_id?: string;
          updated_at?: string | null;
          values?: Json | null;
        };
        Relationships: [];
      };
      thread_ttl: {
        Row: {
          created_at: string;
          expires_at: string | null;
          id: string;
          strategy: string;
          thread_id: string;
          ttl_minutes: number;
        };
        Insert: {
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          strategy?: string;
          thread_id: string;
          ttl_minutes: number;
        };
        Update: {
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          strategy?: string;
          thread_id?: string;
          ttl_minutes?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'thread_ttl_thread_id_fkey';
            columns: ['thread_id'];
            isOneToOne: false;
            referencedRelation: 'thread';
            referencedColumns: ['thread_id'];
          },
        ];
      };
      user_generated_meditations: {
        Row: {
          audio_duration_seconds: number | null;
          audio_url: string | null;
          conversation_id: string | null;
          created_at: string;
          duration_seconds: number;
          error_message: string | null;
          generation_context: Json;
          id: string;
          is_favorite: boolean;
          last_played_at: string | null;
          meditation_type: string;
          mood_after: number | null;
          mood_before: number | null;
          notes: string | null;
          play_count: number;
          script_content: string;
          status: string;
          title: string;
          updated_at: string;
          user_id: string;
          voice_id: string;
          voice_name: string;
        };
        Insert: {
          audio_duration_seconds?: number | null;
          audio_url?: string | null;
          conversation_id?: string | null;
          created_at?: string;
          duration_seconds: number;
          error_message?: string | null;
          generation_context?: Json;
          id?: string;
          is_favorite?: boolean;
          last_played_at?: string | null;
          meditation_type: string;
          mood_after?: number | null;
          mood_before?: number | null;
          notes?: string | null;
          play_count?: number;
          script_content: string;
          status?: string;
          title: string;
          updated_at?: string;
          user_id: string;
          voice_id: string;
          voice_name: string;
        };
        Update: {
          audio_duration_seconds?: number | null;
          audio_url?: string | null;
          conversation_id?: string | null;
          created_at?: string;
          duration_seconds?: number;
          error_message?: string | null;
          generation_context?: Json;
          id?: string;
          is_favorite?: boolean;
          last_played_at?: string | null;
          meditation_type?: string;
          mood_after?: number | null;
          mood_before?: number | null;
          notes?: string | null;
          play_count?: number;
          script_content?: string;
          status?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
          voice_id?: string;
          voice_name?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_generated_meditations_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
        ];
      };
      user_wellness_profiles: {
        Row: {
          actual_communication_style: string | null;
          challenges_persisting: string[] | null;
          conversation_frequency: string | null;
          created_at: string | null;
          current_primary_concern: string | null;
          emotional_baseline: string | null;
          emotional_baseline_updated_at: string | null;
          engagement_trend: string | null;
          first_interaction_at: string | null;
          goals_progress: Json | null;
          improvements_noted: string[] | null;
          last_interaction_at: string | null;
          preferred_time_of_day: string | null;
          recurring_topics: string[] | null;
          recurring_triggers: string[] | null;
          responds_well_to: string[] | null;
          total_activities_completed: number | null;
          total_conversations: number | null;
          total_engagement_minutes: number | null;
          typical_session_length_seconds: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          actual_communication_style?: string | null;
          challenges_persisting?: string[] | null;
          conversation_frequency?: string | null;
          created_at?: string | null;
          current_primary_concern?: string | null;
          emotional_baseline?: string | null;
          emotional_baseline_updated_at?: string | null;
          engagement_trend?: string | null;
          first_interaction_at?: string | null;
          goals_progress?: Json | null;
          improvements_noted?: string[] | null;
          last_interaction_at?: string | null;
          preferred_time_of_day?: string | null;
          recurring_topics?: string[] | null;
          recurring_triggers?: string[] | null;
          responds_well_to?: string[] | null;
          total_activities_completed?: number | null;
          total_conversations?: number | null;
          total_engagement_minutes?: number | null;
          typical_session_length_seconds?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          actual_communication_style?: string | null;
          challenges_persisting?: string[] | null;
          conversation_frequency?: string | null;
          created_at?: string | null;
          current_primary_concern?: string | null;
          emotional_baseline?: string | null;
          emotional_baseline_updated_at?: string | null;
          engagement_trend?: string | null;
          first_interaction_at?: string | null;
          goals_progress?: Json | null;
          improvements_noted?: string[] | null;
          last_interaction_at?: string | null;
          preferred_time_of_day?: string | null;
          recurring_topics?: string[] | null;
          recurring_triggers?: string[] | null;
          responds_well_to?: string[] | null;
          total_activities_completed?: number | null;
          total_conversations?: number | null;
          total_engagement_minutes?: number | null;
          typical_session_length_seconds?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_wellness_profiles_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      generate_conversation_title: {
        Args: { p_conversation_id: string };
        Returns: string;
      };
      get_conversations_with_preview: {
        Args: { p_limit?: number; p_offset?: number; p_user_id: string };
        Returns: {
          created_at: string;
          id: string;
          last_message_at: string;
          last_message_content: string;
          last_message_role: string;
          message_count: number;
          title: string;
          updated_at: string;
        }[];
      };
      get_user_wellness_context: { Args: { p_user_id: string }; Returns: Json };
      search_conversation_analyses: {
        Args: {
          p_embedding: unknown;
          p_limit?: number;
          p_similarity_threshold?: number;
          p_user_id: string;
        };
        Returns: {
          analysis_summary: string;
          concerns_raised: string[];
          conversation_id: string;
          created_at: string;
          id: string;
          primary_emotion: string;
          similarity: number;
          topics_discussed: string[];
        }[];
      };
      search_conversations_keyword: {
        Args: { p_limit?: number; p_query: string; p_user_id: string };
        Returns: {
          conversation_id: string;
          conversation_title: string;
          created_at: string;
          message_content: string;
          message_id: string;
          message_role: string;
          rank: number;
        }[];
      };
      search_memories: {
        Args: {
          p_embedding: unknown;
          p_limit?: number;
          p_similarity_threshold?: number;
          p_user_id: string;
        };
        Returns: {
          ai_response: string;
          created_at: string;
          id: string;
          metadata: Json;
          similarity: number;
          user_message: string;
        }[];
      };
      text2ltree: { Args: { '': string }; Returns: unknown };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
