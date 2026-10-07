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
