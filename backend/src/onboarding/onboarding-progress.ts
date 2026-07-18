export const ONBOARDING_PROGRESS = {
  ACCOUNT_CREATED: 20,
  COMPANY_DETAILS: 40,
  BUSINESS_DETAILS: 60,
  COMPANY_PROFILE: 80,
  COMPLETED: 100,
} as const;

export function getOnboardingResumeStep(progress = 0): number {
  if (progress >= ONBOARDING_PROGRESS.COMPANY_PROFILE) return 5;
  if (progress >= ONBOARDING_PROGRESS.BUSINESS_DETAILS) return 4;
  if (progress >= ONBOARDING_PROGRESS.COMPANY_DETAILS) return 3;

  // A user record is only created after identity verification and password setup,
  // so an incomplete account always resumes at business details at minimum.
  return 2;
}
