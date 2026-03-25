/**
 * ExpandableText Component
 * A "Read More" component for long text with truncation and smooth animation
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ExpandableTextProps {
  text: string;
  maxLength?: number;
  className?: string;
  textClassName?: string;
}

export const ExpandableText: React.FC<ExpandableTextProps> = ({
  text,
  maxLength = 250,
  className = '',
  textClassName = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const { shouldTruncate, truncatedText } = useMemo(() => {
    const shouldTruncate = text.length > maxLength;
    const truncatedText = shouldTruncate
      ? text.slice(0, maxLength).trim() + '...'
      : text;
    return { shouldTruncate, truncatedText };
  }, [text, maxLength]);

  if (!shouldTruncate) {
    return <p className={`${textClassName} ${className}`}>{text}</p>;
  }

  return (
    <div className={className}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={isExpanded ? 'expanded' : 'collapsed'}
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0.8 }}
          transition={{ duration: 0.15 }}
          className={textClassName}
        >
          {isExpanded ? text : truncatedText}
        </motion.p>
      </AnimatePresence>

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded"
      >
        {isExpanded ? (
          <>
            Show less
            <ChevronUp className="w-3.5 h-3.5" />
          </>
        ) : (
          <>
            Read more
            <ChevronDown className="w-3.5 h-3.5" />
          </>
        )}
      </button>
    </div>
  );
};

export default ExpandableText;
