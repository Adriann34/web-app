export interface Task {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD format
  startTime?: string; // HH:MM format
  endTime?: string; // HH:MM format
  allDay: boolean;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category: 'work' | 'personal' | 'health' | 'family';
  color?: string;
  location?: string;
  reminders?: number[]; // minutes before event
  recurring?: {
    type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: string; // Make this optional to match TaskFormData
  };
  createdAt: string;
  updatedAt: string;
}

export interface TaskFormData {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  priority: 'low' | 'medium' | 'high';
  category: 'work' | 'personal' | 'health' | 'family';
  location: string;
  reminders: number[];
  recurring: {
    type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate: string; // Keep this as required string for form
  };
}