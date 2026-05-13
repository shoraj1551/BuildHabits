export interface Habit {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
  isPremium: boolean;
  completedDates: string[]; // ISO date strings
  isArchived?: boolean; // Added for soft delete
  category: string;
}

export interface UserProfile {
  displayName: string;
  email: string;
  avatarUrl: string;
}

export interface DayLogEntry {
  id: string;
  date: string;
  createdAt: Date;
  activity: string;
  evidences?: DayLogEvidence[];
}

export interface DayLogEvidence {
  id: string;
  kind: 'finance_bill' | 'food_image' | 'other';
  name: string;
  mimeType: string;
  dataUrl: string;
  addedAt: Date;
}
