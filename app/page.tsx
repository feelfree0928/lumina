'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/hooks/useUserProfile';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';
import { UserProfile } from '@/types/profile';

export default function HomePage() {
  const router = useRouter();
  const { profile, updateProfile, isLoading } = useUserProfile();

  useEffect(() => {
    // If a profile exists, go straight to the session
    if (!isLoading && profile) {
      router.push('/session');
    }
  }, [isLoading, profile, router]);

  const handleOnboardingComplete = (newProfile: UserProfile) => {
    updateProfile(newProfile);
    router.push('/session');
  };

  if (isLoading) return null;
  if (profile) return null; // Redirecting

  return <OnboardingWizard onComplete={handleOnboardingComplete} />;
}
