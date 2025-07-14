import { DatabaseDemo } from '@/lib/supabase';

export interface Demo extends Omit<DatabaseDemo, 'updated_at' | 'status'> {
  // Demo interface now extends DatabaseDemo
  is_featured?: boolean;
  video_url?: string;
}

export interface DemoFormData extends Omit<Demo, 'id' | 'created_at' | 'page_views'> {
  // Form now uses string array directly, same as Demo
}