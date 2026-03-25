import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBlogAuth } from '../context/BlogAuthContext';
import { blogPortalService } from '../services/blog-portal.service';
import { BlogLayout } from '../components/layout/BlogLayout';

type InviteStatus = 'loading' | 'valid' | 'invalid' | 'expired' | 'used' | 'error';

/**
 * WriterInvitePage - Page for redeeming writer invite links
 *
 * Flow:
 * 1. Validate the invite token
 * 2. If user is logged in, claim the invite immediately
 * 3. If not logged in, redirect to login with invite token stored
 * 4. After login, automatically claim the invite
 */
export function WriterInvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useBlogAuth();

  const [status, setStatus] = useState<InviteStatus>('loading');
  const [message, setMessage] = useState<string>('');
  const [isClaiming, setIsClaiming] = useState(false);

  // Validate invite token on mount
  useEffect(() => {
    const validateInvite = async () => {
      if (!token) {
        setStatus('invalid');
        setMessage('No invite token provided');
        return;
      }

      try {
        const result = await blogPortalService.validateInvite(token);

        if (result.valid) {
          setStatus('valid');
          // Store token for after login
          sessionStorage.setItem('writer_invite_token', token);
        } else if (result.expired) {
          setStatus('expired');
          setMessage('This invite link has expired');
        } else if (result.used) {
          setStatus('used');
          setMessage('This invite link has already been used');
        } else {
          setStatus('invalid');
          setMessage(result.message || 'Invalid invite link');
        }
      } catch (err) {
        console.error('Failed to validate invite:', err);
        setStatus('error');
        setMessage('Failed to validate invite. Please try again.');
      }
    };

    validateInvite();
  }, [token]);

  // Auto-claim if user is already logged in and invite is valid
  useEffect(() => {
    if (status === 'valid' && isAuthenticated && user && !isClaiming) {
      claimInvite();
    }
  }, [status, isAuthenticated, user]);

  const claimInvite = async () => {
    if (!token || isClaiming) return;

    setIsClaiming(true);
    try {
      await blogPortalService.claimWriterInvite(token);
      sessionStorage.removeItem('writer_invite_token');

      // Show success and redirect
      setMessage('Congratulations! You are now a writer.');
      setTimeout(() => {
        navigate('/blog/writer');
      }, 2000);
    } catch (err: any) {
      console.error('Failed to claim invite:', err);
      setStatus('error');
      setMessage(err?.response?.data?.message || 'Failed to claim invite. Please try again.');
    } finally {
      setIsClaiming(false);
    }
  };

  const handleLoginClick = () => {
    // Navigate to login with redirect back to this page
    navigate(`/blog/login?redirect=/blog/invite/${token}`);
  };

  const handleSignupClick = () => {
    // Navigate to signup with redirect back to this page
    navigate(`/blog/signup?redirect=/blog/invite/${token}`);
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <BlogLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
        </div>
      </BlogLayout>
    );
  }

  return (
    <BlogLayout>
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          {/* Loading state */}
          {status === 'loading' && (
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-[#B8860B] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <h2 className="text-xl font-semibold text-gray-900">Validating Invite...</h2>
              <p className="text-gray-600 mt-2">Please wait while we verify your invite link.</p>
            </div>
          )}

          {/* Valid invite - not logged in */}
          {status === 'valid' && !isAuthenticated && (
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                You're Invited to Write!
              </h2>
              <p className="text-gray-600 mb-8">
                You've been invited to become a blog writer on Breyus. Log in or create an account to accept this invitation.
              </p>

              <div className="space-y-4">
                <button
                  onClick={handleLoginClick}
                  className="w-full py-3 px-4 bg-[#B8860B] text-white rounded-lg font-medium hover:bg-[#9A7209] transition-colors"
                >
                  Log In to Accept
                </button>
                <button
                  onClick={handleSignupClick}
                  className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Create New Account
                </button>
              </div>

              <p className="text-sm text-gray-500 mt-6">
                This invite expires in 7 days from when it was created.
              </p>
            </div>
          )}

          {/* Valid invite - claiming */}
          {status === 'valid' && isAuthenticated && isClaiming && (
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-[#B8860B] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <h2 className="text-xl font-semibold text-gray-900">Setting Up Your Writer Access...</h2>
              <p className="text-gray-600 mt-2">Just a moment...</p>
            </div>
          )}

          {/* Success message */}
          {message && status === 'valid' && isAuthenticated && !isClaiming && (
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{message}</h2>
              <p className="text-gray-600">Redirecting to your dashboard...</p>
            </div>
          )}

          {/* Expired invite */}
          {status === 'expired' && (
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Invite Expired</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <p className="text-sm text-gray-500">
                Please contact the administrator for a new invite link.
              </p>
            </div>
          )}

          {/* Used invite */}
          {status === 'used' && (
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Already Used</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <button
                onClick={() => navigate('/blog/login')}
                className="px-6 py-2 bg-[#B8860B] text-white rounded-lg font-medium hover:bg-[#9A7209] transition-colors"
              >
                Go to Login
              </button>
            </div>
          )}

          {/* Invalid invite */}
          {status === 'invalid' && (
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invite</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <button
                onClick={() => navigate('/blog')}
                className="px-6 py-2 bg-[#B8860B] text-white rounded-lg font-medium hover:bg-[#9A7209] transition-colors"
              >
                Go to Blog
              </button>
            </div>
          )}

          {/* Error state */}
          {status === 'error' && (
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Something Went Wrong</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-[#B8860B] text-white rounded-lg font-medium hover:bg-[#9A7209] transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </BlogLayout>
  );
}

export default WriterInvitePage;
