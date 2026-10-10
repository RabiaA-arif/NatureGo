import { UserProfile } from '../types/nature';

const DIRECTORY_STORAGE_KEY = 'nature_go_all_users_directory';
const LAST_ACTIVE_USER_KEY = 'nature_go_last_active_user_id';

// Default initial profiles to guarantee the admin dashboard always has active registered accounts
const DEFAULT_SYSTEM_PROFILES: UserProfile[] = [
  {
    userId: 'admin-rabiaarifai55_gmail_com',
    email: 'rabiaarifai55@gmail.com',
    displayName: 'Chief Naturalist Rabia',
    photoURL: '',
    role: 'admin',
    totalQuestsCompleted: 14,
    streakDays: 7,
    longestStreak: 12,
    lastQuestDate: new Date().toISOString().split('T')[0],
    completedDates: [],
    authenticityScore: 98,
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    lastLoginAt: new Date().toISOString(),
    favoriteBiome: 'Forest Trail',
    bio: 'Lead Naturalist & System Administrator overseeing outdoor verification quests.',
  },
  {
    userId: 'user-alex_woodland_naturego_app',
    email: 'alex.woodland@naturego.app',
    displayName: 'Alex Woodland',
    photoURL: '',
    role: 'user',
    totalQuestsCompleted: 5,
    streakDays: 4,
    longestStreak: 5,
    lastQuestDate: new Date().toISOString().split('T')[0],
    completedDates: [],
    authenticityScore: 95,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    lastLoginAt: new Date(Date.now() - 3600000).toISOString(),
    favoriteBiome: 'Riverbank & Stream',
    bio: 'Avid outdoor hiker searching for native fauna and flora.',
  },
];

/**
 * Retrieve all registered users stored locally.
 */
export function getAllSavedUsers(): UserProfile[] {
  try {
    const raw = localStorage.getItem(DIRECTORY_STORAGE_KEY);
    if (!raw) {
      // Seed with default profiles
      localStorage.setItem(DIRECTORY_STORAGE_KEY, JSON.stringify(DEFAULT_SYSTEM_PROFILES));
      return DEFAULT_SYSTEM_PROFILES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_SYSTEM_PROFILES;
  } catch (err) {
    console.warn('Error reading user directory from storage:', err);
    return DEFAULT_SYSTEM_PROFILES;
  }
}

/**
 * Persist or update a user profile in the persistent user directory.
 * Guarantees that when a user logs in, completes tasks, or signs out,
 * their data is permanently retained and visible on the admin dashboard.
 */
export function saveUserToDirectory(profile: UserProfile): void {
  if (!profile || !profile.userId) return;

  try {
    const currentList = getAllSavedUsers();
    const index = currentList.findIndex(
      (u) =>
        u.userId === profile.userId ||
        (u.email && profile.email && u.email.toLowerCase() === profile.email.toLowerCase())
    );

    let updatedList: UserProfile[];
    if (index >= 0) {
      const existing = currentList[index];
      // Merge while preserving highest quest count and most recent activity
      const merged: UserProfile = {
        ...existing,
        ...profile,
        totalQuestsCompleted: Math.max(
          existing.totalQuestsCompleted || 0,
          profile.totalQuestsCompleted || 0
        ),
        streakDays: Math.max(existing.streakDays || 0, profile.streakDays || 0),
        longestStreak: Math.max(existing.longestStreak || 0, profile.longestStreak || 0),
        lastLoginAt: profile.lastLoginAt || new Date().toISOString(),
      };
      updatedList = [...currentList];
      updatedList[index] = merged;
    } else {
      updatedList = [profile, ...currentList];
    }

    localStorage.setItem(DIRECTORY_STORAGE_KEY, JSON.stringify(updatedList));
  } catch (err) {
    console.warn('Failed to save user to directory:', err);
  }
}

/**
 * Merge users fetched from Firestore with the local persistent directory.
 * Keeps the most complete profile for each user.
 */
export function syncUsersDirectoryWithFirestore(cloudUsers: UserProfile[]): UserProfile[] {
  const localUsers = getAllSavedUsers();
  const map = new Map<string, UserProfile>();

  // 1. Add all local users
  for (const u of localUsers) {
    if (u.userId) {
      map.set(u.userId, u);
    }
  }

  // 2. Merge cloud users
  for (const cu of cloudUsers) {
    if (!cu.userId) continue;
    const existing = map.get(cu.userId);
    if (!existing) {
      map.set(cu.userId, cu);
    } else {
      map.set(cu.userId, {
        ...existing,
        ...cu,
        totalQuestsCompleted: Math.max(
          existing.totalQuestsCompleted || 0,
          cu.totalQuestsCompleted || 0
        ),
        streakDays: Math.max(existing.streakDays || 0, cu.streakDays || 0),
        longestStreak: Math.max(existing.longestStreak || 0, cu.longestStreak || 0),
        lastLoginAt: cu.lastLoginAt || existing.lastLoginAt || new Date().toISOString(),
      });
    }
  }

  const merged = Array.from(map.values());
  try {
    localStorage.setItem(DIRECTORY_STORAGE_KEY, JSON.stringify(merged));
  } catch (e) {
    console.warn('Could not persist merged user directory:', e);
  }
  return merged;
}

/**
 * Record last active user ID to seamlessly restore across browser reloads
 */
export function setLastActiveUserId(userId: string | null): void {
  try {
    if (userId) {
      localStorage.setItem(LAST_ACTIVE_USER_KEY, userId);
    } else {
      localStorage.removeItem(LAST_ACTIVE_USER_KEY);
    }
  } catch (e) {
    console.warn('Failed to record last active user id:', e);
  }
}

export function getLastActiveUserId(): string | null {
  try {
    return localStorage.getItem(LAST_ACTIVE_USER_KEY);
  } catch {
    return null;
  }
}
