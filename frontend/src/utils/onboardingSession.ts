const ONBOARDING_SESSION_KEY = "breyus:onboarding-session";

export interface OnboardingSession {
  token: string;
  email?: string;
  step: number;
}

export function getResumeStep(progress = 0): number {
  if (progress >= 80) return 5;
  if (progress >= 60) return 4;
  if (progress >= 40) return 3;
  return 2;
}

export function readOnboardingSession(): OnboardingSession | null {
  try {
    const value = window.sessionStorage.getItem(ONBOARDING_SESSION_KEY);
    if (!value) return null;

    const session = JSON.parse(value) as Partial<OnboardingSession>;
    if (!session.token || typeof session.step !== "number") return null;

    return session as OnboardingSession;
  } catch {
    return null;
  }
}

export function saveOnboardingSession(session: OnboardingSession): void {
  window.sessionStorage.setItem(
    ONBOARDING_SESSION_KEY,
    JSON.stringify(session),
  );
}

export function clearOnboardingSession(): void {
  window.sessionStorage.removeItem(ONBOARDING_SESSION_KEY);
}
