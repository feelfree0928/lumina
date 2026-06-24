'use client';

import { createContext, useContext, ReactNode } from 'react';
import { UserProfile } from '@/types/profile';
import { useUserProfile } from '@/hooks/useUserProfile';

interface UserProfileContextValue {
  profile: UserProfile | null;
  updateProfile: (p: UserProfile) => void;
  isLoading: boolean;
}

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const value = useUserProfile();
  return <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>;
}

export function useUserProfileContext(): UserProfileContextValue {
  const ctx = useContext(UserProfileContext);
  if (!ctx) throw new Error('useUserProfileContext must be used within UserProfileProvider');
  return ctx;
}
