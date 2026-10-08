export interface Quest {
  id: string;
  target: string;
  category: 'forest' | 'meadow' | 'water_sky' | 'micro_nature' | 'custom';
  title: string;
  description: string;
  iconName: string;
  difficulty: 'easy' | 'medium' | 'hard';
  hints: string[];
}

export interface VisionVerificationResult {
  is_valid: boolean;
  detected_target: string;
  confidence_score: number;
  rejection_reason: string | null;
  nature_fact: string;
}

export interface JournalEntry {
  id: string;
  questTarget: string;
  questTitle: string;
  photoDataUrl: string;
  timestamp: number;
  verification: VisionVerificationResult;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  targetCount: number;
  currentCount: number;
}

export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'user' | 'admin';
  totalQuestsCompleted: number;
  streakDays: number;
  longestStreak?: number;
  lastQuestDate?: string; // Format: 'YYYY-MM-DD'
  completedDates?: string[]; // Array of unique 'YYYY-MM-DD' dates completed
  authenticityScore: number;
  createdAt: string;
  lastLoginAt: string;
  favoriteBiome?: string;
  bio?: string;
}

