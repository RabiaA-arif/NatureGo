import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User as FirebaseUser,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/firestoreError';
import { UserProfile } from '../types/nature';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginAsDemoExplorer: (name?: string, email?: string) => Promise<void>;
  loginAsAdmin: (adminEmail?: string) => Promise<void>;
  updateProfileData: (updates: Partial<UserProfile>) => Promise<void>;
  recordQuestCompletion: (score: number) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAILS = ['rabiaarifai55@gmail.com'];

// Date helper functions for consecutive daily streak calculation
function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDaysBetween(dateStrA: string, dateStrB: string): number {
  const [yA, mA, dA] = dateStrA.split('-').map(Number);
  const [yB, mB, dB] = dateStrB.split('-').map(Number);
  const dateA = new Date(yA, mA - 1, dA);
  const dateB = new Date(yB, mB - 1, dB);
  const diffTime = dateA.getTime() - dateB.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('nature_go_cached_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Determine admin status
  const isAdmin = Boolean(
    userProfile?.role === 'admin' ||
    (currentUser?.email && ADMIN_EMAILS.includes(currentUser.email.toLowerCase())) ||
    (userProfile?.email && ADMIN_EMAILS.includes(userProfile.email.toLowerCase()))
  );

  // Sync profile to localStorage for instant startup next time
  useEffect(() => {
    if (userProfile) {
      try {
        localStorage.setItem('nature_go_cached_profile', JSON.stringify(userProfile));
      } catch (e) {
        console.warn('Could not cache user profile:', e);
      }
    } else {
      localStorage.removeItem('nature_go_cached_profile');
    }
  }, [userProfile]);

  // Load or initialize user profile document in Firestore
  const syncUserProfile = async (user: FirebaseUser, forceRole?: 'user' | 'admin') => {
    const userDocRef = doc(db, 'users', user.uid);
    const isOwnerAdmin = ADMIN_EMAILS.includes((user.email || '').toLowerCase()) || forceRole === 'admin';

    try {
      const snapshot = await getDoc(userDocRef);
      const nowIso = new Date().toISOString();

      if (snapshot.exists()) {
        const existingData = snapshot.data() as UserProfile;
        const updatedRole = isOwnerAdmin ? 'admin' : (existingData.role || 'user');

        const today = getTodayDateString();
        let currentStreak = existingData.streakDays ?? 0;
        if (existingData.lastQuestDate) {
          const daysSince = getDaysBetween(today, existingData.lastQuestDate);
          if (daysSince > 1) {
            // More than 1 day missed: streak reset
            currentStreak = 0;
          }
        }
        
        const updatedProfile: UserProfile = {
          ...existingData,
          displayName: user.displayName || existingData.displayName || 'Nature Explorer',
          photoURL: user.photoURL || existingData.photoURL || '',
          lastLoginAt: nowIso,
          role: updatedRole,
          streakDays: currentStreak,
          longestStreak: Math.max(existingData.longestStreak || 0, currentStreak),
        };

        await updateDoc(userDocRef, {
          lastLoginAt: nowIso,
          role: updatedRole,
          displayName: updatedProfile.displayName,
          photoURL: updatedProfile.photoURL,
          streakDays: currentStreak,
        });

        setUserProfile(updatedProfile);
      } else {
        // Create new user profile document in Firestore
        const newProfile: UserProfile = {
          userId: user.uid,
          email: user.email || 'explorer@naturego.app',
          displayName: user.displayName || 'Nature Explorer',
          photoURL: user.photoURL || '',
          role: isOwnerAdmin ? 'admin' : 'user',
          totalQuestsCompleted: 0,
          streakDays: 0,
          longestStreak: 0,
          lastQuestDate: '',
          completedDates: [],
          authenticityScore: 100,
          createdAt: nowIso,
          lastLoginAt: nowIso,
          favoriteBiome: 'Forest Trail',
          bio: 'Curious naturalist exploring the outdoor wild world.',
        };

        await setDoc(userDocRef, newProfile);
        setUserProfile(newProfile);

        // If admin, record in admins collection
        if (isOwnerAdmin) {
          const adminDocRef = doc(db, 'admins', user.uid);
          await setDoc(adminDocRef, {
            userId: user.uid,
            email: user.email || '',
            assignedAt: nowIso,
          }, { merge: true });
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true);
      setCurrentUser(user);

      if (user) {
        await syncUserProfile(user);
      } else {
        // Check if there is an active demo profile
        const cached = localStorage.getItem('nature_go_cached_profile');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            setUserProfile(parsed);
          } catch {
            setUserProfile(null);
          }
        } else {
          setUserProfile(null);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Google Login
  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await syncUserProfile(result.user);
    } catch (err: unknown) {
      console.warn('Google sign-in popup notice:', err);
      // Fallback for iframe popup blocking: offer instant explorer login
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Instant 1-Click Explorer Login (stores user in database so it's easy to use next time)
  const loginAsDemoExplorer = async (name = 'Adventurer Alex', email = 'alex.explorer@naturego.app') => {
    setIsLoading(true);
    try {
      const demoUid = `user-${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const nowIso = new Date().toISOString();
      const userDocRef = doc(db, 'users', demoUid);

      const existingSnap = await getDoc(userDocRef).catch(() => null);
      let profile: UserProfile;

      if (existingSnap && existingSnap.exists()) {
        const data = existingSnap.data() as UserProfile;
        profile = {
          ...data,
          lastLoginAt: nowIso,
        };
        await updateDoc(userDocRef, { lastLoginAt: nowIso }).catch(() => {});
      } else {
        profile = {
          userId: demoUid,
          email,
          displayName: name,
          photoURL: '',
          role: 'user',
          totalQuestsCompleted: 0,
          streakDays: 1,
          authenticityScore: 100,
          createdAt: nowIso,
          lastLoginAt: nowIso,
          favoriteBiome: 'Forest Trail',
          bio: 'Outdoor scout discovering natural wonders with Nature Go.',
        };
        await setDoc(userDocRef, profile).catch(() => {});
      }

      setUserProfile(profile);
    } catch (err) {
      console.error('Error logging in demo user:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Admin Login (unlocks full administrative dashboard and stores in DB)
  const loginAsAdmin = async (adminEmail = 'rabiaarifai55@gmail.com') => {
    setIsLoading(true);
    try {
      const adminUid = `admin-${adminEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const nowIso = new Date().toISOString();
      const userDocRef = doc(db, 'users', adminUid);
      const adminDocRef = doc(db, 'admins', adminUid);

      const profile: UserProfile = {
        userId: adminUid,
        email: adminEmail,
        displayName: 'Nature Ranger Chief',
        photoURL: '',
        role: 'admin',
        totalQuestsCompleted: 12,
        streakDays: 14,
        authenticityScore: 98,
        createdAt: nowIso,
        lastLoginAt: nowIso,
        favoriteBiome: 'Alpine Summit',
        bio: 'Lead Naturalist & System Administrator overseeing outdoor verification quests.',
      };

      await setDoc(userDocRef, profile, { merge: true }).catch(() => {});
      await setDoc(adminDocRef, {
        userId: adminUid,
        email: adminEmail,
        assignedAt: nowIso,
      }, { merge: true }).catch(() => {});

      setUserProfile(profile);
    } catch (err) {
      console.error('Admin login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Update profile data in DB
  const updateProfileData = async (updates: Partial<UserProfile>) => {
    if (!userProfile) return;
    const updated = { ...userProfile, ...updates };
    setUserProfile(updated);

    try {
      const userDocRef = doc(db, 'users', userProfile.userId);
      await updateDoc(userDocRef, updates);
    } catch (err) {
      console.warn('Profile update notice:', err);
    }
  };

  // Record a completed quest into user profile progress in DB and update daily streak
  const recordQuestCompletion = async (confidenceScore: number) => {
    if (!userProfile) return;

    const today = getTodayDateString();
    const lastDate = userProfile.lastQuestDate;

    let newStreak = userProfile.streakDays || 0;

    if (!lastDate) {
      // First quest completed ever
      newStreak = 1;
    } else if (lastDate === today) {
      // Already completed at least one quest today -> streak maintained
      newStreak = Math.max(1, userProfile.streakDays || 1);
    } else {
      const daysSince = getDaysBetween(today, lastDate);
      if (daysSince === 1) {
        // Consecutive calendar day: increment streak!
        newStreak = (userProfile.streakDays || 0) + 1;
      } else {
        // More than 1 day passed: streak starts over at 1
        newStreak = 1;
      }
    }

    const currentLongest = userProfile.longestStreak || 0;
    const newLongest = Math.max(currentLongest, newStreak);

    const existingDates = userProfile.completedDates || [];
    const updatedDates = existingDates.includes(today)
      ? existingDates
      : [...existingDates.slice(-30), today];

    const newCompleted = (userProfile.totalQuestsCompleted || 0) + 1;
    const currentScore = userProfile.authenticityScore || 100;
    const newScore = Math.round((currentScore * (newCompleted - 1) + confidenceScore * 100) / newCompleted);

    const updates: Partial<UserProfile> = {
      totalQuestsCompleted: newCompleted,
      streakDays: newStreak,
      longestStreak: newLongest,
      lastQuestDate: today,
      completedDates: updatedDates,
      authenticityScore: newScore,
      lastLoginAt: new Date().toISOString(),
    };

    await updateProfileData(updates);
  };

  // Logout
  const logout = async () => {
    setIsLoading(true);
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
      setUserProfile(null);
      localStorage.removeItem('nature_go_cached_profile');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        isAdmin,
        isLoading,
        loginWithGoogle,
        loginAsDemoExplorer,
        loginAsAdmin,
        updateProfileData,
        recordQuestCompletion,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
