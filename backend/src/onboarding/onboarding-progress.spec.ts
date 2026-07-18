import {
  getOnboardingResumeStep,
  ONBOARDING_PROGRESS,
} from './onboarding-progress';

describe('getOnboardingResumeStep', () => {
  it.each([
    [0, 2],
    [ONBOARDING_PROGRESS.ACCOUNT_CREATED, 2],
    [ONBOARDING_PROGRESS.COMPANY_DETAILS, 3],
    [ONBOARDING_PROGRESS.BUSINESS_DETAILS, 4],
    [ONBOARDING_PROGRESS.COMPANY_PROFILE, 5],
    [ONBOARDING_PROGRESS.COMPLETED, 5],
  ])('maps progress %s to step %s', (progress, step) => {
    expect(getOnboardingResumeStep(progress)).toBe(step);
  });
});
