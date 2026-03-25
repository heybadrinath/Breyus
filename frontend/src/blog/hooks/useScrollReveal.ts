import { useEffect, useRef, useState } from 'react';

/**
 * useParallaxScroll - Creates a dramatic sticky parallax effect
 *
 * Effect: Cards slide up from below the viewport with significant movement,
 * slow down dramatically as they reach center, creating a "sticky" feel.
 *
 * @param index - Card index (for stagger delay)
 * @param options - Configuration options
 */
interface UseParallaxOptions {
  /** Parallax intensity (0-1), default 0.4 for dramatic effect */
  intensity?: number;
  /** Stagger delay in ms per card, default 40 */
  staggerDelay?: number;
  /** Disable parallax entirely */
  disabled?: boolean;
}

interface UseParallaxReturn {
  ref: React.RefObject<any>;
  style: React.CSSProperties;
  isInView: boolean;
}

export function useParallaxScroll(
  index: number,
  options: UseParallaxOptions = {}
): UseParallaxReturn {
  const {
    intensity = 0.4, // Increased for more dramatic parallax
    staggerDelay = 40,
    disabled = false,
  } = options;

  const ref = useRef<HTMLElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({
    opacity: disabled ? 1 : 0,
    transform: disabled ? 'none' : 'translateY(100px)', // Start further down
    transition: 'none',
  });
  const [isInView, setIsInView] = useState(false);
  const hasAnimatedIn = useRef(false);
  const isAnimating = useRef(false);

  useEffect(() => {
    if (disabled) {
      setStyle({ opacity: 1, transform: 'none' });
      setIsInView(true);
      return;
    }

    const element = ref.current;
    if (!element) return;

    let rafId: number;

    const updateParallax = () => {
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Calculate element position relative to viewport
      const elementCenter = rect.top + rect.height / 2;
      const viewportCenter = windowHeight / 2;

      // Distance from center (-1 = top of viewport, 0 = center, 1 = bottom)
      const normalizedPosition = (elementCenter - viewportCenter) / (windowHeight / 2);

      // Check if element is in extended viewport
      const isVisible = rect.top < windowHeight + 200 && rect.bottom > -200;

      if (isVisible) {
        setIsInView(true);

        // First time entering - trigger entrance animation
        if (!hasAnimatedIn.current) {
          hasAnimatedIn.current = true;
          isAnimating.current = true;
          const delay = Math.min(index, 8) * staggerDelay;

          setTimeout(() => {
            setStyle({
              opacity: 1,
              transform: 'translateY(0px)',
              transition: 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
            });

            // After entrance animation, enable parallax
            setTimeout(() => {
              isAnimating.current = false;
            }, 700);
          }, delay);
        } else if (!isAnimating.current) {
          // Apply continuous parallax based on scroll position
          // Cards below center move up faster, cards above center move up slower
          // This creates the "sticky in center" effect

          // Clamp the position for smoother effect
          const clampedPosition = Math.max(-1.2, Math.min(1.2, normalizedPosition));

          // Non-linear easing for sticky center feel
          // Cards slow down dramatically near center (position ~0)
          const easedPosition = Math.sign(clampedPosition) * Math.pow(Math.abs(clampedPosition), 0.7);

          // Calculate parallax offset (positive = below center, negative = above)
          const parallaxY = easedPosition * 80 * intensity;

          setStyle({
            opacity: 1,
            transform: `translateY(${parallaxY}px)`,
            transition: 'transform 0.15s ease-out',
          });
        }
      }
    };

    const handleScroll = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateParallax);
    };

    // Initial check
    setTimeout(updateParallax, 50);

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateParallax, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateParallax);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [index, intensity, staggerDelay, disabled]);

  return { ref, style, isInView };
}

/**
 * useScrollReveal - Simpler Intersection Observer based reveal
 * Fallback for situations where parallax is too heavy
 */
interface UseScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
  columnCount?: number;
  disabled?: boolean;
}

interface UseScrollRevealReturn<T extends HTMLElement> {
  ref: React.RefObject<T | null>;
  isVisible: boolean;
  staggerIndex: number;
  className: string;
  dataAttributes: { 'data-stagger': string };
}

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  index: number,
  options: UseScrollRevealOptions = {}
): UseScrollRevealReturn<T> {
  const {
    threshold = 0.1,
    rootMargin = '0px 0px -50px 0px',
    once = true,
    columnCount = 4,
    disabled = false,
  } = options;

  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(disabled);
  const hasTriggered = useRef(false);

  const staggerIndex = Math.min(index % columnCount, 7);

  useEffect(() => {
    if (disabled) {
      setIsVisible(true);
      return;
    }

    const element = ref.current;
    if (!element) return;

    if (once && hasTriggered.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            hasTriggered.current = true;

            if (once) {
              observer.unobserve(element);
            }
          } else if (!once) {
            setIsVisible(false);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, once, disabled]);

  const className = disabled
    ? ''
    : `scroll-reveal${isVisible ? ' is-visible' : ''}`;

  const dataAttributes = {
    'data-stagger': String(staggerIndex),
  };

  return {
    ref,
    isVisible,
    staggerIndex,
    className,
    dataAttributes,
  };
}

export default useScrollReveal;
