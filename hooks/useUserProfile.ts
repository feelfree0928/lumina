'use client';

import { useState, useEffect } from 'react';
import { UserProfile } from '@/types/profile';
import { loadProfile, saveProfile } from '@/lib/profile';

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loaded = loadProfile();
    setProfile(loaded);
    setIsLoading(false);
  }, []);

  const updateProfile = (updated: UserProfile) => {
    setProfile(updated);
    saveProfile(updated);
  };

  return { profile, updateProfile, isLoading };
}
