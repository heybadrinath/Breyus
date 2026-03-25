import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { blogAuthService } from '../services/blog-portal.service';
import type {
  BlogUser,
  BlogSignupPayload,
  BlogLoginPayload,
  BreyusMemberOtpVerifyPayload,
} from '../types';

interface BlogAuthContextType {
  // State
  user: BlogUser | null;
  isLoading: boolean;
  loading: boolean; // Alias for isLoading
  isAuthenticated: boolean;
  isBrèyusMember: boolean;
  isWriter: boolean;

  // Actions
  login: (payload: BlogLoginPayload) => Promise<void>;
  signup: (payload: BlogSignupPayload) => Promise<void>;
  loginWithBreyusOtp: (payload: BreyusMemberOtpVerifyPayload) => Promise<void>;
  loginWithSSO: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const BlogAuthContext = createContext<BlogAuthContextType | undefined>(undefined);

interface BlogAuthProviderProps {
  children: ReactNode;
}

/**
 * BlogAuthProvider - Manages blog portal authentication state
 *
 * This is separate from the main Breyus auth context.
 * Blog portal has its own session management.
 */
export function BlogAuthProvider({ children }: BlogAuthProviderProps) {
  const [user, setUser] = useState<BlogUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Derived state
  const isAuthenticated = !!user;
  const isBrèyusMember = user?.isBrèyusMember ?? false;
  const isWriter = user?.isWriter ?? false;

  /**
   * Fetch current user on mount
   */
  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await blogAuthService.getCurrentUser();
      setUser(currentUser);
    } catch {
      // Not authenticated or session expired
      setUser(null);
    }
  }, []);

  /**
   * Initial auth check
   */
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      await refreshUser();
      setIsLoading(false);
    };
    checkAuth();
  }, [refreshUser]);

  /**
   * Login with email/password
   */
  const login = useCallback(async (payload: BlogLoginPayload) => {
    const response = await blogAuthService.login(payload);
    setUser(response.data.user);
  }, []);

  /**
   * Signup as blog-only user
   */
  const signup = useCallback(async (payload: BlogSignupPayload) => {
    const response = await blogAuthService.signup(payload);
    setUser(response.data.user);
  }, []);

  /**
   * Login with Breyus OTP verification
   */
  const loginWithBreyusOtp = useCallback(async (payload: BreyusMemberOtpVerifyPayload) => {
    const response = await blogAuthService.verifyBreyusOtp(payload);
    setUser(response.data.user);
  }, []);

  /**
   * Login with SSO (active Breyus session - no OTP required)
   */
  const loginWithSSO = useCallback(async () => {
    const response = await blogAuthService.ssoLogin();
    setUser(response.data.user);
  }, []);

  /**
   * Logout
   */
  const logout = useCallback(async () => {
    try {
      await blogAuthService.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value: BlogAuthContextType = {
    user,
    isLoading,
    loading: isLoading, // Alias
    isAuthenticated,
    isBrèyusMember,
    isWriter,
    login,
    signup,
    loginWithBreyusOtp,
    loginWithSSO,
    logout,
    refreshUser,
  };

  return (
    <BlogAuthContext.Provider value={value}>
      {children}
    </BlogAuthContext.Provider>
  );
}

/**
 * Hook to access blog auth context
 */
export function useBlogAuth() {
  const context = useContext(BlogAuthContext);
  if (context === undefined) {
    throw new Error('useBlogAuth must be used within a BlogAuthProvider');
  }
  return context;
}

/**
 * Hook to require blog authentication
 * Returns user (never null) or redirects to login
 */
export function useRequireBlogAuth() {
  const { user, isLoading, isAuthenticated } = useBlogAuth();

  if (isLoading) {
    return { user: null, isLoading: true };
  }

  if (!isAuthenticated) {
    // In a real implementation, you'd redirect to login
    // For now, we just return null
    return { user: null, isLoading: false };
  }

  return { user: user!, isLoading: false };
}

/**
 * Hook to require Breyus membership
 * Returns user if they're a Breyus member, otherwise indicates restriction
 */
export function useRequireBrèyusMember() {
  const { user, isLoading, isBrèyusMember } = useBlogAuth();

  if (isLoading) {
    return { user: null, isLoading: true, hasAccess: false };
  }

  return {
    user,
    isLoading: false,
    hasAccess: isBrèyusMember,
  };
}

/**
 * Hook to require writer status
 * Returns user if they're a writer, otherwise indicates restriction
 */
export function useRequireWriter() {
  const { user, isLoading, isWriter } = useBlogAuth();

  if (isLoading) {
    return { user: null, isLoading: true, hasAccess: false };
  }

  return {
    user,
    isLoading: false,
    hasAccess: isWriter,
  };
}

export default BlogAuthContext;
