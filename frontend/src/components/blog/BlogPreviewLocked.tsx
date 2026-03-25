import { Link } from 'react-router-dom';
import { Lock, ArrowRight, CheckCircle } from 'lucide-react';

interface BlogPreviewLockedProps {
  title: string;
  excerpt: string;
  previewContent?: string;
  redirectUrl?: string;
}

/**
 * BlogPreviewLocked - Locked content preview for non-members
 *
 * Shows:
 * - Partial content with blur/fade effect
 * - Clear membership CTA
 * - Benefits of becoming a member
 */
export function BlogPreviewLocked({
  title,
  excerpt,
  previewContent,
  redirectUrl = '/blog/login',
}: BlogPreviewLockedProps) {
  const memberBenefits = [
    'Access to all member-only articles',
    'Early access to market insights',
    'Exclusive trading guides & tips',
    'Direct chat with verified traders',
  ];

  return (
    <div className="relative">
      {/* Preview Content with Fade */}
      {previewContent && (
        <div className="relative">
          <div
            className="prose prose-gray max-w-none"
            dangerouslySetInnerHTML={{
              __html: previewContent.slice(0, 500) + '...',
            }}
          />
          {/* Fade overlay */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent" />
        </div>
      )}

      {/* Locked Content Card */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 border border-gray-200 shadow-sm">
        <div className="text-center max-w-md mx-auto">
          {/* Lock Icon */}
          <div className="w-16 h-16 mx-auto bg-[#C4A484]/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-[#C4A484]" />
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Member-Only Content
          </h3>

          <p className="text-gray-600 mb-6">
            This article is exclusively available to Breyus members. Join our
            community to unlock this and all premium content.
          </p>

          {/* Benefits List */}
          <div className="text-left bg-white rounded-xl p-4 mb-6">
            <p className="text-sm font-medium text-gray-900 mb-3">
              Breyus Members Get:
            </p>
            <ul className="space-y-2">
              {memberBenefits.map((benefit, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-gray-600"
                >
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to={redirectUrl}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#C4A484] text-white font-medium rounded-xl hover:bg-[#b39474] transition-colors"
            >
              Log In as Member
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/onboarding"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-[#C4A484] text-[#C4A484] font-medium rounded-xl hover:bg-[#C4A484]/5 transition-colors"
            >
              Join Breyus
            </Link>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Already a Breyus trader?{' '}
            <Link to={redirectUrl} className="text-[#C4A484] hover:underline">
              Log in with your account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default BlogPreviewLocked;
