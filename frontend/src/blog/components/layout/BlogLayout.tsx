import React, { ReactNode } from 'react';
import { BlogHeader } from './BlogHeader';
import { BlogFooter } from './BlogFooter';
import { BlogAuthProvider } from '../../context/BlogAuthContext';
import { ErrorBoundary } from '../shared/ErrorBoundary';

interface BlogLayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
}

/**
 * BlogLayout - Main layout wrapper for all blog pages
 *
 * Provides:
 * - BlogAuthProvider for authentication context
 * - ErrorBoundary for graceful error handling
 * - Consistent header and footer
 * - Clean white background
 */
export function BlogLayout({ children, hideFooter = false }: BlogLayoutProps) {
  return (
    <BlogAuthProvider>
      <div className="min-h-screen flex flex-col bg-white">
        <BlogHeader />
        <main className="flex-1 flex flex-col">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
        {!hideFooter && (
          <div className="mt-auto">
            <BlogFooter />
          </div>
        )}
      </div>
    </BlogAuthProvider>
  );
}

/**
 * BlogLayoutInner - Layout without auth provider
 * Use when BlogAuthProvider is already provided (e.g., nested routes)
 */
export function BlogLayoutInner({ children, hideFooter = false }: BlogLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <BlogHeader />
      <main className="flex-1 flex flex-col">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
      {!hideFooter && (
        <div className="mt-auto">
          <BlogFooter />
        </div>
      )}
    </div>
  );
}

export default BlogLayout;
