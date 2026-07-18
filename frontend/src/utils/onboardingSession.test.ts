import {
  clearOnboardingSession,
  getResumeStep,
  readOnboardingSession,
  saveOnboardingSession,
} from "./onboardingSession";

describe("onboarding session", () => {
  beforeEach(() => window.sessionStorage.clear());

  it("persists a resumable session across page state resets", () => {
    saveOnboardingSession({
      token: "token",
      email: "user@example.com",
      step: 3,
    });

    expect(readOnboardingSession()).toEqual({
      token: "token",
      email: "user@example.com",
      step: 3,
    });

    clearOnboardingSession();
    expect(readOnboardingSession()).toBeNull();
  });

  it.each([
    [0, 2],
    [20, 2],
    [40, 3],
    [60, 4],
    [80, 5],
    [100, 5],
  ])("maps progress %s to step %s", (progress, step) => {
    expect(getResumeStep(progress)).toBe(step);
  });
});
