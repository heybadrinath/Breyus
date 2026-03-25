import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Linkedin, Mail, Send } from 'lucide-react';
import { blogPostsService } from '../../services/blog-portal.service';

/**
 * BlogFooter - Clean dark footer with newsletter subscribe form
 *
 * Features:
 * - Newsletter email subscribe form
 * - Quick links to categories
 * - Social links
 * - Updated color palette (dark navy + gold accents)
 * - Scroll-responsive visibility
 */
export function BlogFooter() {
  const currentYear = new Date().getFullYear();
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [subscribeMessage, setSubscribeMessage] = useState('');
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      const isAtBottom = currentScrollY + windowHeight >= documentHeight - 100;
      const isPastThreshold = currentScrollY > 200;
      const isScrollingDown = currentScrollY > lastScrollY.current;

      if (isAtBottom || (isPastThreshold && isScrollingDown)) {
        setIsVisible(true);
      } else if (!isAtBottom && !isScrollingDown && currentScrollY < lastScrollY.current - 50) {
        setIsVisible(false);
      }

      lastScrollY.current = currentScrollY;
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubscribeStatus('loading');
    try {
      await blogPostsService.subscribeNewsletter(email.trim(), 'blog_footer');
      setSubscribeStatus('success');
      setSubscribeMessage('Subscribed successfully!');
      setEmail('');
      setTimeout(() => setSubscribeStatus('idle'), 4000);
    } catch (err: any) {
      setSubscribeStatus('error');
      setSubscribeMessage(err?.response?.data?.message || 'Failed to subscribe. Please try again.');
      setTimeout(() => setSubscribeStatus('idle'), 4000);
    }
  };

  return (
    <div
      className="grid transition-[grid-template-rows,opacity] duration-500 ease-in-out"
      style={{
        gridTemplateRows: isVisible ? '1fr' : '0fr',
        opacity: isVisible ? 1 : 0,
      }}
    >
      <div className="overflow-hidden">
        <footer className="bg-[#1A1A2E] text-gray-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Brand + Subscribe */}
              <div className="col-span-1 md:col-span-2">
                <Link to="/blog" className="inline-flex items-center space-x-2 mb-6">
                  <span className="text-3xl font-bold text-[#B8860B]">Breyus</span>
                  <span className="text-xl text-gray-500 font-medium">Blog</span>
                </Link>
                <p className="text-gray-400 mb-6 max-w-md text-lg leading-relaxed">
                  Stay updated with the latest insights on global commodity trading,
                  market analysis, and industry trends from Breyus experts.
                </p>

                {/* Newsletter Subscribe Form */}
                <form onSubmit={handleSubscribe} className="flex gap-2 max-w-md">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-[#B8860B] transition-colors"
                    disabled={subscribeStatus === 'loading'}
                  />
                  <button
                    type="submit"
                    disabled={subscribeStatus === 'loading'}
                    className="px-4 py-2.5 bg-[#B8860B] text-white rounded-lg hover:bg-[#9A7209] transition-colors font-semibold flex items-center gap-2 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    <span className="hidden sm:inline">Subscribe</span>
                  </button>
                </form>
                {subscribeStatus !== 'idle' && (
                  <p className={`mt-2 text-sm ${subscribeStatus === 'success' ? 'text-green-400' : subscribeStatus === 'error' ? 'text-red-400' : 'text-gray-400'}`}>
                    {subscribeStatus === 'loading' ? 'Subscribing...' : subscribeMessage}
                  </p>
                )}

                {/* Social Links */}
                <div className="flex space-x-3 mt-6">
                  <a
                    href="https://twitter.com/breyus"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-500 hover:text-[#B8860B] hover:bg-white/10 transition-colors"
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                  <a
                    href="https://linkedin.com/company/breyus"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-500 hover:text-[#B8860B] hover:bg-white/10 transition-colors"
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                  <a
                    href="mailto:blog@breyus.com"
                    className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-500 hover:text-[#B8860B] hover:bg-white/10 transition-colors"
                  >
                    <Mail className="h-5 w-5" />
                  </a>
                </div>
              </div>

              {/* Categories */}
              <div>
                <h4 className="text-white font-semibold mb-4">Categories</h4>
                <ul className="space-y-2">
                  <li>
                    <Link to="/blog/category/commodities" className="text-gray-400 hover:text-[#B8860B] transition-colors">
                      Commodities
                    </Link>
                  </li>
                  <li>
                    <Link to="/blog/category/trading" className="text-gray-400 hover:text-[#B8860B] transition-colors">
                      Trading
                    </Link>
                  </li>
                  <li>
                    <Link to="/blog/category/market-analysis" className="text-gray-400 hover:text-[#B8860B] transition-colors">
                      Market Analysis
                    </Link>
                  </li>
                  <li>
                    <Link to="/blog/category/sustainability" className="text-gray-400 hover:text-[#B8860B] transition-colors">
                      Sustainability
                    </Link>
                  </li>
                  <li>
                    <Link to="/blog/category/technology" className="text-gray-400 hover:text-[#B8860B] transition-colors">
                      Technology
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="text-white font-semibold mb-4">Quick Links</h4>
                <ul className="space-y-2">
                  <li>
                    <Link to="/blog" className="text-gray-400 hover:text-[#B8860B] transition-colors">
                      Home
                    </Link>
                  </li>
                  <li>
                    <a href="/" className="text-gray-400 hover:text-[#B8860B] transition-colors">
                      Breyus Platform
                    </a>
                  </li>
                  <li>
                    <Link to="/blog/login" className="text-gray-400 hover:text-[#B8860B] transition-colors">
                      Sign In
                    </Link>
                  </li>
                  <li>
                    <a href="/onboarding" className="text-gray-400 hover:text-[#B8860B] transition-colors">
                      Join Breyus
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-500 text-sm font-medium">
                &copy; {currentYear} Breyus. All rights reserved.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <Link to="/privacy" className="text-gray-500 hover:text-[#B8860B] text-sm font-medium transition-colors">
                  Privacy Policy
                </Link>
                <Link to="/terms" className="text-gray-500 hover:text-[#B8860B] text-sm font-medium transition-colors">
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default BlogFooter;
