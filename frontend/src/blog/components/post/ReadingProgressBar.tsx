import { useState, useEffect, useRef } from 'react';

/**
 * ReadingProgressBar - Visual indicator of reading progress
 *
 * Features:
 * - Fixed position at top of viewport
 * - Width corresponds to scroll percentage through article
 * - Smooth width transition for pleasant UX
 * - Subtle styling that doesn't distract from content
 */
export function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);
  const ticking = useRef(false);

  useEffect(() => {
    const calculateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      const scrollableHeight = docHeight - winHeight;

      if (scrollableHeight > 0) {
        const currentProgress = Math.min(100, Math.max(0, (scrollTop / scrollableHeight) * 100));
        setProgress(currentProgress);
      }
    };

    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          calculateProgress();
          ticking.current = false;
        });
        ticking.current = true;
      }
    };

    // Initial calculation
    calculateProgress();

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Don't show if no progress yet (prevents flash on mount)
  if (progress === 0) {
    return null;
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 h-1 bg-transparent pointer-events-none"
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Reading progress"
    >
      <div
        className="h-full bg-gradient-to-r from-[#B8860B] to-[#D4A847] transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export default ReadingProgressBar;
