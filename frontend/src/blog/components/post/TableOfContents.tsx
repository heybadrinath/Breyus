import { useState, useEffect, useCallback } from 'react';
import { List, ChevronDown, ChevronUp } from 'lucide-react';
import type { TiptapContent, TiptapNode } from '../../../types/marketplaceTypes';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: TiptapContent | undefined;
  className?: string;
}

/**
 * TableOfContents - Extracts headings from Tiptap content and displays navigable TOC
 *
 * Features:
 * - Extracts H1, H2, H3 from tiptapContent JSON
 * - Displays as nested list on desktop sidebar
 * - Highlights current section based on scroll position
 * - Click to smooth scroll to heading
 * - Collapsible on mobile
 */
export function TableOfContents({ content, className = '' }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Extract headings from Tiptap content
  useEffect(() => {
    if (!content?.content) {
      setHeadings([]);
      return;
    }

    const extractedHeadings: TOCItem[] = [];
    let headingIndex = 0;

    const extractFromNode = (node: TiptapNode) => {
      if (node.type === 'heading' && node.attrs?.level) {
        const text = extractTextFromNode(node);
        if (text) {
          const id = `heading-${headingIndex}`;
          extractedHeadings.push({
            id,
            text,
            level: node.attrs.level as number,
          });
          headingIndex++;
        }
      }

      // Recurse into children
      if (node.content) {
        node.content.forEach(extractFromNode);
      }
    };

    content.content.forEach(extractFromNode);
    setHeadings(extractedHeadings);
  }, [content]);

  // Extract plain text from a node
  const extractTextFromNode = (node: TiptapNode): string => {
    if (node.type === 'text' && node.text) {
      return node.text;
    }
    if (node.content) {
      return node.content.map(extractTextFromNode).join('');
    }
    return '';
  };

  // Track scroll position to highlight active heading
  useEffect(() => {
    if (headings.length === 0) return;

    const handleScroll = () => {
      // Find all heading elements in the document
      const headingElements = headings.map((h) => {
        // Try to find by ID first (if we add IDs to rendered headings)
        const byId = document.getElementById(h.id);
        if (byId) return byId;

        // Otherwise, try to find by text content
        const allHeadings = document.querySelectorAll('h1, h2, h3');
        return Array.from(allHeadings).find(
          (el) => el.textContent?.trim() === h.text
        );
      });

      // Find the heading that's currently at or above the viewport center
      const scrollTop = window.scrollY;
      const viewportCenter = scrollTop + window.innerHeight / 3;

      let currentIndex = 0;
      for (let i = 0; i < headingElements.length; i++) {
        const el = headingElements[i];
        if (el) {
          const rect = el.getBoundingClientRect();
          const elementTop = rect.top + scrollTop;
          if (elementTop <= viewportCenter) {
            currentIndex = i;
          }
        }
      }

      if (headings[currentIndex]) {
        setActiveId(headings[currentIndex].id);
      }
    };

    // Initial check
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [headings]);

  // Scroll to heading
  const scrollToHeading = useCallback((headingItem: TOCItem) => {
    // Try to find by ID first
    let element = document.getElementById(headingItem.id);

    // Otherwise, find by text content
    if (!element) {
      const allHeadings = document.querySelectorAll('h1, h2, h3');
      element = (Array.from(allHeadings).find(
        (el) => el.textContent?.trim() === headingItem.text
      ) as HTMLElement | undefined) || null;
    }

    if (element) {
      const offset = 80; // Account for fixed header
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth',
      });
    }
  }, []);

  // Don't render if no headings
  if (headings.length === 0) {
    return null;
  }

  return (
    <nav className={`toc-container ${className}`} aria-label="Table of contents">
      {/* Header with collapse toggle (mobile) */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between lg:justify-start gap-2 p-3 lg:p-0 lg:mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900 transition-colors"
        aria-expanded={!isCollapsed}
      >
        <span className="flex items-center gap-2">
          <List className="h-4 w-4" />
          Contents
        </span>
        <span className="lg:hidden">
          {isCollapsed ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </span>
      </button>

      {/* TOC List */}
      <ul
        className={`space-y-1 transition-all duration-200 ${
          isCollapsed ? 'max-h-0 overflow-hidden lg:max-h-none lg:overflow-visible' : 'max-h-[500px]'
        }`}
      >
        {headings.map((heading) => (
          <li
            key={heading.id}
            style={{ paddingLeft: `${(heading.level - 1) * 12}px` }}
          >
            <button
              onClick={() => scrollToHeading(heading)}
              className={`block w-full text-left py-1.5 px-3 text-sm rounded-lg transition-colors ${
                activeId === heading.id
                  ? 'bg-[#B8860B]/10 text-[#B8860B] font-medium border-l-2 border-[#B8860B]'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="line-clamp-2">{heading.text}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default TableOfContents;
